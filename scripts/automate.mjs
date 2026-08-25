import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkAllDocDrift } from './check-doc-drift.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const VIDEOS_DIR = path.join(ROOT_DIR, 'autorecorder', 'videos');

const isWindows = process.platform === 'win32';

// Parse command line arguments
const args = process.argv.slice(2);
const shouldPull = args.includes('--pull');
const shouldUpgrade = args.includes('--upgrade');
const skipInstall = args.includes('--skip-install');
const ignoreDocDrift = args.includes('--ignore-doc-drift') || args.includes('--force');
const forwardArgs = args.filter(
  (arg) => !['--pull', '--upgrade', '--skip-install', '--ignore-doc-drift', '--force'].includes(arg),
);

console.log('═══════════════════════════════════════════════════════════════');
console.log('  🚀 CopilotKit Mastra Automation Pipeline');
console.log('═══════════════════════════════════════════════════════════════');

let frontendProc = null;

// Helper to kill a process and its child tree
function killTree(proc, signal = 'SIGTERM') {
  if (!proc || !proc.pid) return;
  try {
    if (isWindows) {
      execSync(`taskkill /pid ${proc.pid} /T /F 2>nul || exit 0`, { stdio: 'ignore' });
    } else {
      try {
        process.kill(-proc.pid, signal);
      } catch {
        proc.kill(signal);
      }
    }
  } catch {
    try {
      proc.kill(signal);
    } catch {
      // ignore
    }
  }
}

// Cleanup hook
function cleanup() {
  console.log('\n🧹 Cleaning up running processes...');
  if (frontendProc) {
    killTree(frontendProc);
    frontendProc = null;
  }
}

process.on('SIGINT', () => {
  cleanup();
  process.exit(130);
});
process.on('SIGTERM', () => {
  cleanup();
  process.exit(143);
});
process.on('exit', () => {
  cleanup();
});

// Run a command synchronously with inherited stdio
function runSync(command, cwd, description) {
  console.log(`\n▶ [Step] ${description}...`);
  try {
    execSync(command, { cwd, stdio: 'inherit', shell: true });
  } catch (err) {
    console.error(`❌ Failed during: ${description}`);
    throw err;
  }
}

// Check URL health with polling
async function waitForHealth(url, name, timeoutMs = 60000) {
  const start = Date.now();
  process.stdout.write(`⏳ Waiting for ${name} (${url})... `);
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok || res.status < 500) {
        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        process.stdout.write(`✅ READY (${elapsed}s)!\n`);
        return { ok: true, elapsedSec: Number(elapsed) };
      }
    } catch {
      // Retry
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    process.stdout.write('.');
  }
  process.stdout.write('❌ TIMEOUT\n');
  throw new Error(`Timeout waiting for ${name} at ${url}`);
}

// Warm up lazy Next.js API routes before recording
async function warmUpRuntime(url) {
  try {
    process.stdout.write(`🔥 Pre-warming Mastra Agent endpoint (${url})... `);
    await fetch(url, { signal: AbortSignal.timeout(15000) });
    process.stdout.write(`✅ Done\n`);
  } catch {
    process.stdout.write(`⚠️ Route warmed (or non-blocking error)\n`);
  }
}

function getPackageVersions() {
  const versions = { frontend: {}, backend: {} };
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'frontend', 'package.json'), 'utf8'));
    versions.frontend = {
      '@mastra/core': pkg.dependencies?.['@mastra/core'] || 'n/a',
      '@mastra/libsql': pkg.dependencies?.['@mastra/libsql'] || 'n/a',
      '@mastra/memory': pkg.dependencies?.['@mastra/memory'] || 'n/a',
      '@ag-ui/mastra': pkg.dependencies?.['@ag-ui/mastra'] || 'n/a',
      '@ag-ui/client': pkg.dependencies?.['@ag-ui/client'] || 'n/a',
      '@copilotkit/react-core': pkg.dependencies?.['@copilotkit/react-core'] || 'n/a',
      '@copilotkit/runtime': pkg.dependencies?.['@copilotkit/runtime'] || 'n/a',
      'next': pkg.dependencies?.['next'] || 'n/a',
      'react': pkg.dependencies?.['react'] || 'n/a',
    };
    versions.backend = {
      'integration-mode': 'Integrated Mastra in Next.js App Router (getLocalAgents)',
    };
  } catch {
    // ignore
  }
  return versions;
}

function generateReport(data) {
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  }

  // Get generated video files
  const videoFiles = [];
  try {
    const files = fs.readdirSync(VIDEOS_DIR);
    for (const f of files) {
      if (f.endsWith('.webm')) {
        const stats = fs.statSync(path.join(VIDEOS_DIR, f));
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        videoFiles.push({ filename: f, sizeMB: `${sizeMB} MB` });
      }
    }
  } catch {
    // ignore
  }

  const report = {
    timestamp: new Date().toISOString(),
    status: data.success ? 'SUCCESS' : 'FAILED',
    args: forwardArgs.length > 0 ? forwardArgs.join(' ') : 'all',
    upgradedPackages: shouldUpgrade,
    docDrift: {
      checkedPages: data.driftResult?.total || 0,
      driftDetected: data.driftResult?.drifted || false,
      driftedPages: data.driftResult?.driftedPages || [],
    },
    packages: getPackageVersions(),
    healthChecks: data.health || {},
    videos: videoFiles,
    error: data.error || null,
  };

  // Write JSON report
  fs.writeFileSync(path.join(VIDEOS_DIR, 'RUN_REPORT.json'), JSON.stringify(report, null, 2), 'utf8');

  // Build Markdown report
  const lines = [];
  lines.push('# 📊 CopilotKit Mastra Automation & Recording Report\n');
  lines.push(`- **Status:** ${report.status === 'SUCCESS' ? '✅ **SUCCESS**' : '❌ **FAILED**'}`);
  lines.push(`- **Generated At:** \`${report.timestamp}\``);
  lines.push(`- **Execution Mode:** \`${report.args}\``);
  lines.push(`- **Upgraded Packages:** \`${report.upgradedPackages ? 'Yes (--upgrade)' : 'No'}\`\n`);

  lines.push('## 1. 🔍 Doc Drift Check');
  if (report.docDrift.driftDetected) {
    lines.push(`⚠️ **Drift Detected** on ${report.docDrift.driftedPages.length} page(s):`);
    for (const p of report.docDrift.driftedPages) {
      lines.push(`- **[${p.severity}]** \`${p.docPath}\` (${p.file})`);
    }
  } else {
    lines.push(`✅ **No Doc Drift Detected:** All ${report.docDrift.checkedPages} pages match \`doc-snapshot/\`.`);
  }
  lines.push('');

  lines.push('## 2. 📦 Package Versions');
  lines.push('### Frontend & Mastra Runtime (`frontend/package.json`):');
  for (const [k, v] of Object.entries(report.packages.frontend)) {
    lines.push(`- **\`${k}\`**: \`${v}\``);
  }
  lines.push('');

  lines.push('## 3. 🚀 Services & Health Checks');
  lines.push(`- **Next.js & Mastra Runtime (\`:3000\`):** ${report.healthChecks.frontend ? `✅ Healthy (${report.healthChecks.frontend}s)` : '❌ Offline'}\n`);

  lines.push('## 4. 🎬 Generated Demo Videos');
  if (videoFiles.length > 0) {
    lines.push('| Video File | Status | File Size |');
    lines.push('|---|---|---|');
    for (const v of videoFiles) {
      lines.push(`| \`${v.filename}\` | ✅ Recorded | ${v.sizeMB} |`);
    }
  } else {
    lines.push('*No videos recorded in this run.*');
  }
  lines.push('');

  if (report.error) {
    lines.push('## ⚠️ Failure Details');
    lines.push(`\`\`\`\n${report.error}\n\`\`\`\n`);
  }

  fs.writeFileSync(path.join(VIDEOS_DIR, 'RUN_REPORT.md'), lines.join('\n'), 'utf8');
  console.log(`\n📄 Execution report saved to: ${path.join(VIDEOS_DIR, 'RUN_REPORT.md')}`);
}

function muxAudioFiles() {
  const audioDir = path.join(ROOT_DIR, 'autorecorder', 'audio');
  if (!fs.existsSync(audioDir)) return;

  // Check if ffmpeg exists
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
  } catch {
    console.log('ℹ️ ffmpeg not found in PATH; skipping local audio muxing.');
    return;
  }

  if (!fs.existsSync(VIDEOS_DIR)) return;
  const audioFiles = fs.readdirSync(audioDir).filter((f) => f.endsWith('.m4a') || f.endsWith('.mp3'));
  const videoFiles = fs.readdirSync(VIDEOS_DIR).filter((f) => f.endsWith('.webm') && !f.startsWith('temp_'));

  for (const audioFile of audioFiles) {
    const baseName = path.parse(audioFile).name.toLowerCase();
    const matchingVideo = videoFiles.find((f) => f.toLowerCase().includes(baseName));
    if (matchingVideo) {
      const audioPath = path.join(audioDir, audioFile);
      const inputPath = path.join(VIDEOS_DIR, matchingVideo);
      const tempPath = path.join(VIDEOS_DIR, `temp_${matchingVideo}`);
      console.log(`\n🎵 [Audio Mux]: Adding voiceover ${audioFile} to ${matchingVideo}...`);
      try {
        execSync(
          `ffmpeg -y -i "${inputPath}" -i "${audioPath}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 -shortest "${tempPath}"`,
          { stdio: 'ignore' },
        );
        fs.copyFileSync(tempPath, inputPath);
        fs.unlinkSync(tempPath);
        console.log(`✅ [Audio Mux]: Successfully added audio to ${matchingVideo}`);
      } catch (err) {
        console.warn(`⚠️ [Audio Mux Warning]: Could not mux audio:`, err.message || err);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      }
    }
  }
}

async function main() {
  const reportData = {
    success: false,
    driftResult: null,
    health: {},
    error: null,
  };

  try {
    // 0. Live Doc Drift Check
    console.log('▶ [Step 0] Checking for live documentation drift against doc-snapshot...');
    const driftResult = await checkAllDocDrift();
    reportData.driftResult = driftResult;

    if (driftResult.drifted) {
      console.log('\n🚨 [DOC DRIFT DETECTED] Upstream documentation has changed on the following pages:');
      console.log('───────────────────────────────────────────────────────────────────────────');
      for (const p of driftResult.driftedPages) {
        console.log(` • [${p.severity}] ${p.docPath}`);
        if (p.oldHash && p.newHash) {
          console.log(`   Hash: ${p.oldHash} ➔ ${p.newHash} (${p.file})`);
        }
      }
      console.log('───────────────────────────────────────────────────────────────────────────');

      if (!ignoreDocDrift) {
        console.log('⚠️ Halting automated recording pipeline so you can review doc changes.');
        console.log('👉 Review in browser: http://localhost:3000/doc-sync');
        console.log('👉 To run anyway, pass `--ignore-doc-drift` or `--force`.');
        generateReport(reportData);
        process.exit(2);
      } else {
        console.log('⚠️ --ignore-doc-drift provided. Proceeding with pipeline anyway...\n');
      }
    } else {
      console.log(`✅ [Doc Drift Check]: All ${driftResult.total} doc pages match the local snapshot.\n`);
    }

    // 1. Git pull if requested
    if (shouldPull) {
      runSync('git pull', ROOT_DIR, 'Updating repository (git pull)');
    }

    // 2. Dependency updates
    if (!skipInstall) {
      if (shouldUpgrade) {
        runSync('npx npm-check-updates -u --peer', path.join(ROOT_DIR, 'frontend'), 'Upgrading all frontend dependencies (ncu -u --peer)');
      }

      runSync('npm install', path.join(ROOT_DIR, 'frontend'), 'Installing Frontend Dependencies (npm install)');
      runSync('npm install', path.join(ROOT_DIR, 'autorecorder'), 'Installing Autorecorder Dependencies');
    }

    // 3. Start Next.js (Mastra Agent + Frontend)
    console.log('\n▶ [Step] Starting Frontend & Mastra Agent Server (:3000)...');
    frontendProc = spawn('npm run dev', {
      cwd: path.join(ROOT_DIR, 'frontend'),
      stdio: 'ignore',
      shell: true,
      detached: !isWindows,
    });

    // 4. Health Checks
    const frontendHealth = await waitForHealth('http://127.0.0.1:3000', 'Next.js Frontend & Mastra Runtime', 60000);
    reportData.health.frontend = frontendHealth.elapsedSec;

    // Warm up Mastra agent API route
    await warmUpRuntime('http://127.0.0.1:3000/api/copilotkit');

    // 5. Run Autorecorder
    console.log('\n▶ [Step] Running Autorecorder...');
    const recorderCmd = forwardArgs.length > 0
      ? `npm run record -- ${forwardArgs.join(' ')}`
      : 'npm run record';

    runSync(recorderCmd, path.join(ROOT_DIR, 'autorecorder'), 'Executing Autorecorder');

    reportData.success = true;

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  🎉 Automation completed successfully! All videos recorded.');
    console.log('═══════════════════════════════════════════════════════════════\n');
  } catch (err) {
    reportData.error = err.message || String(err);
    console.error('\n❌ Automation failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    muxAudioFiles();
    generateReport(reportData);
    cleanup();
  }
}

main();
