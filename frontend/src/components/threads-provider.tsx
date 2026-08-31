"use client";

import {
  CopilotChatConfigurationProvider,
  CopilotKitProvider,
} from "@copilotkit/react-core/v2";
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
      {/*
        The Threads Drawer page is explicit that this provider is load-bearing,
        not decoration: "Place <CopilotThreadsDrawer> next to <CopilotChat> and
        wrap **both** in a shared <CopilotChatConfigurationProvider>. That
        shared configuration is what lets the Drawer drive the chat: with no
        callbacks, selecting a row connects the chat to that thread and replays
        its history."

        It sits here rather than in each page because all three thread routes
        pair the same two components and the doc calls for one shared provider.
        https://docs.copilotkit.ai/mastra/prebuilt-components/copilot-threads-drawer
      */}
      <CopilotChatConfigurationProvider>
        {children}
      </CopilotChatConfigurationProvider>
    </CopilotKitProvider>
  );
}
