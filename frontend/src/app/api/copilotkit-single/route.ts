// [1] intelligence quickstart: expose one Runtime route
// [!code highlight]
import { createCopilotRuntimeHandler } from "@copilotkit/runtime/v2";

import { createIntelligenceRuntime } from "@/lib/intelligence-runtime";

/**
 * The Intelligence Quickstart's "Expose one Runtime route" step, verbatim.
 *
 * The page used to mount the multi-route handler at
 * `app/api/copilotkit/[[...slug]]/route.ts` and export four verbs. As of the
 * 2026-09-09 sync it mounts the single-route handler at a plain
 * `app/api/copilotkit/route.ts` and exports only `POST`, so that is what this
 * file is: a plain `route.ts`, `mode: "single-route"`, one export.
 *
 * It is a third mount rather than a rewrite of an existing one.
 * `/api/copilotkit` is still what `quickstart` and `copilot-runtime` publish,
 * and `/api/copilotkit-threads` is the multi-route mount the Rich Threads
 * pages need. Rewriting either would have put this repo out of sync with the
 * pages that did not change.
 *
 * The runtime handed to it is the same `createIntelligenceRuntime()` the threads mount
 * uses, so the only variable between the two endpoints is the transport.
 *
 * What this mount can and cannot answer at @copilotkit/runtime 1.69.2 is
 * recorded on `/intelligence/quickstart`; the short version is that
 * `single-route-helpers` accepts exactly seven envelope methods and none of
 * them is a thread, memory, or annotation method.
 */

const handler = createCopilotRuntimeHandler({
  runtime: createIntelligenceRuntime(),
  basePath: "/api/copilotkit-single",
  mode: "single-route",
});

export const POST = handler;
