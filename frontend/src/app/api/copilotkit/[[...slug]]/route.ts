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
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
});

export const GET = handler;
export const POST = handler;
