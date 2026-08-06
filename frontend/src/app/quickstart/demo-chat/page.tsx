"use client";

import { CopilotSidebar } from "@copilotkit/react-core/v2";

import { DemoFrame } from "@/components/demo-frame";

/**
 * The Quickstart's own UI: a `CopilotSidebar` beside your app content.
 *
 * `agentId="myAgent"` matches the key this agent has in the Mastra instance's
 * `agents: { … }` object. The doc sets that id once on the provider via
 * `<CopilotKit agent="myAgent">`; this harness serves seven agents, so each
 * route names the one it wants instead.
 */
export default function Page() {
  return (
    <DemoFrame parentPath="/quickstart" subtitle="CopilotSidebar · myAgent">
      <main className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Your App
        </h1>
        <p className="max-w-md text-sm text-slate-500">
          The sidebar is docked at the right edge of the window. Ask it
          something to confirm the whole stack is connected.
        </p>
      </main>

      <CopilotSidebar agentId="myAgent" />
    </DemoFrame>
  );
}
