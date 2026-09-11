import { createCopilotRuntimeHandler } from "@copilotkit/runtime/v2";

import { learningRuntime } from "@/lib/learning-runtime";

/**
 * The Learning page's runtime, mounted multi-route like the threads runtime so
 * the thread subtree is served too — assignment is per Thread, and a Thread is
 * what the page tells you to look for afterwards.
 *
 * Without `CPK_INTELLIGENCE_API_KEY` the module throws on load (the page's
 * `apiKey: process.env.CPK_INTELLIGENCE_API_KEY!` asserts a key it does not
 * check), so this route answers 500 and nothing else in the app is affected.
 */

const handler = createCopilotRuntimeHandler({
  runtime: learningRuntime,
  basePath: "/api/copilotkit-learning",
});

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
