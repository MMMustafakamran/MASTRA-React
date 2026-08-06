"use client";

import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import type { ReactNode } from "react";

import { backgroundTaskActivityRenderer } from "./background-task-activity";

/**
 * One provider for the whole app, so chat state survives navigation between
 * test routes.
 *
 * `showDevConsole="auto"` mounts the Inspector on localhost. It is needed
 * because `CopilotKitProvider` defaults it to false — `<CopilotKit>` is the
 * component that takes `enableInspector` and defaults to on. Never mount
 * `<CopilotKitInspector />` by hand: it forwards `core ?? null`, so a bare
 * instance reports "CopilotKit core not attached".
 */

const RUNTIME_URL = "/api/copilotkit";

const LICENSE_KEY = process.env.NEXT_PUBLIC_COPILOTKIT_LICENSE_KEY;

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CopilotKitProvider
      runtimeUrl={RUNTIME_URL}
      {...(LICENSE_KEY ? { publicLicenseKey: LICENSE_KEY } : {})}
      showDevConsole="auto"
      // Activity renderers are provider-level, not page-level — this is what
      // makes the Background Tasks route show progress cards.
      renderActivityMessages={[backgroundTaskActivityRenderer]}
      onError={(event) => {
        console.error(`[CopilotKit ${event.code}]`, event.error);
      }}
    >
      {children}
    </CopilotKitProvider>
  );
}
