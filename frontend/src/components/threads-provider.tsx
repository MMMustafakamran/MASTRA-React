"use client";

import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import type { ReactNode } from "react";

export function ThreadsProvider({ children }: { children: ReactNode }) {
  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit-threads"
      // Thread routes are dispatched only in multi-route mode.
      // Setting useSingleEndpoint={false} prevents auto-detection races.
      useSingleEndpoint={false}
      showDevConsole="auto"
      onError={(e) => console.error(`[CopilotKit Threads ${e.code}]`, e.error)}
    >
      {children}
    </CopilotKitProvider>
  );
}
