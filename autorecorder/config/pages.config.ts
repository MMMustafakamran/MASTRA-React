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

    // `demoNavMs` only, and measured rather than guessed.
    //
    // Next reports `✓ Ready in 2s` and means it — but Turbopack compiles routes
    // on demand, so the first request to `/` is what actually builds the app. On
    // the pnpm copy that took **184.6s** (recorder's own readiness step,
    // 2026-09-08), while the default `demoNavMs` aborts `page.goto` at 45s. The
    // navigation was being killed a full two minutes before the page could
    // exist. pnpm's symlinked `node_modules` resolves far slower here than npm's
    // flat tree, which is why npm cleared 45s and pnpm never could.
    //
    // 240s matches `readyTimeoutMs` below: the same budget for "this app is
    // still compiling" in both places.
    //
    // `replyStartMs` is deliberately NOT raised. 90s was tried on 2026-09-07 and
    // changed nothing — this starter's agent does not answer slowly, it fails
    // outright (see the Demo section of ../../1-cli-testing/CLI-FLOW.md), and a
    // generous ceiling would only lengthen each failing run.
    timeouts: { demoNavMs: 240_000 },

    devServer: {
      cwd: app,
      command,
      // `dev:ui`, not `dev` — observed 2026-09-07, and the reason every demo
      // here failed with "Agent never produced a response".
      //
      // `dev` is `dev:infra && concurrently "npm run dev:ui" "npm run dev:agent"`,
      // and `dev:agent` is `mastra dev`. The Mastra CLI reads its port from
      // `process.env.PORT` and nothing else (9 references in node_modules/mastra,
      // no MASTRA_PORT) — the same variable set below to move Next off 3000. So
      // both servers try to bind this port, `mastra dev` loses with EADDRINUSE,
      // and `concurrently --kill-others` takes the UI down with it, mid-demo.
      //
      // Nobody hits this running the starter normally: with PORT unset Next
      // takes 3000 and Mastra takes its own default. It is relocating the port
      // that collides them, which is this harness's doing, not the starter's.
      //
      // Dropping `dev:agent` costs the demo nothing. The chat agent runs
      // **in-process** inside the Next route — `src/app/api/copilotkit/[[...slug]]/route.ts`
      // builds it from `createLocalAgents()` in `src/agent.ts`, which imports
      // `src/mastra` directly. `mastra dev` only serves the separate Mastra
      // playground, which this demo never opens.
      // `dev`, as the quickstart documents it. NOT `dev:ui`.
      //
      // This ran `dev:ui` for one day (2026-09-07) to dodge the `mastra dev`
      // port collision described above, and that was a mistake worth naming:
      // dropping `dev:agent` also dropped the only process that fails. The
      // agent crashes on startup under pnpm and yarn — see the finding in
      // cli.config.ts — and running just the UI hid it behind a green-looking
      // recorder while the real command died in seconds for anyone who typed it.
      //
      // Never quiet the process under test to make the harness proceed. If the
      // port collision bites again, relocate the port; do not remove the agent.
      args,
      env: { PORT: String(port), BROWSER: 'none' },
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
      // Says what actually runs — and now that is the documented command.
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
    // Was "Is it raining in Tokyo right now?", which this page cannot answer:
    // it drives `myAgent`, and `myAgent` carries no tools (agents.ts,
    // #region my-agent). The clip showed a run firing correctly and the agent
    // replying that it has no access to live weather -- a real refusal filmed
    // on a page about `copilotkit.runAgent`. The mechanism is the subject here,
    // so the message is one this agent can actually complete.
    prompt: "In one sentence, what is an AG-UI run?",
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
    // Was "Please switch the language to Spanish." -- the Shared State prompt,
    // pasted onto a page that drives `searchAgent`. That agent has no
    // `language` in its working memory at all: its schema is `searches`
    // (agents.ts, #region search-agent) and its only tool is `addSearch`. The
    // clip therefore showed the searches panel sitting empty on a page whose
    // entire subject is that panel filling.
    //
    // These two are the page's own suggestions -- `TryIt` in
    // `state-rendering/page.tsx` lists them verbatim -- and they are a PAIR on
    // purpose. One search proves the list renders; the second proves state
    // *accumulates* across turns, which is what separates state rendering from
    // tool rendering one page earlier.
    prompts: [
      "Add a search for the tallest mountains",
      "Now add one for the deepest oceans",
    ],
    prompt: "Add a search for the tallest mountains",
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
    // Was "Can you say hello to me?" -- and `sayHello` takes a REQUIRED `name`
    // (`parameters: z.object({ name: z.string() })`). Asked that way the model
    // has no value to fill it with, so it asks "what should I call you?" in
    // prose instead of calling the tool, the browser alert never fires, and
    // the handler's dialog assertion turns a page that works into a red take.
    //
    // Naming someone supplies the argument. This is the page's own welcome
    // suggestion ("Try \"Say hello to Damien\"") rather than one invented here.
    prompt: "Say hello to Damien",
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
    // Was "Clear the temp cache for me by running rm -rf /tmp/cache" -- which
    // is the *Interactive* page's prompt, aimed at its `humanApprovedCommand`
    // tool. This page registers `offerOptions` instead: two labelled choices,
    // no command anywhere in its schema. A shell request gives the model
    // nothing to offer, so it answered in prose, the two buttons never
    // rendered, and the run never suspended -- on the page whose whole subject
    // is the suspend.
    //
    // Verbatim from the doc: doc-snapshot/pages/mastra__human-in-the-loop__tool-based.md:87.
    prompt: "Can you show me two good options for a restaurant name?",
    // The run halts on the tool call and only resumes when `respond` fires, so
    // the reply this waits on arrives after the click, not after the prompt.
    waitAfterPromptMs: 5000,
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
    // Two turns, because the card has two answers and only one of them was
    // ever filmed. The first request is harmless and gets approved; the second
    // is destructive and gets rejected, which is the half that shows the
    // policy actually stopping something.
    prompts: [
      "Please send an invoice reminder to acme@example.com, but check with me before it goes out.",
      "Now permanently delete the acme@example.com customer record, but check with me before it goes through.",
    ],
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
    // Was "Please switch the language to Spanish." -- the READ page's prompt,
    // and on this page it tests the wrong direction. Read is the agent writing
    // state the app displays; write is the app writing state the AGENT reads,
    // and the doc says so plainly: "Try toggling the language button"
    // (doc-snapshot/pages/mastra__shared-state__in-app-agent-write.md:134).
    // Asking the chat to switch languages proves nothing about
    // `agent.setState` -- the same clip would pass with the button deleted.
    //
    // So the handler clicks `Toggle Language` first and this prompt is
    // deliberately NEUTRAL: it never names a language, so the only thing that
    // can make the answer come back in Spanish is the state the button wrote.
    prompt: "In one sentence, what is working memory?",
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
    // Was "Please switch the language to Spanish." again -- and this page does
    // not drive `languageAgent` at all. It drives `streamingAgent`, whose
    // working memory is a single `document` string (agents.ts, #region
    // streaming-agent) and whose instructions tell it to write into that field
    // whenever asked to write, draft or revise. A language request matches none
    // of those verbs, so the document pane stayed on its placeholder for the
    // whole take and the LIVE badge never appeared.
    //
    // The doc's own suggestion is "a poem, draft an email, or explain a topic"
    // (.../mastra__shared-state__predictive-state-updates.md:121); the page's
    // welcome text picks the blog post. Long enough to watch stream in, short
    // enough to finish inside the take.
    prompt: "Write a short blog post about sea otters.",
    // The point of the clip is the document filling token by token, so hold on
    // the finished pane rather than cutting the moment the reply settles.
    waitAfterPromptMs: 6000,
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
    // Was "What do you know about me from the app context?" -- a question about
    // the plumbing, which invites the agent to describe its own instructions
    // rather than use them. It also asks about the wrong subject: the only
    // thing `useAgentContext` publishes here is "The current user's
    // colleagues", so the agent knows nothing "about me".
    //
    // Naming the three people is what makes the clip evidence. John Doe, Jane
    // Smith and Bob Wilson are rendered in the left pane and were never sent as
    // a chat message -- an answer that reproduces their roles could only have
    // come through `requestContext.get('ag-ui')`.
    prompt: "Who are my colleagues, and what does each of them do?",
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
    // Was a single "What is the weather in Berlin today?" on a page that opens
    // selected on `myAgent`. That agent has no tools, so the weather question
    // went to the one agent on the page that cannot answer it -- confirmed in
    // the 2026-09-09 frontend log, which shows exactly one
    // `POST /api/copilotkit/agent/myAgent/run` for this route and no others.
    //
    // Worse, a single prompt cannot test this page at all. The subject is
    // ROUTING: seven ids, `<CopilotChat key={agentId}>` remounting on each
    // switch. One turn on the default id never touches a button, so the clip
    // was indistinguishable from the Quickstart recording.
    //
    // Two turns, and the same *kind* of question asked of two agents, is what
    // makes routing visible: `myAgent` can only answer in prose, `weatherAgent`
    // carries `weatherInfo` and calls it. The handler clicks between them and
    // the remount also shows each id keeping its own conversation.
    prompts: [
      "What is the weather in Berlin today?",
      "What is the weather in Berlin today?",
    ],
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
    // Was "Any rain expected in Tokyo this week?", which reads like it is there
    // to produce TOOL_CALL_* rows in the event pane -- but this page is wired
    // to `myAgent`, which has no tools, so it never could. What it produced was
    // a refusal, and a refusal streams the same RUN_STARTED /
    // TEXT_MESSAGE_CONTENT / RUN_FINISHED sequence as anything else while
    // looking like the page failed.
    //
    // The event stream is the subject, and a multi-sentence answer is what
    // fills it: TEXT_MESSAGE_CONTENT is emitted per chunk, so a longer reply is
    // literally more of the thing being demonstrated.
    prompt: "Explain the AG-UI protocol in three short sentences.",
    waitAfterPromptMs: 4000,
  },
  {
    id: "intelligence-quickstart",
    name: "Intelligence - Connect Intelligence in 5 minutes",
    videoName: "IntelligenceQuickstart",
    docPath: "intelligence/quickstart",
    route: "intelligence/quickstart",
    // The doc's step 3: a plain `route.ts` with `mode: "single-route"` and one
    // verb, where the page used to publish `[[...slug]]` and four.
    ideFile: "frontend/src/app/api/copilotkit-single/route.ts",
    startLine: 1,
    endLine: 37,
    extraTabs: [
      // Step 4: the matching provider flag.
      {
        filePath: "frontend/src/components/single-endpoint-provider.tsx",
        startLine: 26,
        endLine: 39,
      },
    ],
    prompt: "Tell me a one-line joke.",
    // The only page in this suite whose runtime route is never touched by any
    // other take, so its first request is also the first time `next dev`
    // compiles `/api/copilotkit-single`. On a cold CI runner that lands past
    // the 30s default and the take fails with the agent apparently silent.
    // `core/timeouts.ts` says the defaults suit a warm dev server and that a
    // legitimately slow page should say so here; this is that page.
    timeouts: { replyStartMs: 90_000 },
    waitAfterPromptMs: 4000,
  },

  {
    id: "generative-ui-a2ui",
    name: "Generative UI - A2UI",
    videoName: "A2UI",
    docPath: "generative-ui/a2ui",
    route: "generative-ui/a2ui",
    // ── Why this sits at the END rather than in doc-nav order ──────────────
    // The doc nav puts A2UI inside Generative UI, which by this file's usual
    // rule would place it fourth and renumber the eleven pages after it. That
    // is the same trade-off the DEMO_PAGES block below already resolved the
    // same way ("LAST on purpose: order determines the NN in every derived
    // filename"). Renaming eleven existing clips to insert one is a worse
    // outcome for anyone diffing a run against yesterday's, so the new page
    // takes the next free number instead. Move it up if the numbering is ever
    // rebased deliberately.
    //
    // ── What the IDE tab shows ──────────────────────────────────────────────
    // The runtime route, not the demo page -- and that IS the finding this
    // clip carries. Every other Generative UI take opens on a page full of
    // registered React; this one's demo page has none, so showing it would
    // display a bare `<CopilotChat>` and explain nothing. The `a2ui` option is
    // where the whole feature lives.
    ideFile: "frontend/src/app/api/copilotkit/[[...slug]]/route.ts",
    startLine: 26,
    endLine: 51,
    extraTabs: [
      // The `a2ui-agent` region: an ordinary Mastra agent with no mention of
      // A2UI anywhere in it, which is the point — the capability is
      // middleware, not agent code.
      {
        filePath: "frontend/src/mastra/agents.ts",
        startLine: 143,
        endLine: 168,
      },
      // The demo page, precisely because there is nothing in it.
      {
        filePath: "frontend/src/app/generative-ui/a2ui/demo-chat/page.tsx",
        startLine: 30,
        endLine: 43,
      },
    ],
    // Asks for a LAYOUT, not a fact. "Three pricing plans as cards" is the
    // kind of request that has an obviously better answer as an interface than
    // as a paragraph, so a prose reply is a visible failure rather than an
    // acceptable alternative -- which is what makes the take a test.
    prompt: "Show me three pricing plans as cards: Free, Pro and Team.",
    // A2UI streams a component tree, not a sentence. It has more to emit than
    // a chat reply and the layout paints progressively, so the take holds
    // longer than the 4s standard.
    waitAfterPromptMs: 7000,
  },

  // -- Added 2026-09-11: three pages new upstream, identical under every
  // framework prefix. After every existing doc page (and before DEMO_PAGES) so
  // no clip is renumbered.
  {
    id: "frontend-cards",
    name: "Generative UI - Frontend-Driven Cards",
    videoName: "FrontendCards",
    docPath: "generative-ui/frontend-cards",
    route: "generative-ui/frontend-cards",
    // Step 1: the renderer, verbatim.
    ideFile: "frontend/src/app/generative-ui/frontend-cards/event-card.tsx",
    startLine: 7,
    endLine: 27,
    extraTabs: [
      // Step 2: registered on the provider, props as published.
      {
        filePath: "frontend/src/app/generative-ui/frontend-cards/demo-chat/page.tsx",
        startLine: 160,
        endLine: 181,
      },
      // Step 3: addMessage with role "activity", verbatim -- and the bare
      // `useAgent()` on its first line, which is what crashes this route:
      // it resolves to "default", and this Mastra runtime has no such agent.
      {
        filePath: "frontend/src/app/generative-ui/frontend-cards/deployment-watcher.tsx",
        startLine: 12,
        endLine: 34,
      },
    ],
    // Never sent on this repo while the route crashes; kept so the take runs
    // in full the day it does not.
    prompt:
      "Have you been shown any deployment card in this conversation? List the roles of every message you received.",
    waitAfterPromptMs: 4000,
  },
  {
    id: "intelligence-memories",
    name: "Intelligence - Memories & Recall",
    videoName: "Memories",
    docPath: "intelligence/memories",
    route: "intelligence/memories",
    // The page's React component, verbatim -- with the two compiler errors its
    // import produces acknowledged in place.
    ideFile: "frontend/src/app/intelligence/memories/memory-list.tsx",
    startLine: 22,
    endLine: 45,
    extraTabs: [
      // The option the page never mentions, and without which every memory
      // route 404s at the runtime.
      {
        filePath: "frontend/src/app/api/copilotkit-memory/[[...slug]]/route.ts",
        startLine: 45,
        endLine: 64,
      },
    ],
    prompt: "Please remember that I prefer concise status updates.",
    waitAfterPromptMs: 3000,
  },
  {
    id: "learning",
    name: "Intelligence - Learning",
    videoName: "Learning",
    docPath: "learning",
    route: "learning",
    // The page's runtime snippet, verbatim, and the two identifiers it leaves
    // undefined supplied above it.
    ideFile: "frontend/src/lib/learning-runtime.ts",
    startLine: 34,
    endLine: 62,
    extraTabs: [
      // Where it is mounted: its own route, so the page's code cannot take
      // down the app's main runtime.
      {
        filePath: "frontend/src/app/api/copilotkit-learning/[[...slug]]/route.ts",
        startLine: 1,
        endLine: 23,
      },
    ],
    prompt: "Review this expense: $42 team lunch at Cafe Rio, receipt attached. Approve or flag it?",
    // Turn 2 is the control on `default`, which the selector assigns nowhere.
    prompts: [
      "Review this expense: $42 team lunch at Cafe Rio, receipt attached. Approve or flag it?",
      "Say hello in five words.",
    ],
    waitAfterPromptMs: 3000,
  },

  // The scaffolded app, once per package manager — video 3 of each set.
  // LAST on purpose: order determines the NN in every derived filename, so
  // appending keeps all 28 doc pages above at the numbers they already have.
  // These four name their own files via `videoFile` and so take no number.
  //
  // `generated: true`: these files are produced by the CLI pipeline, so before
  // it has run the doctor reports them as warnings rather than failing, and an
  // unfiltered run skips them with a note. All four scaffolds happen to be on
  // disk already from an earlier manual run, so today the doctor checks their
  // line ranges for real.
  ...DEMO_PAGES,
]);
