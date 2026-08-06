import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { MastraAgent } from "@ag-ui/mastra";
import { NextRequest } from "next/server";

import { mastra } from "@/mastra";

const serviceAdapter = new ExperimentalEmptyAdapter();

// `getLocalAgents` registers every agent on the Mastra instance, keyed by the
// name it was given in `agents: { … }`. That is why routes address agents as
// `myAgent`, `weatherAgent`, and so on — the ids come from that object, not
// from each agent's `name` field.
//
// Local rather than remote is deliberate: the Shared State pages state that
// reading working memory does not work with a remote Mastra agent.
// `resourceId` scopes working memory. The docs omit it, but `GetLocalAgentsOptions`
// requires it in @ag-ui/mastra 1.1.1 — a real app would pass the signed-in user's
// id so shared state is per-user. This harness is single-user, so it is constant.
//
// `untilIdle` pipes Mastra's background-task lifecycle into the run's stream,
// which is what makes the Background Tasks route report progress.
const runtime = new CopilotRuntime({
  agents: MastraAgent.getLocalAgents({
    mastra,
    resourceId: "copilotkit-harness",
    untilIdle: true,
  }),
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
