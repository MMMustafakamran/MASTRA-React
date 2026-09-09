import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
  InMemoryAgentRunner,
} from "@copilotkit/runtime/v2";
import { MastraAgent } from "@ag-ui/mastra";

import { mastra } from "@/mastra";

// `getLocalAgents` registers every agent on the Mastra instance, keyed by the
// name it was given in `agents: { … }`. That is why routes address agents as
// `myAgent`, `weatherAgent`, and so on — the ids come from that object, not
// from each agent's `name` field.
//
// Local rather than remote is deliberate: the Shared State pages state that
// reading working memory does not work with a remote Mastra agent. The
// Copilot Runtime page's "Local vs remote agents" section frames the same
// choice by where the agent runs — this repo has no separate Mastra service to
// preserve, and `untilIdle` below has no remote equivalent.
//
// `resourceId` scopes working memory. A real app would pass the signed-in
// user's id so shared state is per-user; this harness is single-user, so it is
// constant.
//
// `untilIdle` pipes Mastra's background-task lifecycle into the run's stream,
// which is what makes the Background Tasks route report progress.
const runtime = new CopilotRuntime({
  agents: MastraAgent.getLocalAgents({
    mastra,
    resourceId: "copilotkit-harness",
    // Doc section "Completion is out of band"
    untilIdle: true,
  }),
  runner: new InMemoryAgentRunner(),

  // A2UI — docs.copilotkit.ai/mastra/generative-ui/a2ui, "Backend".
  //
  // The page's snippet is a bare `a2ui: {}`, which applies `A2UIMiddleware` to
  // every registered agent. That is not survivable here: this one runtime
  // serves all twenty-four demo routes, and handing an extra UI-authoring tool
  // to `weatherAgent`, `searchAgent` and the rest would change what every other
  // page records. So this takes the scoping the same section documents one
  // sentence later -- "To scope it to specific agents, you can specify agents
  // with the `agents` property: `a2ui: { agents: ["my-agent"] }`" -- and names
  // the one agent the A2UI route drives.
  //
  // ── This configuration does NOT render anything, and that is deliberate ──
  //
  // The page says: "Once configured, any A2UI output returned from your agent
  // will automatically be rendered in the chat interface — no additional
  // frontend code required." It is not so, and the option that would fix it is
  // knowingly left off, because the harness records what the doc publishes.
  //
  // What actually happens, traced through @copilotkit/runtime 1.66.2:
  //
  //   v2/runtime/handlers/shared/agent-utils.mjs attaches the middleware with
  //     injectA2UITool: injectA2UITool ?? (providerA2UIHasCatalog ? true : void 0)
  //
  //   `providerA2UIHasCatalog` is `input.forwardedProps?.a2uiCatalogAvailable`,
  //   which only a frontend that registered an A2UI catalog sets. This page
  //   registers none, exactly as instructed. So the flag resolves to
  //   `undefined`, and @ag-ui/a2ui-middleware 0.0.10 documents that case:
  //   "`false` / omitted — no tool is injected; the middleware relies on the
  //   agent producing A2UI JSON through its own means."
  //
  //   An ordinary Mastra agent has no such means. It is never offered a
  //   rendering tool, so it does the only thing left and describes the layout
  //   in prose.
  //
  // Verified by probe on 2026-09-09: with `injectA2UITool: true` added here, a
  // `div.a2ui-surface` renders in the thread; with the published config, no
  // element carrying an a2ui class exists anywhere on the page. The flag is
  // never named on this page — it appears only on the fixed-schema sub-page,
  // and there only in its `false` form, for agents that own the tool already.
  //
  // Do not add it. The gap between "no additional frontend code required" and
  // a setup that needs either that flag or a frontend catalog is the finding,
  // and /generative-ui/a2ui exists to show it.
  a2ui: { agents: ["a2uiAgent"] },
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
});

export const GET = handler;
export const POST = handler;
