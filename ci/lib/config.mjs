/**
 * Shared paths, ports and URLs for the CI/CD pipeline.
 *
 * Everything under ci/ imports from here rather than rebuilding paths, so a
 * moved folder or a changed port is a one-line edit.
 *
 * Note there is only one service. Mastra is TypeScript and its agents run
 * inside the Next.js process (`getLocalAgents`), so there is no separate agent
 * server to start, health-check or shut down — which is why this file has no
 * BACKEND_DIR and the pipeline has no backend step.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT_DIR = path.resolve(__dirname, '..', '..');
export const CI_DIR = path.join(ROOT_DIR, 'ci');
export const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
export const RECORDER_DIR = path.join(ROOT_DIR, 'autorecorder');
export const VIDEOS_DIR = path.join(RECORDER_DIR, 'videos');
export const AUDIO_DIR = path.join(RECORDER_DIR, 'audio');
export const LOGS_DIR = path.join(VIDEOS_DIR, 'logs');

export const isWindows = process.platform === 'win32';

/**
 * Prefix for CI artifact names. Matches the recorded video filenames
 * (`MASTRA-react-01-Quickstart.webm`, from `videoPrefix` in
 * `autorecorder/config/project.config.ts`) so a downloaded folder and the clips
 * inside it read as the same thing.
 */
export const PROJECT_SLUG = 'Mastra-react';

export const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 3000);
export const FRONTEND_URL = `http://127.0.0.1:${FRONTEND_PORT}`;

/**
 * Routes compiled before recording starts. Next.js builds routes on demand, so
 * the first hit of each is slow enough to blow the recorder's preflight
 * timeout. Warming them keeps that cost out of the recording itself.
 */
export const WARMUP_ROUTES = ['/', '/quickstart/demo-chat'];

/**
 * The paths the browser posts to for agent replies — the routes that carry
 * Mastra itself.
 *
 * A dev server compiles API routes lazily and only on first request, so without
 * this the page is ready while the endpoint behind it is not: the first POST
 * spends its time compiling instead of answering, and the recorder reports that
 * the agent never replied. Measured at 59s of compile inside a 74s request.
 *
 * The GET is expected to fail (405 against a POST-only route) — compiling it is
 * the whole point.
 *
 * `/api/copilotkit` is the documented quickstart runtime. `/api/copilotkit-threads`
 * is the Intelligence-backed runtime the three Rich Threads pages use — a separate
 * route that compiles separately, so warming only the first leaves every threads
 * page to pay the compile. A full run hides this: the first threads page absorbs
 * the cost and the rest look fine. A threads-only run shards one page per worker,
 * so every worker pays it and all three pages fail with "agent never replied".
 */
export const RUNTIME_WARM_PATHS = [
  '/api/copilotkit',
  '/api/copilotkit-threads/info',
];
