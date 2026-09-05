/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADAPT THIS FILE — 3 of 3
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * One entry per doc page, in the order the doc nav lists them.
 *
 * Entries are deliberately short. `docUrl`, `demoUrl` and the output filename
 * are derived from `project.config.ts` plus the fields below, so no entry can
 * point at the wrong framework's docs and filenames stay in nav order without
 * anyone numbering them by hand.
 *
 * ── Where this list came from ──────────────────────────────────────────────
 * Generated from `frontend/src/lib/nav-config.ts`, which is this app's single
 * source of truth for route -> doc-page mapping. Every route carrying
 * `hasDemo: true` is registered here, in nav order; routes without a
 * `demo-chat` page are reference material and are deliberately absent, because
 * `demoUrl` is always `route + demoSuffix` and the doctor errors on any that
 * is not 200.
 *
 * Re-derive rather than hand-edit when the nav changes, then re-check the line
 * ranges below.
 *
 * ── The line ranges ────────────────────────────────────────────────────────
 * `startLine`/`endLine` are what the simulated IDE highlights, and they drift
 * the moment someone edits a demo page. `npm run doctor` checks each range
 * points at real code; where a file carries `[!code highlight]` or `#region`
 * markers it also checks the range still covers one.
 */

import { definePages, type PageDefinition } from '../core/types';

/**
 * The scaffolded app, running — video 3 of each package manager's set.
 *
 * The other two are the CLI creating the project and that manager installing
 * it, both in `config/cli.config.ts`. This one is the payoff, and it is a
 * recording of the real app rather than a re-enactment: the dev server filmed
 * booting in the terminal is the same process that serves the page driven
 * immediately afterwards.
 *
 * The order on screen is how someone would actually check a fresh scaffold:
 *
 *   1. the doc page that told them to run the CLI
 *   2. `package.json` — what the starter declares
 *   3. the lockfile — what this manager actually resolved, pinned
 *   4. the app's own CopilotKit code, so the chat below has a source
 *   5. `<pm> run dev` booting, in a terminal
 *   6. the app open in a browser, asked a question, answering
 *
 * Steps 2 and 3 are the pair that matters. `package.json` carries RANGES, so on
 * its own it cannot answer "which versions is this?" — and the resolved set is
 * exactly where four package managers can differ. The lockfile is where that
 * difference is written down, which is why this tab is a different file in each
 * set. VERSIONS.md, the generated summary of the same thing, stays on the
 * install clips: showing both here would say it twice before the app has
 * appeared.
 *
 * All four managers are listed, bun included. No finding has been recorded
 * against any of them in this repo yet — unlike the reference repo, whose bun
 * install dies in a Python starter's `install:agent` postinstall, a script this
 * starter does not have. All four scaffolds under `1-cli-testing/` installed
 * cleanly by hand, so all four are expected to produce a demo. If one starts
 * failing, its dev server never prints its ready line, the recorder reports a
 * server that never started and writes no video — which is the entry doing its
 * job as a test.
 *
 * Ports 3141–3144, and every part of that is deliberate:
 *
 *   - never 3000: this repo's own Next frontend holds it, and a recording that
 *     quietly used *that* would look like a pass while proving nothing about
 *     the scaffold.
 *   - never 3121–3124: those are the reference repo's range. This block ships
 *     to every framework repo, so if every copy kept one range, a sibling
 *     repo's scaffold left running is enough for the dev server here to fail
 *     with EADDRINUSE while the browser happily records *that other
 *     framework's app* answering nothing. Each repo takes its own range.
 *
 * `readyPattern` is what the dev server prints when it is serving. If a future
 * starter changes that wording, the recorder waits out the timeout and reports
 * that the server never started — the right failure, since it never became
 * reachable in a way this config recognises.
 */
const DEMO_PAGES: PageDefinition[] = [
  { pm: 'npm', command: 'npm', args: ['run', 'dev'], lockfile: 'package-lock.json', port: 3141 },
  { pm: 'pnpm', command: 'pnpm', args: ['run', 'dev'], lockfile: 'pnpm-lock.yaml', port: 3142 },
  { pm: 'yarn', command: 'yarn', args: ['run', 'dev'], lockfile: 'yarn.lock', port: 3143 },
  // bun 1.2+ writes a text `bun.lock`; older bun wrote the binary `bun.lockb`,
  // which has nothing readable to put on screen. The bun scaffold already on
  // disk carries `bun.lock`, so this is confirmed rather than assumed — but the
  // doctor names this file if a future bun produces the other one.
  { pm: 'bun', command: 'bun', args: ['run', 'dev'], lockfile: 'bun.lock', port: 3144 },
].map(({ pm, command, args, lockfile, port }) => {
  const app = `1-cli-testing/${pm}/app`;
  return {
    id: `demo-${pm}`,
    name: `${pm} · 3 · Scaffolded app - manifest, lockfile, dev server and a live agent`,
    videoName: `Demo-${pm}`,
    // Names the file as the third of this manager's set rather than by doc-nav
    // position, so one manager's three clips sort together.
    videoFile: `${pm}-3-Demo`,
    docPath: 'quickstart?agent=bring-your-own',
    // Unused for these pages — the demo URL comes from devServer — but kept
    // meaningful so logs read sensibly.
    route: 'quickstart',
    generated: true,

    // What the starter declares. Also the file whose absence tells the runner
    // this manager's app has not been scaffolded and installed yet. Lines 1-24
    // are the scripts block plus the CopilotKit and Mastra dependencies — the
    // packages under test — out of 56.
    ideFile: `${app}/package.json`,
    startLine: 1,
    endLine: 24,
    extraTabs: [
      // What it resolved to. A lockfile is long and mostly uninteresting; its
      // head is the part that identifies the tree — format version, then the
      // first resolved entries.
      { filePath: `${app}/${lockfile}`, startLine: 1, endLine: 26 },
      // The CopilotKit integration itself — the code behind the chat that
      // answers a few seconds later. This starter's `src/app/page.tsx` opens
      // with the `@copilotkit/react-core/v2` imports and the `useFrontendTool`
      // registration, which is exactly the surface the demo exercises.
      { filePath: `${app}/src/app/page.tsx`, startLine: 7, endLine: 35 },
    ],

    // The starter's own suggestion chip for its generative-UI path, so this is
    // a prompt the shipped agent is built to answer rather than one invented
    // for the recording. `src/mastra/agents/index.ts` registers `weatherTool`
    // (`src/mastra/tools/index.ts`, a real open-meteo lookup) on a gpt-4o
    // agent, and `src/components/weather.tsx` renders the result — so the
    // answer is a rendered card, not just streamed text.
    prompt: 'The install just finished. What is the weather like in San Francisco?',
    waitAfterPromptMs: 5000,

    devServer: {
      cwd: app,
      command,
      args,
      env: { PORT: String(port), BROWSER: 'none' },
      // This starter's `dev` is not a bare `next dev`. It is
      //   dev:infra && concurrently "npm run dev:ui" "npm run dev:agent"
      // with `dev:ui` = `next dev --turbopack` and `dev:agent` = `mastra dev`,
      // so two servers boot into one stream and concurrently tags every line
      // with `[ui]` or `[agent]`.
      //
      // The pattern is left UNANCHORED on purpose — that is what tolerates the
      // prefix. `[ui]  ✓ Ready in 766ms` contains `Ready in`, so it matches
      // without the pattern having to know about concurrently at all; anchoring
      // it to the start of a line is what would break here.
      //
      // `Ready in` is Next's real ready line for this starter, not a guess:
      // `1-cli-testing/npm/app/.next/dev/logs/next-development.log` from the
      // earlier manual boot opens with `✓ Ready in 766ms`. `Local:\s+http` is
      // kept as a fallback for the startup banner. Neither has been seen come
      // through concurrently's prefixing yet — the first real run should
      // confirm it.
      readyPattern: /Ready in|Local:\s+http/i,
      // A first `next dev` compiles the whole app, and `mastra dev` bundles the
      // agent alongside it; on a cold cache this is slow and a tighter cap
      // would report a failure for a server that was fine.
      readyTimeoutMs: 240_000,
      originUrl: `http://localhost:${port}`,
      demoPath: '/',
      title: `${command} run dev`,
    },
  };
});

export const PAGES = definePages([
  {
    id: "quickstart",
    name: "Getting Started - Quickstart",
    videoName: "Quickstart",
    docPath: "quickstart?agent=bring-your-own",
    route: "quickstart",
    // Leads with the versions, not the manifest. package.json declares
    // RANGES, so this clip used to show a floor while the run it
    // documented had installed something newer. VERSIONS.md is generated
    // after install (ci/write-versions.mjs) and names what resolved.
    // package.json stays as the first tab: the range is still what a
    // reader would write in their own project.
    ideFile: "frontend/VERSIONS.md",
    startLine: 6,
    endLine: 15,
    extraTabs: [
      {
        filePath: "frontend/package.json",
        startLine: 11,
        endLine: 27,
      },
      { filePath: "frontend/src/app/quickstart/demo-chat/page.tsx", startLine: 15, endLine: 32 },
      { filePath: "frontend/src/app/api/copilotkit/[[...slug]]/route.ts", startLine: 1, endLine: 35 },
      { filePath: "frontend/src/mastra/index.ts", startLine: 1, endLine: 35 },
    ],
    prompt: "Hey, are you connected? Tell me a quick fun fact about kites.",
    waitAfterPromptMs: 4000,
  },
  {
    id: "prebuilt-components",
    name: "Basics - Prebuilt Components",
    videoName: "PrebuiltComponents",
    docPath: "prebuilt-components",
    route: "prebuilt-components",
    ideFile: "frontend/src/app/prebuilt-components/demo-chat/page.tsx",
    startLine: 34,
    endLine: 68,
    prompt: "In two sentences, what does CopilotKit do?",
    waitAfterPromptMs: 4000,
  },
  {
    id: "prebuilt-components-copilot-threads-drawer",
    name: "Basics - CopilotThreadsDrawer",
    videoName: "CopilotThreadsDrawer",
    docPath: "prebuilt-components/copilot-threads-drawer",
    route: "prebuilt-components/copilot-threads-drawer",
    ideFile: "frontend/src/app/prebuilt-components/copilot-threads-drawer/demo-chat/page.tsx",
    startLine: 7,
    endLine: 26,
    prompt: "Tell me a short joke about programmers.",
    waitAfterPromptMs: 4000,
  },
  {
    id: "threads",
    name: "Basics - Persistent Threads",
    videoName: "Threads",
    docPath: "threads",
    route: "threads",
    ideFile: "frontend/src/app/threads/demo-chat/page.tsx",
    startLine: 7,
    endLine: 26,
    prompt: "Give me a one-line joke, then I will start a new thread.",
    waitAfterPromptMs: 4000,
  },
  {
    id: "headless-threads",
    name: "Custom Look and Feel - Headless Threads",
    videoName: "HeadlessThreads",
    docPath: "headless-threads",
    route: "headless-threads",
    ideFile: "frontend/src/app/headless-threads/demo-chat/page.tsx",
    startLine: 7,
    endLine: 26,
    prompt: "Summarize what an AG-UI agent is, in one line.",
    waitAfterPromptMs: 4000,
  },
  {
    id: "custom-look-and-feel-slots",
    name: "Custom Look and Feel - Slots",
    videoName: "Slots",
    docPath: "custom-look-and-feel/slots",
    route: "custom-look-and-feel/slots",
    ideFile: "frontend/src/app/custom-look-and-feel/slots/demo-chat/page.tsx",
    startLine: 42,
    endLine: 76,
    prompt: "Testing the customized slots. Say hi back.",
    waitAfterPromptMs: 4000,
  },
  {
    id: "custom-look-and-feel-headless-ui",
    name: "Custom Look and Feel - Headless UI",
    videoName: "HeadlessUI",
    docPath: "custom-look-and-feel/headless-ui",
    route: "custom-look-and-feel/headless-ui",
    ideFile: "frontend/src/app/custom-look-and-feel/headless-ui/demo-chat/page.tsx",
    startLine: 10,
    endLine: 14,
    prompt: "Suggest one good name for a headless chat UI.",
    waitAfterPromptMs: 4000,
  },
  {
    id: "programmatic-control",
    name: "Custom Look and Feel - Programmatic Control",
    videoName: "ProgrammaticControl",
    docPath: "programmatic-control",
    route: "programmatic-control",
    ideFile: "frontend/src/app/programmatic-control/demo-chat/page.tsx",
    startLine: 28,
    endLine: 80,
    prompt: "Is it raining in Tokyo right now?",
    waitAfterPromptMs: 4000,
  },
  {
    id: "inspector",
    name: "Custom Look and Feel - Inspector",
    videoName: "Inspector",
    docPath: "inspector",
    route: "inspector",
    ideFile: "frontend/src/app/inspector/demo-chat/page.tsx",
    startLine: 15,
    endLine: 31,
    prompt: "Quick check: what is 17 times 23?",
    waitAfterPromptMs: 4000,
  },
  {
    id: "generative-ui-your-components-display-only",
    name: "Generative UI - Your Components · Display-only",
    videoName: "YourComponentsDisplayonly",
    docPath: "generative-ui/your-components/display-only",
    route: "generative-ui/your-components/display-only",
    ideFile: "frontend/src/app/generative-ui/your-components/display-only/demo-chat/page.tsx",
    startLine: 44,
    endLine: 52,
    prompt: "Show me a weather card for London. It is 64 degrees and cloudy today.",
    waitAfterPromptMs: 4000,
  },
  {
    id: "generative-ui-your-components-interactive",
    name: "Generative UI - Your Components · Interactive",
    videoName: "YourComponentsInteractive",
    docPath: "generative-ui/your-components/interactive",
    route: "generative-ui/your-components/interactive",
    ideFile: "frontend/src/app/generative-ui/your-components/interactive/demo-chat/page.tsx",
    startLine: 23,
    endLine: 58,
    prompt: "Clear the temp cache for me by running rm -rf /tmp/cache",
    waitAfterPromptMs: 4000,
  },
  {
    id: "generative-ui-tool-rendering",
    name: "Generative UI - Tool Rendering",
    videoName: "ToolRendering",
    docPath: "generative-ui/tool-rendering",
    route: "generative-ui/tool-rendering",
    ideFile: "frontend/src/app/generative-ui/tool-rendering/demo-chat/page.tsx",
    startLine: 21,
    endLine: 54,
    prompt: "Check the weather in Tokyo for me.",
    waitAfterPromptMs: 4000,
  },
  {
    id: "generative-ui-state-rendering",
    name: "Generative UI - State Rendering",
    videoName: "StateRendering",
    docPath: "generative-ui/state-rendering",
    route: "generative-ui/state-rendering",
    ideFile: "frontend/src/app/generative-ui/state-rendering/demo-chat/page.tsx",
    startLine: 23,
    endLine: 27,
    prompt: "Please switch the language to Spanish.",
    waitAfterPromptMs: 4000,
  },
  {
    id: "frontend-tools",
    name: "App Control - Frontend Tools",
    videoName: "FrontendTools",
    docPath: "frontend-tools",
    route: "frontend-tools",
    ideFile: "frontend/src/app/frontend-tools/demo-chat/page.tsx",
    startLine: 17,
    endLine: 27,
    prompt: "Can you say hello to me?",
    waitAfterPromptMs: 4000,
  },
  {
    id: "human-in-the-loop-tool-based",
    name: "App Control - Human in the Loop",
    videoName: "HumanInTheLoop",
    docPath: "human-in-the-loop/tool-based",
    route: "human-in-the-loop/tool-based",
    ideFile: "frontend/src/app/human-in-the-loop/tool-based/demo-chat/page.tsx",
    startLine: 20,
    endLine: 49,
    prompt: "Clear the temp cache for me by running rm -rf /tmp/cache",
    waitAfterPromptMs: 4000,
  },
  {
    id: "human-in-the-loop-governed-actions",
    name: "App Control - Governed Action Approval",
    videoName: "GovernedActions",
    docPath: "human-in-the-loop/governed-actions",
    route: "human-in-the-loop/governed-actions",
    ideFile:
      "frontend/src/app/human-in-the-loop/governed-actions/demo-chat/page.tsx",
    startLine: 102,
    endLine: 148,
    prompt:
      "Please send an invoice reminder to acme@example.com, but check with me before it goes out.",
    waitAfterPromptMs: 6000,
  },
  {
    id: "background-tasks",
    name: "App Control - Background Tasks",
    videoName: "BackgroundTasks",
    docPath: "background-tasks",
    route: "background-tasks",
    ideFile: "frontend/src/app/background-tasks/demo-chat/page.tsx",
    startLine: 17,
    endLine: 33,
    // The page only mounts the chat. The renderer is where the badge lives, and
    // the badge is what this recording is about -- see the handler in
    // actions/background-tasks.action.ts.
    extraTabs: [
      {
        filePath: "frontend/src/components/background-task-activity.tsx",
        startLine: 40,
        endLine: 60,
      },
    ],
    // Must actually dispatch the background tool. The old "tell me a joke"
    // never queued anything, so the activity card never rendered and the video
    // showed a plain chat reply on a page about background work.
    prompt: "Research the history of the Dutch East India Company for me, and let me know when you are done.",
    // Longer than the usual 4s: the handler holds on the card after returning
    // from the Inspector, and that shot is the finding.
    waitAfterPromptMs: 6000,
  },
  {
    id: "shared-state-in-app-agent-read",
    name: "Shared State - Reading agent state",
    videoName: "ReadingAgentState",
    docPath: "shared-state/in-app-agent-read",
    route: "shared-state/in-app-agent-read",
    ideFile: "frontend/src/app/shared-state/in-app-agent-read/demo-chat/page.tsx",
    startLine: 47,
    endLine: 57,
    prompt: "Please switch the language to Spanish.",
    waitAfterPromptMs: 4000,
  },
  {
    id: "shared-state-in-app-agent-write",
    name: "Shared State - Writing agent state",
    videoName: "WritingAgentState",
    docPath: "shared-state/in-app-agent-write",
    route: "shared-state/in-app-agent-write",
    ideFile: "frontend/src/app/shared-state/in-app-agent-write/demo-chat/page.tsx",
    startLine: 20,
    endLine: 24,
    prompt: "Please switch the language to Spanish.",
    waitAfterPromptMs: 4000,
  },
  {
    id: "shared-state-predictive-state-updates",
    name: "Shared State - Predictive State Updates",
    videoName: "PredictiveStateUpdates",
    docPath: "shared-state/predictive-state-updates",
    route: "shared-state/predictive-state-updates",
    ideFile: "frontend/src/app/shared-state/predictive-state-updates/demo-chat/page.tsx",
    startLine: 20,
    endLine: 24,
    prompt: "Please switch the language to Spanish.",
    waitAfterPromptMs: 4000,
  },
  {
    id: "agent-app-context",
    name: "Shared State - Agent App Context",
    videoName: "AgentAppContext",
    docPath: "agent-app-context",
    route: "agent-app-context",
    ideFile: "frontend/src/app/agent-app-context/demo-chat/page.tsx",
    startLine: 24,
    endLine: 28,
    prompt: "What do you know about me from the app context?",
    waitAfterPromptMs: 4000,
  },
  {
    id: "copilot-runtime",
    name: "Backend - Copilot Runtime",
    videoName: "CopilotRuntime",
    docPath: "copilot-runtime",
    route: "copilot-runtime",
    ideFile: "frontend/src/app/copilot-runtime/demo-chat/page.tsx",
    startLine: 29,
    endLine: 63,
    prompt: "What is the weather in Berlin today?",
    waitAfterPromptMs: 4000,
  },
  {
    id: "ag-ui",
    name: "Backend - AG-UI",
    videoName: "AGUI",
    docPath: "ag-ui",
    route: "ag-ui",
    ideFile: "frontend/src/app/ag-ui/demo-chat/page.tsx",
    startLine: 37,
    endLine: 41,
    prompt: "Any rain expected in Tokyo this week?",
    waitAfterPromptMs: 4000,
  },

  // The scaffolded app, once per package manager — video 3 of each set.
  // LAST on purpose: order determines the NN in every derived filename, so
  // appending keeps all 23 doc pages above at the numbers they already have.
  // These four name their own files via `videoFile` and so take no number.
  //
  // `generated: true`: these files are produced by the CLI pipeline, so before
  // it has run the doctor reports them as warnings rather than failing, and an
  // unfiltered run skips them with a note. All four scaffolds happen to be on
  // disk already from an earlier manual run, so today the doctor checks their
  // line ranges for real.
  ...DEMO_PAGES,
]);
