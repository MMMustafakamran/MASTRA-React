import "server-only";

import { MastraAgent } from "@ag-ui/mastra";
import {
  CopilotKitIntelligence,
  CopilotRuntime,
} from "@copilotkit/runtime/v2";

import { mastra } from "@/mastra";

/**
 * Learning, step "Assign Threads from your Runtime" — the page's runtime,
 * mounted on its own route at `/api/copilotkit-learning`.
 *
 * The snippet below the rule is verbatim. It uses two identifiers it never
 * defines, `agents` and `identifyUser`, and says nothing about them; the page
 * is identical under every framework prefix, so it cannot. They are supplied
 * here, above the rule, and they are this harness's, not the page's:
 *
 *   agents        This repo's Mastra `myAgent` under the id the page's
 *                 selector tests for, `expense-agent`, plus `default`, which
 *                 the selector sends to no container. One agent, two ids:
 *                 which one a run uses is the only thing that decides whether
 *                 it is assigned.
 *   identifyUser  The same fixed demo identity the threads runtime uses.
 *
 * A separate mount rather than an edit to an existing runtime, for two
 * reasons. `getLearningContainerId` exists only from runtime 1.70 — the page
 * names no version, and this repo's lockfile pins 1.66.2, where it is a type
 * error — and the constructor throws on a blank key, so the page's code belongs
 * where a failure takes down one route and not every chat in the app.
 */

const localAgents = MastraAgent.getLocalAgents({
  mastra,
  resourceId: "copilotkit-harness",
});

const agents = {
  default: localAgents.myAgent,
  "expense-agent": localAgents.myAgent,
};

const identifyUser = (request: Request) => {
  const id = request.headers.get("x-copilotkit-user-id") ?? "demo-user";
  return { id, name: id === "demo-user" ? "Demo User" : id };
};

// ── the page's snippet ─────────────────────────────────────────────────────

// [1] learning: assign Threads from your Runtime
const intelligence = new CopilotKitIntelligence({
  apiKey: process.env.CPK_INTELLIGENCE_API_KEY!,
  getLearningContainerId: () => "firstlearningtest",
});

const runtime = new CopilotRuntime({
  agents,
  intelligence,
  identifyUser,
});

export { runtime as learningRuntime };
