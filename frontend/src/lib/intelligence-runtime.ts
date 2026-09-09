import "server-only";

import {
  CopilotRuntime,
  CopilotKitIntelligence,
  InMemoryAgentRunner,
} from "@copilotkit/runtime/v2";
import { MastraAgent } from "@ag-ui/mastra";

import { mastra } from "@/mastra";

/**
 * The Intelligence runtime, built once and mounted twice.
 *
 * The Intelligence Quickstart builds a runtime in "Connect your runtime" and
 * exposes it in "Expose one Runtime route". That second step used to prescribe
 * the multi-route handler; as of the 2026-09-09 sync it prescribes
 * `mode: "single-route"`, and the frontend step gained `useSingleEndpoint`.
 * Both mounts are kept so the only variable under test is the transport:
 *
 *   `/api/copilotkit-threads` — multi-route, drives the Rich Threads routes and
 *                               is the only mode that dispatches the thread
 *                               REST subtree.
 *   `/api/copilotkit-single`  — single-route, drives `/intelligence/quickstart`.
 *
 * A factory rather than a shared instance: each route builds its own so neither
 * mount can be affected by the other's channel activation.
 */

// Treat empty/whitespace values as absent. A GitHub Actions `${{ secrets.X }}`
// reference to a secret that does not exist expands to an empty string, which
// still *defines* the variable — so a plain `??` or truthiness check on
// process.env would sail past it and hand Intelligence an empty credential.
const firstSet = (...values: (string | undefined)[]) =>
  values.find((v) => typeof v === "string" && v.trim().length > 0)?.trim();

// `CPK_INTELLIGENCE_API_KEY` is the name the docs now publish, so it is read
// first. `INTELLIGENCE_API_KEY` is what older CLIs wrote and stays accepted —
// the docs renamed the variable without saying the old one stopped working.
const INTELLIGENCE_KEY = firstSet(
  process.env.CPK_INTELLIGENCE_API_KEY,
  process.env.INTELLIGENCE_API_KEY,
);
const LICENSE_TOKEN = firstSet(process.env.COPILOTKIT_LICENSE_TOKEN);

/** True when both credentials are present, so Intelligence is actually wired. */
export const INTELLIGENCE_CONFIGURED = Boolean(
  INTELLIGENCE_KEY && LICENSE_TOKEN,
);

export function createIntelligenceRuntime(): CopilotRuntime {
  const localAgents = MastraAgent.getLocalAgents({
    mastra,
    resourceId: "copilotkit-harness",
    untilIdle: true,
  });

  return new CopilotRuntime({
    // `default` matters: <CopilotThreadsDrawer> and useThreads fall back to
    // DEFAULT_AGENT_ID ("default") when given no agentId, and threads are
    // stored per agent id. Register it alongside the other Mastra agents.
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
          // value is demo-only — reading a header makes multi-user isolation
          // testable.
          // [1] intelligence quickstart: identifyUser
          // [!code highlight]
          identifyUser: (request: Request) => {
            const id =
              request.headers.get("x-copilotkit-user-id") ?? "demo-user";
            return { id, name: id === "demo-user" ? "Demo User" : id };
          },
          licenseToken: LICENSE_TOKEN,
        }
      : {
          runner: new InMemoryAgentRunner(),
        }),
  });
}
