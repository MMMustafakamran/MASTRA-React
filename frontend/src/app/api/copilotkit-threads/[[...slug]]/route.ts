import {
  CopilotRuntime,
  CopilotKitIntelligence,
  InMemoryAgentRunner,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { MastraAgent } from "@ag-ui/mastra";

import { mastra } from "@/mastra";

const LICENSE_TOKEN = process.env.COPILOTKIT_LICENSE_TOKEN;
const INTELLIGENCE_KEY = process.env.INTELLIGENCE_API_KEY;

const localAgents = MastraAgent.getLocalAgents({
  mastra,
  resourceId: "copilotkit-harness",
  untilIdle: true,
});

const runtime = new CopilotRuntime({
  // `default` matters: <CopilotThreadsDrawer> and useThreads fall back to
  // DEFAULT_AGENT_ID ("default") when given no agentId, and threads are stored
  // per agent id. Register it alongside the other Mastra agents.
  agents: {
    ...localAgents,
    default: localAgents.myAgent,
  },

  ...(INTELLIGENCE_KEY && LICENSE_TOKEN
    ? {
        intelligence: new CopilotKitIntelligence({
          apiKey: INTELLIGENCE_KEY,
        }),
        generateThreadNames: true,
        // Threads are stored per user, so the runtime must name one. A static
        // value is demo-only — reading a header makes multi-user isolation testable.
        identifyUser: (request: Request) => {
          const id = request.headers.get("x-copilotkit-user-id") ?? "demo-user";
          return { id, name: id === "demo-user" ? "Demo User" : id };
        },
        licenseToken: LICENSE_TOKEN,
      }
    : {
        runner: new InMemoryAgentRunner(),
      }),
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit-threads",
});

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
