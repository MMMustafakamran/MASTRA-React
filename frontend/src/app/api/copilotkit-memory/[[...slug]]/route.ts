import { MastraAgent } from "@ag-ui/mastra";
import {
  CopilotKitIntelligence,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";

import { mastra } from "@/mastra";

/**
 * NOT FROM THE PAGE. The runtime option Memories & Recall never mentions.
 *
 * The page says memory "is not a feature flag" and that `isAvailable: false` is
 * what an unentitled deployment looks like. On the runtime there is a gate
 * before entitlement is ever consulted: every `/memories/*` request 404s at the
 * runtime unless it is constructed with `memory: { access }` (or the deprecated
 * `exposeMemoryRoutes: true`) — a "secure default", per the runtime's own
 * typings, present on this repo's locked 1.66.2 and on CI's 1.71.0 alike.
 * `/api/copilotkit-threads`, built the way the Intelligence Quickstart builds
 * it, has neither, so the page's `useMemories()` reports unavailable there no
 * matter what the organization is entitled to.
 *
 * This mount is that Intelligence runtime (`lib/intelligence-runtime.ts`: the
 * same Mastra agents, `default` → `myAgent`, the same identity header) with that
 * one option added, granting the user read-write. It exists so the demo can
 * show what sits behind the undocumented gate: with the routes open, the
 * request reaches the platform, and what the platform says about this
 * project's entitlement is what the hook then reports.
 *
 * One deliberate difference from the threads runtime: it needs only the
 * Intelligence key, not `COPILOTKIT_LICENSE_TOKEN` as well. Memory is an
 * Intelligence-platform surface, and the platform, not the license, is what
 * this mount is here to ask.
 */

const firstSet = (...values: (string | undefined)[]) =>
  values.find((v) => typeof v === "string" && v.trim().length > 0)?.trim();

const INTELLIGENCE_KEY = firstSet(
  process.env.CPK_INTELLIGENCE_API_KEY,
  process.env.INTELLIGENCE_API_KEY,
);
const LICENSE_TOKEN = firstSet(process.env.COPILOTKIT_LICENSE_TOKEN);

function build(): CopilotRuntime | null {
  if (!INTELLIGENCE_KEY) return null;
  const localAgents = MastraAgent.getLocalAgents({
    mastra,
    resourceId: "copilotkit-harness",
  });
  return new CopilotRuntime({
    agents: { ...localAgents, default: localAgents.myAgent },
    intelligence: new CopilotKitIntelligence({ apiKey: INTELLIGENCE_KEY }),
    identifyUser: (request: Request) => {
      const id = request.headers.get("x-copilotkit-user-id") ?? "demo-user";
      return { id, name: id === "demo-user" ? "Demo User" : id };
    },
    ...(LICENSE_TOKEN ? { licenseToken: LICENSE_TOKEN } : {}),
    // The missing option.
    memory: {
      access: () => ({ user: "read-write", project: "none" }),
    },
  });
}

const runtime = build();

const handler = runtime
  ? createCopilotRuntimeHandler({ runtime, basePath: "/api/copilotkit-memory" })
  : async () =>
      Response.json(
        { error: "CPK_INTELLIGENCE_API_KEY is not set; memory needs an Intelligence runtime." },
        { status: 503 },
      );

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
