/**
 * Render side of the CLI recorder: turns captured casts into the deliverable
 * videos.
 *
 * Runs no commands and needs no services. It reads what `npm run capture`
 * already recorded and films it, which is why re-shooting a clip — different
 * pacing, different font size, a doc page that has since changed — costs
 * seconds instead of another scaffold and another sign-in.
 *
 *   npm run capture -- --scaffold     run the CLI, write the cast   (once)
 *   npm run render  -- --cli          film it                       (repeatable)
 *
 * A video may be assembled from several captured flows: `--install` plays all
 * four package managers back to back in one terminal window, because comparing
 * them is the reason for running four.
 */
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLI_FINDING_VIDEOS, CLI_FLOWS, CLI_VIDEOS as CLI_CAST_VIDEOS } from './config/cli.config';
import { muxAudio } from './core/cli/audio';
import { refuseInCi } from './core/cli/ci-guard';
import { compressCast, readCast } from './core/cli/cast';
import { type CliVideoConfig } from './core/cli/flow';
import { RecordingEngine, type CliRecordSegment, type RecordResult } from './core/engine';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const CAST_DIR = join(__dirname, 'casts');
/** CLI clips live apart from the per-doc-page recordings. */
const VIDEO_SUBDIR = 'cli';
const VIDEO_DIR = join(__dirname, 'videos', VIDEO_SUBDIR);

/** Every renderable video: the per-manager sets plus the findings. */
const CLI_VIDEOS = [...CLI_CAST_VIDEOS, ...CLI_FINDING_VIDEOS];

function flowById(id: string) {
  const flow = CLI_FLOWS.find((f) => f.id === id);
  if (!flow) {
    throw new Error(
      `cli.config.ts: video references flow "${id}", which is not a registered flow.`,
    );
  }
  return flow;
}

function printUsage(): void {
  console.log(`\n🎬 RENDER THE CLI VIDEOS\n`);
  for (const video of CLI_VIDEOS) {
    const missing = video.flows.filter(
      (id) => !existsSync(join(CAST_DIR, flowById(id).castFile)),
    );
    const state =
      missing.length === 0
        ? '✅ ready'
        : `⬜ needs capture: ${missing.join(', ')}`;
    console.log(`  ${String(video.order).padStart(2, ' ')}. [${video.id}] ${video.name}`);
    console.log(`      npm run render -- --${video.id}`);
    console.log(`      Segments: ${video.flows.join(' → ')}`);
    console.log(`      ${state}`);
  }
  console.log(`
  npm run render -- --all   every video whose casts are all captured

  Casts come from:  npm run capture -- --<flow-id>

  Video 3 of each set (the running app) is a page recording, not a cast:
                    npm run record -- --demo-npm    (…pnpm, yarn, bun)
`);
}

function selectVideos(args: string[]): CliVideoConfig[] {
  if (args.includes('--all')) {
    return CLI_VIDEOS.filter((v) =>
      v.flows.every((id) => existsSync(join(CAST_DIR, flowById(id).castFile))),
    );
  }
  const ids = args
    .filter((a) => a.startsWith('--'))
    .map((a) => a.replace(/^-+/, '').toLowerCase());
  return CLI_VIDEOS.filter((v) => ids.includes(v.id.toLowerCase()));
}

async function main(): Promise<void> {
  refuseInCi('npm run render');

  const args = process.argv.slice(2);
  if (
    args.length === 0 ||
    args.includes('--list') ||
    args.includes('--help') ||
    args.includes('-h')
  ) {
    printUsage();
    return;
  }

  const force = args.includes('--force');
  const videos = selectVideos(args);
  if (videos.length === 0) {
    console.error(`❌ No CLI video matched: ${args.join(' ')}`);
    console.error(`   Known ids: ${CLI_VIDEOS.map((v) => v.id).join(', ')}`);
    process.exit(1);
  }

  const engine = new RecordingEngine(ROOT);
  const results: (RecordResult & { id: string })[] = [];
  /** Signature -> the video file already filmed for it, for the copy shortcut. */
  const rendered = new Map<string, string>();

  for (const video of videos) {
    const segments: CliRecordSegment[] = [];
    const missing: string[] = [];
    const failedCaptures: string[] = [];

    for (const flowId of video.flows) {
      const flow = flowById(flowId);
      const castPath = join(CAST_DIR, flow.castFile);
      if (!existsSync(castPath)) {
        missing.push(flowId);
        continue;
      }

      // A failed capture still writes its cast — deliberately, so a run that
      // broke halfway leaves a record of how far it got. That record must not
      // then be filmed and handed over as a deliverable: the video would look
      // finished while showing a command that never completed.
      const reportPath = join(CAST_DIR, flow.reportFile);
      if (existsSync(reportPath) && !force) {
        try {
          const report = JSON.parse(readFileSync(reportPath, 'utf-8')) as {
            success?: boolean;
            error?: string;
          };
          if (report.success === false) {
            failedCaptures.push(`${flowId}: ${report.error ?? 'capture failed'}`);
            continue;
          }
        } catch {
          // An unreadable report says nothing about the cast; film it.
        }
      }
      segments.push({
        cast: compressCast(readCast(castPath), {
          maxGapSec: flow.render?.maxGapSec,
          speed: flow.render?.speed,
        }),
        title: flow.render?.title ?? flow.name,
      });
    }

    if (failedCaptures.length > 0) {
      console.error(
        `\n❌ ${video.name}: refusing to film a failed capture.\n` +
          failedCaptures.map((f) => `   ${f}`).join('\n') +
          `\n   Re-capture it, or pass --force to film it anyway.`,
      );
      results.push({
        id: video.id,
        success: false,
        filename: '',
        error: `Capture failed: ${failedCaptures.join('; ')}`,
        warnings: [],
      });
      continue;
    }

    if (missing.length > 0) {
      console.error(
        `\n❌ ${video.name}: no cast for ${missing.join(', ')}.` +
          `\n   Capture first: ${missing.map((id) => `npm run capture -- --${id}`).join('  ')}`,
      );
      results.push({
        id: video.id,
        success: false,
        filename: '',
        error: `Missing casts: ${missing.join(', ')}`,
        warnings: [],
      });
      continue;
    }

    // The CLI runs once and its result is copied, so all four sets open on the
    // same create footage. Filming it four times would burn the cast's full
    // duration each time to produce four byte-identical videos; copying the
    // first is the same output in a fraction of the time.
    // Two videos are the same footage only if everything that reaches the screen
    // matches. A finding replays the same cast as the plain install video but
    // adds code tabs and a written explanation, so it must be filmed, not copied.
    const signature = JSON.stringify([
      video.docUrl ?? null,
      video.flows,
      video.ideTabs ?? null,
      video.notepad?.body ?? null,
      // Two clips with different narration are not the same clip, even when
      // every frame matches — so a narrated video is never satisfied by copying
      // a silent one.
      video.audio ?? null,
    ]);
    const alreadyRendered = rendered.get(signature);
    if (alreadyRendered) {
      const from = join(VIDEO_DIR, `${alreadyRendered}.webm`);
      const to = join(VIDEO_DIR, `${video.videoFile}.webm`);
      if (existsSync(from)) {
        copyFileSync(from, to);
        console.log(
          `\n📄 ${video.name}\n   identical to ${alreadyRendered} — copied rather than re-filmed.`,
        );
        results.push({ id: video.id, success: true, filename: `${video.videoFile}.webm`, warnings: [] });
        continue;
      }
    }

    const result = await engine.recordCliFlow({
      id: video.id,
      name: video.name,
      filename: video.videoFile,
      segments,
      docUrl: video.docUrl,
      subdir: VIDEO_SUBDIR,
      ideTabs: video.ideTabs,
      ideDwellMs: video.ideDwellMs,
      notepad: video.notepad,
    });

    if (result.success) rendered.set(signature, video.videoFile);

    // Narration goes on after the picture exists. A mux failure is a warning,
    // not a failed recording: the video is already on disk and watchable, and
    // reporting it as failed would send someone off to re-record footage that
    // is fine.
    if (result.success && video.audio) {
      try {
        const mux = muxAudio(join(VIDEO_DIR, result.filename), join(__dirname, video.audio));
        console.log(
          `   🔊 Narration added (${mux.audioSeconds}s over ${mux.videoSeconds}s of video` +
            (mux.paddedSeconds > 0
              ? `; held the last frame for ${mux.paddedSeconds}s so it was not cut off).`
              : ').'),
        );
      } catch (e) {
        const note = e instanceof Error ? e.message : String(e);
        console.warn(`   ⚠️ ${note}`);
        result.warnings.push(note);
      }
    }

    results.push({ ...result, id: video.id });
  }

  console.log(`\n======================================================`);
  console.log(`📊 CLI RENDER SUMMARY`);
  console.log(`======================================================`);
  for (const r of results) {
    console.log(
      `   ${r.success ? '✅ [PASS] ' : '❌ [FAIL] '} ${r.id} -> ${r.filename || '(no video)'}`,
    );
    if (r.error) console.log(`        · ${r.error}`);
    for (const w of r.warnings) console.log(`        · ${w}`);
  }
  console.log(`======================================================\n`);

  if (results.some((r) => !r.success)) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal render error:', err);
  process.exit(1);
});
