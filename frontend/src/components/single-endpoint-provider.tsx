"use client";

import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import type { ReactNode } from "react";

/**
 * Provider for `/intelligence/quickstart`, nested inside the app-wide
 * `Providers`.
 *
 * This is the Intelligence Quickstart's "Use the single-route frontend
 * transport" step: `runtimeUrl` plus a bare `useSingleEndpoint`. Everywhere
 * else in this repo the flag is pinned to `false`, because the pages that did
 * not change still publish the multi-route runtime and
 * `useSingleEndpoint={false}` alongside it. This one route is the only place
 * the new guidance applies.
 *
 * `useSingleEndpoint` with no value is `true`, which sets the core's transport
 * to `"single"`: every request becomes a POST of `{ method, params, body }` at
 * the bare `runtimeUrl`, instead of a REST call against the runtime subtree.
 * Leaving the prop off entirely would select `"auto"`, which probes REST first
 * and would therefore not exercise the doc's step at all.
 */

export function SingleEndpointProvider({ children }: { children: ReactNode }) {
  return (
    // [2] intelligence quickstart: single-route frontend transport
    // [!code highlight]
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit-single"
      useSingleEndpoint
      showDevConsole="auto"
      onError={(event) => {
        console.error(`[CopilotKit ${event.code}]`, event.error);
      }}
    >
      {children}
    </CopilotKitProvider>
  );
}
