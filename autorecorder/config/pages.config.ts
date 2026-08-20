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

import { definePages } from '../core/types';

export const PAGES = definePages([
  {
    id: "quickstart",
    name: "Getting Started - Quickstart",
    videoName: "Quickstart",
    docPath: "quickstart?agent=bring-your-own",
    route: "quickstart",
    ideFile: "frontend/package.json",
    startLine: 11,
    endLine: 27,
    extraTabs: [
      { filePath: "frontend/src/app/quickstart/demo-chat/page.tsx", startLine: 15, endLine: 32 },
      { filePath: "frontend/src/app/api/copilotkit/route.ts", startLine: 1, endLine: 35 },
      { filePath: "frontend/src/mastra/index.ts", startLine: 1, endLine: 35 },
    ],
    prompt: "Can you tell me a joke?",
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
    prompt: "Can you tell me a joke?",
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
    prompt: "Can you tell me a joke?",
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
    prompt: "Can you tell me a joke?",
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
    prompt: "Can you tell me a joke?",
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
    prompt: "Can you tell me a joke?",
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
    prompt: "Display a weather card for a city.",
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
    prompt: "Run the command rm -rf /tmp/cache",
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
    prompt: "What's the weather in Tokyo?",
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
    prompt: "Switch to Spanish",
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
    prompt: "Say hello to the user.",
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
    prompt: "Run the command rm -rf /tmp/cache",
    waitAfterPromptMs: 4000,
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
    prompt: "Can you tell me a joke?",
    waitAfterPromptMs: 4000,
  },
  {
    id: "shared-state-in-app-agent-read",
    name: "Shared State - Reading agent state",
    videoName: "ReadingAgentState",
    docPath: "shared-state/in-app-agent-read",
    route: "shared-state/in-app-agent-read",
    ideFile: "frontend/src/app/shared-state/in-app-agent-read/demo-chat/page.tsx",
    startLine: 24,
    endLine: 28,
    prompt: "Switch to Spanish",
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
    prompt: "Switch to Spanish",
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
    prompt: "Switch to Spanish",
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
    prompt: "Can you tell me a joke?",
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
    prompt: "Can you tell me a joke?",
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
    prompt: "Can you tell me a joke?",
    waitAfterPromptMs: 4000,
  },
]);
