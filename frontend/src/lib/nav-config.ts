/**
 * The nav, the route headers, and the README status table all read from here,
 * so a doc page and its implementation status are described exactly once.
 *
 * Route paths mirror the doc URLs under docs.copilotkit.ai/mastra.
 * `offNav: true` marks pages that resolve fine but are absent from that
 * sidebar as of DOC_SYNC_DATE.
 */

/**
 * There is exactly one doc-sync date in this repo, and it is not here: it is
 * `syncedAt` in `doc-snapshot/manifest.json`, written every time the sync
 * button runs. A hand-maintained date alongside it only ever drifted out of
 * agreement with the machine one, so it was removed — `/doc-sync` is the
 * single place that answers "how current are these docs".
 */
export const DOCS_ROOT = "https://docs.copilotkit.ai/mastra";

export type RouteStatus = "working" | "partial" | "reference" | "broken" | "not-started";

export interface RouteMeta {
  path: string;
  title: string;
  docPath: string;
  summary: string;
  status: RouteStatus;
  statusNote?: string;
  offNav?: boolean;
  /** Owns a live surface at `<path>/demo-chat`. */
  hasDemo?: boolean;
}

export function demoPath(route: RouteMeta): string | undefined {
  if (!route.hasDemo) return undefined;
  return route.path === "/" ? "/demo-chat" : `${route.path}/demo-chat`;
}

export interface NavGroup {
  title: string;
  routes: RouteMeta[];
}

export const NAV: NavGroup[] = [
  {
    title: "Getting Started",
    routes: [
      {
        path: "/",
        title: "Introduction",
        docPath: "/mastra",
        summary: "What this harness covers and how the pieces fit together.",
        status: "reference",
        statusNote: "Landing page — orientation and a live agent roster.",
      },
      {
        path: "/quickstart",
        hasDemo: true,
        title: "Quickstart",
        docPath: "/mastra/quickstart?agent=bring-your-own",
        summary:
          "The bring-your-own-agent path: a Mastra instance bound into the runtime with getLocalAgents.",
        status: "working",
      },
    ],
  },
  {
    title: "Basics",
    routes: [
      {
        path: "/prebuilt-components",
        hasDemo: true,
        title: "Prebuilt Components",
        docPath: "/mastra/prebuilt-components",
        summary:
          "CopilotChat, CopilotPopup, and CopilotSidebar side by side, each driving the same agent.",
        status: "working",
      },
      {
        path: "/prebuilt-components/copilot-threads-drawer",
        hasDemo: true,
        title: "CopilotThreadsDrawer",
        docPath: "/mastra/prebuilt-components/copilot-threads-drawer",
        summary:
          "Prebuilt persistent sidebar drawer for managing threads, conversation switching, and auto-naming.",
        status: "working",
      },
      {
        path: "/threads",
        hasDemo: true,
        title: "Persistent Threads",
        docPath: "/mastra/threads",
        summary:
          "Durable conversations across browser reloads, partitioned by user and agent.",
        status: "working",
      },
    ],
  },
  {
    title: "Custom Look and Feel",
    routes: [
      {
        path: "/custom-look-and-feel/slots",
        hasDemo: true,
        title: "Slots",
        docPath: "/mastra/custom-look-and-feel/slots",
        summary:
          "Replacing chat sub-components at three levels: class strings, prop overrides, and whole components.",
        status: "working",
        offNav: true,
      },
      {
        path: "/custom-look-and-feel/headless-ui",
        hasDemo: true,
        title: "Headless UI",
        docPath: "/mastra/custom-look-and-feel/headless-ui",
        summary:
          "A chat interface built from scratch on the headless hooks, with no CopilotKit chrome.",
        status: "working",
        offNav: true,
      },
      {
        path: "/headless-threads",
        hasDemo: true,
        title: "Headless Threads",
        docPath: "/mastra/headless-threads",
        summary:
          "Headless conversation management with the useThreads hook for custom thread UI.",
        status: "working",
      },
      {
        path: "/programmatic-control",
        hasDemo: true,
        title: "Programmatic Control",
        docPath: "/mastra/programmatic-control",
        summary:
          "Driving the agent with no chat UI: read state and messages, run it, and stop it mid-run.",
        status: "working",
      },
      {
        path: "/inspector",
        hasDemo: true,
        title: "Inspector",
        docPath: "/mastra/inspector",
        summary:
          "The built-in debugging overlay showing AG-UI events, agents, state, and registered tools.",
        status: "working",
      },
    ],
  },
  {
    title: "Generative UI",
    routes: [
      {
        path: "/generative-ui/your-components/display-only",
        hasDemo: true,
        title: "Your Components · Display-only",
        docPath: "/mastra/generative-ui/your-components/display-only",
        summary:
          "Registering a React component as a tool the agent can render, with no handler.",
        status: "working",
      },
      {
        path: "/generative-ui/your-components/interactive",
        hasDemo: true,
        title: "Your Components · Interactive",
        docPath: "/mastra/generative-ui/your-components/interactive",
        summary:
          "An approval gate built with useHumanInTheLoop — the run suspends until the user authorises the action.",
        status: "working",
      },
      {
        path: "/generative-ui/tool-rendering",
        hasDemo: true,
        title: "Tool Rendering",
        docPath: "/mastra/generative-ui/tool-rendering",
        summary:
          "The weatherInfo tool call rendered as a custom component, plus a catch-all renderer.",
        status: "working",
      },
      {
        path: "/generative-ui/state-rendering",
        hasDemo: true,
        title: "State Rendering",
        docPath: "/mastra/generative-ui/state-rendering",
        summary:
          "A searches list held in working memory and rendered live as the agent updates it.",
        status: "working",
      },
    ],
  },
  {
    title: "App Control",
    routes: [
      {
        path: "/frontend-tools",
        hasDemo: true,
        title: "Frontend Tools",
        docPath: "/mastra/frontend-tools",
        summary:
          "A tool the agent calls that executes in the browser, forwarded automatically over AG-UI.",
        status: "working",
      },
      {
        path: "/human-in-the-loop/tool-based",
        hasDemo: true,
        title: "Human in the Loop",
        docPath: "/mastra/human-in-the-loop/tool-based",
        summary:
          "A tool call that suspends the run until the user picks one of two options.",
        status: "working",
      },
      {
        path: "/human-in-the-loop/governed-actions",
        hasDemo: true,
        title: "Governed Action Approval",
        docPath: "/mastra/human-in-the-loop/governed-actions",
        summary:
          "An approval checkpoint in front of a side-effecting action, with the policy verdict and the exact arguments.",
        status: "working",
      },
      {
        path: "/background-tasks",
        hasDemo: true,
        title: "Background Tasks",
        docPath: "/mastra/background-tasks",
        summary:
          "Long-running work dispatched to a background worker, surfaced as AG-UI activity events.",
        status: "working",
      },
    ],
  },
  {
    title: "Shared State",
    routes: [
      {
        path: "/shared-state/in-app-agent-read",
        hasDemo: true,
        title: "Reading agent state",
        docPath: "/mastra/shared-state/in-app-agent-read",
        summary:
          "Reading Mastra working memory in your own UI through agent.state.",
        status: "working",
      },
      {
        path: "/shared-state/in-app-agent-write",
        hasDemo: true,
        title: "Writing agent state",
        docPath: "/mastra/shared-state/in-app-agent-write",
        summary: "Writing back into working memory with agent.setState.",
        status: "working",
      },
      {
        path: "/shared-state/predictive-state-updates",
        hasDemo: true,
        title: "Predictive State Updates",
        docPath: "/mastra/shared-state/predictive-state-updates",
        summary:
          "A document streamed into working memory and rendered live as the agent writes it.",
        status: "working",
      },
      {
        path: "/agent-app-context",
        hasDemo: true,
        title: "Agent App Context",
        docPath: "/mastra/agent-app-context",
        summary:
          "Sharing app state with the agent via useAgentContext, read back through requestContext.",
        status: "working",
      },
    ],
  },
  {
    title: "Backend",
    routes: [
      {
        path: "/copilot-runtime",
        hasDemo: true,
        title: "Copilot Runtime",
        docPath: "/mastra/copilot-runtime",
        summary:
          "This repo's live runtime config, routing across all seven agents, and the local-vs-remote tradeoff.",
        status: "working",
      },
      {
        path: "/ag-ui",
        hasDemo: true,
        title: "AG-UI",
        docPath: "/mastra/ag-ui",
        summary:
          "A live capture of the raw AG-UI event stream flowing between the runtime and this page.",
        status: "working",
      },
    ],
  },
  {
    title: "Doc Sync",
    routes: [
      {
        path: "/doc-sync",
        title: "Doc drift",
        docPath: "/mastra",
        summary:
          "Re-fetches the markdown behind every tracked doc page and diffs it against the stored snapshot, flagging changes inside code blocks.",
        status: "reference",
      },
    ],
  },
];

export const ALL_ROUTES: RouteMeta[] = NAV.flatMap((g) => g.routes);

export function findRoute(path: string): RouteMeta | undefined {
  return ALL_ROUTES.find((r) => r.path === path);
}

export function docUrl(route: RouteMeta): string {
  return `https://docs.copilotkit.ai${route.docPath}`;
}

export const STATUS_LABEL: Record<RouteStatus, string> = {
  working: "Working",
  partial: "Partial",
  reference: "Reference",
  broken: "Broken",
  "not-started": "Not started",
};
