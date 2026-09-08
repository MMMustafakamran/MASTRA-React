/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADAPT THIS FILE — 4 of 4
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This framework's command-line flows: the scaffolding CLI and the installs
 * that follow it, each driven through a real terminal and captured to a cast
 * file that the recorder later replays on camera.
 *
 * Every CopilotKit repo runs the same `copilotkit create`, but the answers
 * differ — the framework row, the Intelligence project, whether a chat-channel
 * prompt appears at all. This file holds Mastra's answers.
 *
 * ── The one rule ───────────────────────────────────────────────────────────
 * Name rows, do not count them. `select: { label: '...' }` walks the list until
 * the highlight is on that row. The alternative — "press Down seventeen times" —
 * works until the CLI adds a menu entry, and then it scaffolds the wrong
 * framework while reporting success. The framework list has 23 entries today
 * and grows with every integration CopilotKit ships. `npm run doctor` rejects a
 * step that sends more than one arrow key without a `select`.
 *
 * ── Before the first run ───────────────────────────────────────────────────
 * `npm run capture -- --login` once. Sign-in opens a browser and cannot be
 * automated; doing it up front turns the mid-run auth pause into a precondition
 * and makes everything after it deterministic. It is also why these flows are
 * local-only and are not part of CI.
 *
 * ── Status of the prompts below ────────────────────────────────────────────
 * PREDICTED, not yet observed in this repo. They are the reference repo's real
 * run (Microsoft Agent Framework Python) re-pointed at Mastra using the
 * capabilities `npx copilotkit@latest framework list` reports for the `mastra`
 * row. See `1-cli-testing/CLI-FLOW.md`, which marks every prompt with its
 * status. The first real `npm run capture -- --scaffold` here should be watched
 * and this file corrected against what it actually asks.
 */
import { type DistributionConfig } from '../core/cli/distribute';
import { defineCliFlows, defineCliVideos } from '../core/cli/flow';

/** Names the generated app and its directory. Lowercase, digits, hyphens, ≤30. */
const APP_NAME = 'app';

/**
 * The row to select in `Select agent framework`.
 *
 * Must match this repo's backend. Matched as a case-insensitive substring, so
 * it needs to be unique in the list. 'Mastra' is: checked against all 23 rows
 * of `npx copilotkit@latest framework list`, it appears in exactly one
 * (`mastra  typescript  🌑 Mastra`). No other row's id or label contains the
 * string, so the short form is safe here — unlike the reference repo, where
 * 'Microsoft Agent Framework' alone would also have matched the .NET row
 * sitting directly above its target.
 */
const FRAMEWORK_ROW = 'Mastra';

/** Existing CopilotKit Intelligence project to bind the app to. */
const INTELLIGENCE_PROJECT = '2';

/** Where the CLI runs, relative to the repo root. The app lands inside it. */
const SCAFFOLD_DIR = '1-cli-testing';

/**
 * Sign-in can take minutes when the CLI session has expired: the operator has
 * to complete a browser round trip before the project picker appears. Waiting
 * that long for one step is correct; it is the only step a human touches.
 */
const AUTH_TIMEOUT_MS = 6 * 60_000;

/**
 * The sign-in window, which is a person noticing a browser tab and typing a
 * password — not a machine doing something slow.
 *
 * Six minutes proved too short in practice: the run died while the operator was
 * still signing in, and a timeout there reads as "sign-in failed" when nothing
 * failed at all. This is the one step whose limit should be set by human
 * attention rather than by how long the work takes.
 */
const LOGIN_TIMEOUT_MS = 15 * 60_000;

/** Package managers the scaffold is installed with, one flow each. */
const PACKAGE_MANAGERS: readonly { id: string; command: string }[] = [
  { id: 'npm', command: 'npm' },
  { id: 'pnpm', command: 'pnpm' },
  { id: 'yarn', command: 'yarn' },
  { id: 'bun', command: 'bun' },
] as const;

/**
 * One scaffold, copied into four directories, with the model key seeded in.
 *
 * The CLI runs once. Running it four times would make the scaffold itself a
 * variable in a test whose only subject is the install, so a difference between
 * managers could not be attributed to the manager.
 *
 * The key is seeded here rather than typed into the CLI: the scaffold is created
 * without one on purpose, so no recording ever contains a secret, and placing it
 * once before the copy means it cannot be typo'd into three directories of four.
 *
 * `.mastra` joins the exclude list alongside the usual build output: `mastra
 * dev` writes its bundled agent there, and it is regenerated on first boot in
 * each copy.
 */
export const CLI_DISTRIBUTION: DistributionConfig = {
  source: `${SCAFFOLD_DIR}/${APP_NAME}`,
  targets: PACKAGE_MANAGERS.map((pm) => `${SCAFFOLD_DIR}/${pm.id}/${APP_NAME}`),
  exclude: ['node_modules', '.next', '.git', '.turbo', '.mastra'],
  envFiles: [
    // One destination, not two. The Mastra starter is a single Next app: the
    // agent runs alongside the UI via `mastra dev`, inside the same project,
    // and there is no `agent/` directory to put a second env file in. The
    // reference repo seeds `agent/.env` as well because its Python agent is a
    // separate service with its own process; copying that line here would
    // write a file into a directory that does not exist.
    { from: '.env', to: '.env' },
  ],
};

export const CLI_FLOWS = defineCliFlows([
  {
    id: 'login',
    name: 'CopilotKit CLI — sign in',
    castName: 'Login',
    cwd: '.',
    command: 'npx',
    args: ['copilotkit@latest', 'login'],
    // Manual because it hands off to a browser: the operator finishes the round
    // trip, and nothing here can wait on that meaningfully. Run it once, then
    // the scaffold flow needs no human at all.
    manual: true,
    timeoutMs: LOGIN_TIMEOUT_MS,
    stepTimeoutMs: LOGIN_TIMEOUT_MS,
    steps: [
      {
        // `login` does not open the browser until this is acknowledged. Without
        // the keypress it sits on the prompt until the timeout, which reads as
        // "sign-in never completed" when in fact it never started.
        label: 'Acknowledge browser hand-off',
        waitFor: /Press Enter to continue/i,
        keys: ['Enter'],
        timeoutMs: 60_000,
      },
    ],
    // Nothing on disk to assert: the session is cached wherever the CLI keeps
    // it, and the proof it worked is the scaffold no longer pausing for auth.
    expectFiles: [],
  },

  {
    id: 'scaffold',
    name: 'CopilotKit CLI — create app',
    castName: 'Scaffold',
    docPath: 'quickstart?agent=bring-your-own',
    cwd: SCAFFOLD_DIR,
    command: 'npx',
    // `--project` names the Intelligence project instead of showing the picker.
    //
    // Not a shortcut for its own sake: with a valid CLI session already saved,
    // the interactive picker still sat on "Verifying authentication…" until the
    // step timed out, twice, on a network where `copilotkit project list`
    // answers instantly. Naming the project skips the step that hangs and
    // leaves every other prompt interactive and driven.
    args: ['copilotkit@latest', 'create', '--project', INTELLIGENCE_PROJECT],
    cols: 120,
    rows: 32,
    timeoutMs: 12 * 60_000,
    // The scaffold clones a template over the network, and that fails in ways
    // the CLI reports and then stops making progress on. Naming those here
    // turns a six-minute wait for a prompt that is never coming into an
    // immediate failure that quotes the actual error.
    abortOn: [/Init failed/i, /fatal: /i, /RPC failed/i],
    // Git's default HTTP/2 transport is what produced
    // "schannel: server closed abruptly" on this network. Scoped to this
    // command's children via git's own env-var config, so nothing global
    // changes for the machine.
    env: {
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'http.version',
      GIT_CONFIG_VALUE_0: 'HTTP/1.1',
    },
    steps: [
      {
        // npx's own prompt, not CopilotKit's — it appears only when the package
        // is not already cached. Optional, so a second run does not fail here,
        // and so the `y` is never typed into whatever prompt came instead.
        label: 'npx package install',
        waitFor: /Ok to proceed/i,
        optional: true,
        timeoutMs: 45_000,
        type: 'y',
        keys: ['Enter'],
      },
      {
        label: 'App name',
        waitFor: /App name/i,
        timeoutMs: 120_000,
        type: APP_NAME,
        keys: ['Enter'],
        settleMs: 600,
      },
      {
        label: 'Agent framework',
        waitFor: /Select agent framework/i,
        select: { label: FRAMEWORK_ROW, max: 40 },
        keys: ['Enter'],
        settleMs: 600,
      },
      {
        // `login` does not open its browser until Enter is pressed, and this
        // screen carries the same "…to continue" wording. Optional and cheap:
        // if it is only a spinner, the keypress is harmless; if it is waiting
        // for acknowledgement, nothing else was ever going to send it.
        label: 'Acknowledge account link (only if it asks)',
        waitFor: /Sign in with your browser|Verifying authentication/i,
        optional: true,
        timeoutMs: 30_000,
        keys: ['Enter'],
        settleMs: 2000,
      },
      {
        // Optional because `--project` above normally means this never appears.
        // Kept so that dropping the flag — or a CLI version that ignores it —
        // still produces a driven run rather than a hang.
        label: 'Intelligence project (skipped when --project is given)',
        waitFor: /Select a project/i,
        optional: true,
        timeoutMs: 90_000,
        select: { label: INTELLIGENCE_PROJECT },
        keys: ['Enter'],
        settleMs: 600,
      },
      {
        // Mastra's row in `framework list` carries the `--channel` flag, so its
        // starter does ship a managed Channel host and this prompt is expected
        // to appear. Still marked optional: only 18 of the 23 frameworks offer
        // it, and keeping the flag means this same config survives being
        // re-pointed at one of the five that do not.
        label: 'Chat platform',
        waitFor: /chat platform/i,
        optional: true,
        // Minutes, not seconds: the template is cloned between the account link
        // and this prompt. A 45s window expired mid-clone, so the prompt arrived
        // after this step had already given up — and then sat unanswered while
        // the next step waited for something behind it.
        timeoutMs: 5 * 60_000,
        select: { label: 'Not now' },
        keys: ['Enter'],
        settleMs: 600,
      },
      {
        // Mastra reads OPENAI_API_KEY. The key is placed into the project
        // afterwards, deliberately, so it never appears in a recording — Enter
        // leaves it empty and the CLI exits.
        //
        // This comes *before* the install question, not after: the Agno run of
        // 2026-09-07 (same CLI, same day) went straight from the chat-platform
        // prompt to this one. The pattern matches the literal screen there —
        // `Set OPENAI_API_KEY now, or press Enter to skip and add it later.`
        // An earlier `/API key/i` could not match it: the variable is
        // underscored, and the only spaced "a key" on screen is the
        // platform.openai.com/api-keys URL.
        label: 'Skip model API key',
        waitFor: /_API_KEY now|press Enter to skip/i,
        timeoutMs: 5 * 60_000,
        keys: ['Enter'],
      },
      {
        // Single keypress: this prompt acts on the character, with no Enter.
        //
        // Optional, and after the key step. In the Agno run of 2026-09-07 this
        // prompt never appeared at all — the CLI asked for the key instead, and
        // a required step here spent its full window waiting for a screen that
        // was never coming while the key prompt sat unanswered behind it.
        // Kept so a CLI version that does ask still gets a driven answer.
        //
        // The pattern must not match the success banner, whose next-steps list
        // prints `Install the dependencies:  npm install`. A bare
        // /install the dependencies/i matched *that* in the Agno run, reported
        // ok, and typed a stray `n` at a CLI that had already finished.
        label: 'Decline dependency install',
        waitFor: /Want me to install the dependencies|install the dependencies\?/i,
        optional: true,
        // Short: this runs after the success banner, so its wait is dead air in
        // the video. Long enough to catch a prompt that paints right after the
        // previous answer, short enough not to pad the recording.
        timeoutMs: 10_000,
        type: 'n',
      },
    ],
    // The CLI prints its success banner and then holds the terminal open rather
    // than exiting, so waiting for an exit fails a run whose own last line says
    // it worked.
    doneWhen: /created successfully/i,
    // Answering every prompt is not the same as producing an app. Without this,
    // a CLI that exits 0 having written nothing counts as a pass.
    //
    // `package.json` only — deliberately NO `agent/`. Mastra is a Node starter:
    // the agent is `mastra dev` running alongside `next dev` inside the one
    // project, so the scaffold ships no `agent/` directory at all. Confirmed
    // against the already-scaffolded proof at `1-cli-testing/npm/app/`, whose
    // top level is a single Next app (src/, scripts/, .mastra/) with no agent
    // folder anywhere in the tree. Asserting one here would fail a scaffold
    // that worked perfectly. Do not "fix" this back in.
    expectFiles: [`${SCAFFOLD_DIR}/${APP_NAME}/package.json`],
    // Light compression only. The pauses in an interactive session are someone
    // reading the prompt before answering it, and cutting them makes the video
    // unreadable — which is the one thing this clip exists to show.
    render: { maxGapSec: 1.6, speed: 1.15, title: 'Windows PowerShell' },
  },

  // One install per package manager. The scaffold is generated once and copied
  // into each of these directories, so the app is identical in all four and the
  // install path is the only variable under test.
  //
  // These have no steps: a package install asks nothing. They are here for the
  // cast — the install is a segment of the demo video — and for the durations,
  // which are the matrix's actual finding.
  ...PACKAGE_MANAGERS.map(({ id, command }) => ({
    id: `install-${id}`,
    name: `Install dependencies — ${id}`,
    castName: `Install-${id}`,
    cwd: `${SCAFFOLD_DIR}/${id}/${APP_NAME}`,
    command,
    args: ['install'],
    // Cold installs on a slow network genuinely take this long; a tighter cap
    // reports a failure for a command that was working fine.
    timeoutMs: 15 * 60_000,
    expectFiles: [`${SCAFFOLD_DIR}/${id}/${APP_NAME}/node_modules`],
    // The demo leads with resolved versions, and they can only be read once
    // something is installed.
    versionsFor: `${SCAFFOLD_DIR}/${id}/${APP_NAME}`,
    // An install is minutes of a spinner. Nobody watches that, but cutting it
    // entirely loses what the segment is evidence of — that it completed, and
    // roughly how long it took. Cap the dead air, then play what is left fast.
    render: { maxGapSec: 0.4, speed: 3, title: `${command} install` },
  })),

  // Last on purpose, even though it runs between two pnpm installs: cast files
  // are numbered by position in this list, so putting it anywhere earlier
  // renames every install cast after it and orphans the ones already captured.
  //
  // pnpm needs this extra command before its install can succeed, and that is a
  // finding rather than a workaround. pnpm 10+ refuses to run dependency build
  // scripts it has not been told to trust, then exits 1 for having skipped them
  // — so `pnpm install` "fails" on a scaffold that is otherwise fine. One of the
  // skipped scripts is esbuild's, which is how esbuild fetches its platform
  // binary, so this is not cosmetic.
  //
  // `--all` because the interactive form is a checkbox list, and the decision
  // being recorded is "this starter's dependencies may build", not a per-package
  // judgement. Approving writes `pnpm-workspace.yaml` into the app; the manifest
  // is untouched, so the four copies stay comparable.
  //
  // Run order for pnpm:
  //   --install-pnpm   exits 1, having skipped the builds
  //   --approve-pnpm   runs them, records the approval
  //   --install-pnpm   clean
  {
    id: 'approve-pnpm',
    name: 'pnpm — approve dependency build scripts',
    castName: 'Approve-pnpm',
    cwd: `${SCAFFOLD_DIR}/pnpm/${APP_NAME}`,
    command: 'pnpm',
    args: ['approve-builds', '--all'],
    timeoutMs: 5 * 60_000,
    expectFiles: [`${SCAFFOLD_DIR}/pnpm/${APP_NAME}/pnpm-workspace.yaml`],
    render: { maxGapSec: 0.4, speed: 2, title: 'pnpm approve-builds' },
  },

  {
    // The second half of pnpm's story, and the half that was missed.
    //
    // Approving the builds gets `pnpm install` to exit 0, which looks like the
    // problem is solved. It is not: `pnpm run dev` then dies immediately, and a
    // clip that stops at a green install tells the reader the opposite of the
    // truth. This flow exists so the crash is on film rather than described.
    //
    // Runs the documented command, both halves of it. `dev` is
    // `dev:infra && concurrently "npm run dev:ui" "npm run dev:agent"`, and it
    // is `dev:agent` (`mastra dev`) that throws. `--kill-others` then takes the
    // UI down too, so the whole command exits 1 — which is exactly what a reader
    // following the quickstart sees.
    id: 'dev-pnpm',
    name: 'pnpm — the scaffolded app fails to start',
    castName: 'Dev-pnpm',
    cwd: `${SCAFFOLD_DIR}/pnpm/${APP_NAME}`,
    command: 'pnpm',
    args: ['run', 'dev'],
    // The crash lands in seconds; this only has to outlast Next's boot banner.
    timeoutMs: 3 * 60_000,
    // Stop on the SyntaxError rather than waiting out the timeout: the failure
    // has already happened and everything after it is concurrently's teardown.
    doneWhen: /does not provide an export named 'buildLogRecordData'|dev:agent exited with code 1/,
    // The run is *expected* to fail, so no exit-code assertion and no files to
    // check. The cast is the artifact.
    expectFiles: [],
    render: { maxGapSec: 0.6, speed: 1.5, title: 'pnpm run dev' },
  },

  // Same crash, different manager. yarn's install exits 0, so without this
  // flow yarn would take the onSuccess branch and be filmed as a working demo
  // — a green clip for a copy that cannot start. The install passing is not
  // evidence the app runs, and this is the flow that says so.
  //
  // Appended last for the same reason approve-pnpm is: casts are numbered by
  // position, so inserting this anywhere earlier renames every cast after it.
  {
    id: 'dev-yarn',
    name: 'yarn — the scaffolded app fails to start',
    castName: 'Dev-yarn',
    cwd: `${SCAFFOLD_DIR}/yarn/${APP_NAME}`,
    command: 'yarn',
    args: ['run', 'dev'],
    timeoutMs: 3 * 60_000,
    doneWhen: /does not provide an export named 'buildLogRecordData'|dev:agent exited with code 1/,
    expectFiles: [],
    render: { maxGapSec: 0.6, speed: 1.5, title: 'yarn run dev' },
  },
]);

/**
 * The deliverable: three videos per package manager, twelve in all.
 *
 * Each manager gets a complete set — the CLI creating the project, that
 * manager installing it, and its copy running and answering — so one folder of
 * clips tells the whole story for one manager without cross-referencing.
 *
 * The CLI clip is deliberately the same footage in all four sets: the CLI runs
 * once and the result is copied, so there is only one real create to show.
 * `cli-render.ts` records it once and copies the file, rather than re-filming
 * identical footage four times.
 *
 * The third video of each set is a page recording, in `pages.config.ts`.
 */
/**
 * The deliverable: one CLI clip, then two clips per package manager.
 *
 *   1. `CLI-Create`        the CLI scaffolding the app — once, shared by all
 *                          four, because the CLI ran once and the result was
 *                          copied; four clips of it would be the same footage
 *   2. `<pm>-2-Install`    that manager installing the copy, pass or fail —
 *                          this is the clip that shows whether the install
 *                          command works, so it is always filmed
 *   3. `<pm>-3-Demo`       the app running and answering a prompt, when the
 *                          install succeeded (a page recording, see
 *                          `pages.config.ts`)
 *      `<pm>-3-Finding`    the failure explained, when it did not: the doc
 *                          page, the versions it resolved, the manifest line,
 *                          the command failing, and a note written out
 *
 * Which of the two third clips a manager gets is decided by its install
 * report, not by hand: `npm run cli:videos` reads `casts/*.report.json` and
 * films the finding for a failed install or records the demo for a working
 * one. A failure nobody has analysed yet still gets a clip — the note is
 * generated from the report (command, exit code, last screen) and the
 * hand-written `analysis` below is appended when there is one.
 *
 * `project-context.md`: a broken thing keeps its broken implementation and
 * the recording exists to show the defect; every finding pins installed
 * against declared versions. That is what the finding clip's IDE tabs are.
 */

/**
 * Hand-written analysis for a failure that has been understood. Keyed by
 * package manager; a manager with no entry gets the generated note alone.
 *
 * Empty until the pipeline has been run here and a failure read. The
 * reference repo's entry was a bun/Windows backslash bug in a Python
 * starter's `install:agent` script; whether this starter has anything like
 * it is exactly what the first run will say.
 */
const INSTALL_ANALYSIS: Partial<Record<string, string>> = {
  pnpm: [
    'pnpm fails twice. the second one is the one that matters.',
    '',
    '1. install exits 1 - ignored build scripts',
    '',
    '  [ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: @scarf/scarf@1.4.0,',
    '  esbuild@0.28.2, sharp@0.34.5',
    '',
    'pnpm 10 will not run a dependency build script unless it has been',
    'approved, and it exits 1 rather than warning. sharp and esbuild are the',
    'ones that matter - both unpack a platform binary in that script, so the',
    'package lands on disk with no binary behind it.',
    '',
    'the list varies by scaffold version: this run (2026-09-08) named three,',
    'an operator on scaffold 1.70.1 saw two - @scarf/scarf and sharp, no',
    'esbuild. the failure is the same either way.',
    '',
    'approve them with pnpm approve-builds, and install exits 0. the quickstart',
    'never mentions this step.',
    '',
    '2. then pnpm run dev dies on startup',
    '',
    '  import { LogLevel, MastraLogger, buildLogRecordData, ... }',
    '    from "@mastra/core/logger";',
    '                ^^^^^^^^^^^^^^^^^^',
    '  SyntaxError: The requested module\'s @mastra/core/logger does not',
    '  provide an export named \'buildLogRecordData\'',
    '',
    'the starter pins @mastra/core exactly at 1.41.0. the mastra cli it also',
    'depends on drags in @mastra/loggers 1.3.1, which imports a symbol that',
    'version of core does not export - grep dist/logger/index.js for',
    'buildLogRecordData and there are zero hits. a broken pair, shipped',
    'together by the scaffold.',
    '',
    'dev:agent is what throws, and concurrently --kill-others takes the ui',
    'down with it, so pnpm run dev exits 1 with nothing serving. the app is',
    'installed and cannot start.',
    '',
    'yarn fails identically. npm and bun resolve a working pair, so this is a',
    'resolution difference, not a mastra bug in the ordinary sense.',
  ].join('\n'),

  yarn: [
    'yarn install exits 0. the app still cannot start.',
    '',
    '  yarn run dev',
    '  [agent] import { LogLevel, MastraLogger, buildLogRecordData, ... }',
    '  [agent]   from "@mastra/core/logger";',
    '  [agent] SyntaxError: The requested module \'@mastra/core/logger\' does',
    '  [agent]   not provide an export named \'buildLogRecordData\'',
    '  [agent] npm run dev:agent exited with code 1',
    '  [ui]    npm run dev:ui exited with code 1',
    '',
    'same defect pnpm hits, reached by a shorter route - there is no',
    'approve-builds step in the way, so yarn goes straight from a clean',
    'install to a dead app.',
    '',
    'what resolved, checked on disk in all four copies:',
    '',
    '  npm    @mastra/loggers 1.1.2   nested under mastra/    runs',
    '  bun    @mastra/loggers 1.1.2   hoisted                 runs',
    '  yarn   @mastra/loggers 1.3.1   hoisted                 crashes',
    '  pnpm   @mastra/loggers 1.3.1   .pnpm store             crashes',
    '',
    '@mastra/core is 1.41.0 in all four. grep its dist/logger/index.js for',
    'buildLogRecordData and there are zero hits. loggers 1.3.1 imports it;',
    'loggers 1.1.2 does not mention it.',
    '',
    'the app never imports @mastra/loggers itself. it arrives through the',
    'mastra cli - the thing dev:agent runs - which declares it as',
    '"^1.0.1-alpha.0" while the starter pins "@mastra/core": "1.41.0" exactly.',
    'an open caret against a hard pin. yarn and pnpm take the caret to',
    'current-latest 1.3.1; npm and bun happen to sit on 1.1.2.',
    '',
    'so npm and bun are not passing by design, they are passing by resolution',
    'date. a fresh npm install can start failing without anything in the',
    'starter changing.',
    '',
    'do not record dev:ui alone to get a green clip. the ui builds fine on its',
    'own and the recording would show a working app that nobody typing the',
    'documented command can reach.',
  ].join('\n'),
};

/**
 * Managers whose install succeeds but whose app cannot start, and so are filmed
 * as findings rather than demos.
 *
 * yarn and pnpm both resolve `@mastra/loggers` 1.3.1 against the exactly-pinned
 * `@mastra/core` 1.41.0, which does not export the symbol 1.3.1 imports. npm
 * and bun resolve 1.1.2 and run, so this is a resolution difference and the
 * two passing managers are passing by luck of resolution date. Re-check this
 * set after any scaffold bump rather than trusting it — if npm starts
 * resolving 1.3.1 it belongs here too.
 *
 * A manager listed here needs a matching `dev-<id>` flow in CLI_FLOWS.
 */
const BROKEN_DEV = new Set(['pnpm', 'yarn']);

/**
 * Flow ids whose failure the video goes on to fix, and so must not decide the
 * third clip.
 *
 * Empty here: Mastra's pnpm install failure is not remediated. Approving the build scripts gets the install to exit 0, but the app still will not start, so the finding stands.
 *
 * Read by cli-render.ts. A flow listed here is still filmed — the failure is
 * part of the story — it just does not file a finding on its own.
 */
export const REMEDIATED_FLOWS = new Set<string>([]);

/**
 * Flow ids that prove the installed app does not work, whatever the capture
 * report says about them.
 *
 * A `dev-<pm>` flow is *expected* to crash, so the harness grades it a pass for
 * crashing on cue. That grade is about the capture, not the software. Listing
 * it here is what routes its manager to a finding instead of a demo — without
 * it, an install that exits 0 gets filmed as a working app that in fact cannot
 * start.
 *
 * Read by cli-render.ts. Every id here needs a matching flow in CLI_FLOWS.
 */
export const PROVES_BROKEN = new Set<string>(['dev-pnpm', 'dev-yarn']);

/** Narration for a finding that has been recorded, relative to this folder. */
const FINDING_AUDIO: Partial<Record<string, string>> = {};

export const CLI_VIDEOS = defineCliVideos([
  {
    id: 'cli',
    name: 'CopilotKit CLI — creating the app',
    videoName: 'CLI-Create',
    docPath: 'quickstart?agent=bring-your-own',
    flows: ['scaffold'],
  },

  ...PACKAGE_MANAGERS.map(({ id }) => {
    const app = `${SCAFFOLD_DIR}/${id}/${APP_NAME}`;
    return {
      id: `install-video-${id}`,
      name: BROKEN_DEV.has(id)
        ? `${id} · 2 · Installing dependencies, then failing to start`
        : `${id} · 2 · Installing dependencies`,
      videoName: `${id}-2-Install`,
      docPath: 'quickstart?agent=bring-your-own',

      // A manager in BROKEN_DEV carries a second flow, because for those the
      // install exiting 0 is not the end of the story and stopping the clip
      // there would read as a pass. `dev-<pm>` shows what the reader actually
      // hits next — the agent throws on an import and concurrently takes the
      // UI down with it — so the clip ends where they would end up.
      //
      // This is also what routes them to the finding rather than the demo:
      // the third clip is chosen by whether any flow in this list failed, not
      // by whether the install did.
      flows: BROKEN_DEV.has(id) ? [`install-${id}`, `dev-${id}`] : [`install-${id}`],

      // Video 3 when the install worked: the app, live. `demo-<pm>` in
      // pages.config.ts boots that copy's dev server and drives it.
      onSuccess: { recordPage: `demo-${id}` },

      // Video 3 when it did not: the finding.
      onFailure: {
        id: `finding-${id}`,
        name: BROKEN_DEV.has(id)
          ? `${id} · 3 · Finding — installs, then will not start`
          : `${id} · 3 · Finding — install failed`,
        videoName: `${id}-3-Finding`,
        ideTabs: [
          // Installed, not declared: what this run actually resolved to.
          // Written by the install flow even when it fails partway, as long
          // as something landed in node_modules.
          { filePath: `${app}/VERSIONS.md`, startLine: 1, endLine: 20 },
          // What the starter declares — the CopilotKit packages under test.
          { filePath: `${app}/package.json`, startLine: 1, endLine: 30 },
        ],
        ideDwellMs: 4200,
        analysis: INSTALL_ANALYSIS[id],
        notepadFile: `${id}-install-finding.txt`,
        // Faster than the 62ms default: a finding note is several times
        // longer than a one-line jotting, and at the default it would spend
        // two minutes typing while the viewer has already read it.
        charDelayMs: 22,
        audio: FINDING_AUDIO[id],
      },
    };
  }),
]);

