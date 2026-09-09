import { createCopilotRuntimeHandler } from "@copilotkit/runtime/v2";

import { createIntelligenceRuntime } from "@/lib/intelligence-runtime";

/**
 * A dedicated runtime endpoint for the Rich Threads pages.
 *
 * While `/api/copilotkit` serves the standard agent features with in-memory
 * execution, `/api/copilotkit-threads` is configured with CopilotKit
 * Intelligence to persist and manage thread histories across sessions.
 *
 * The runtime itself now lives in `@/lib/intelligence-runtime`, because
 * `/api/copilotkit-single` mounts the same configuration through the
 * single-route handler the Intelligence Quickstart switched to on 2026-09-09.
 *
 * This mount stays multi-route. The thread REST subtree — list, messages,
 * events, state, rename, archive, delete — is dispatched only in multi-route
 * mode, and it is what the Rich Threads pages all still publish.
 */

const handler = createCopilotRuntimeHandler({
  runtime: createIntelligenceRuntime(),
  basePath: "/api/copilotkit-threads",
});

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
