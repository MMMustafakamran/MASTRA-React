/**
 * End-to-end self-test of the demo recording path.
 *
 * Records one page against a fixture app instead of a real scaffold: boots a
 * dev server, films the doc page, the IDE, the server's boot in a terminal, and
 * then a real prompt-and-reply against a real HTTP server. Every part of the
 * sequence a matrix page uses, with nothing to install and no model key.
 *
 * The point is to separate "the recorder is broken" from "the scaffold is
 * broken" *before* spending twenty minutes on scaffolds and installs. If this
 * passes and a matrix page fails, the fault is in the generated app, not here.
 *
 *   npm run selftest:demo
 */
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RecordingEngine } from './core/engine';
import { definePages } from './core/types';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const PORT = 3998;

const [page] = definePages([
  {
    id: 'selftest-demo',
    name: 'Recorder self-test — full demo path',
    videoName: 'Selftest-Demo',
    docPath: 'quickstart?agent=bring-your-own',
    route: 'quickstart',

    // A file that certainly exists, so the IDE step has something real to show.
    ideFile: 'autorecorder/package.json',
    startLine: 1,
    endLine: 14,

    prompt: 'Can you tell me a joke?',
    waitAfterPromptMs: 2500,

    devServer: {
      cwd: 'autorecorder',
      command: 'node',
      args: ['core/cli/fixtures/fake-app.cjs'],
      env: { PORT: String(PORT) },
      readyPattern: /Ready in/i,
      readyTimeoutMs: 30_000,
      originUrl: `http://localhost:${PORT}`,
      demoPath: '/',
      title: 'node fake-app.cjs',
    },
  },
]);

const engine = new RecordingEngine(ROOT);
const result = await engine.recordPage(page);

console.log(`\n======================================================`);
console.log(`📊 DEMO PATH SELF-TEST`);
console.log(`======================================================`);
console.log(`   ${result.success ? '✅ [PASS]' : '❌ [FAIL]'} ${page.name}`);
if (result.error) console.log(`        · ${result.error}`);
for (const w of result.warnings) console.log(`        · note: ${w}`);

const video = join(ROOT, 'autorecorder', 'videos', result.filename);
if (result.filename && existsSync(video)) {
  console.log(`   🎥 ${result.filename} (${(statSync(video).size / 1024 / 1024).toFixed(1)} MB)`);
} else {
  console.log(`   ⚠️ No video was written.`);
}
console.log(`======================================================\n`);

// node-pty holds a handle open after the child is gone, so returning from here
// would hang the process with the work already done.
process.exit(result.success ? 0 : 1);
