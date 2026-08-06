"use client";

import { CopilotChat, useAgent } from "@copilotkit/react-core/v2";

import { DemoFrame } from "@/components/demo-frame";

/**
 * Reading Mastra working memory in your own UI.
 *
 * `languageAgent` declares a `{ language }` working-memory schema. Asking it to
 * switch language updates that memory, and `agent.state` — and this panel —
 * follow, with no message parsing on the frontend.
 *
 * The doc seeds the starting value with `useAgent({ initialState })`. That prop
 * does not exist on `useAgent` in @copilotkit/react-core 1.66.2, so the value
 * simply starts undefined until the agent first writes it.
 */

type AgentState = {
  language: "english" | "spanish";
};

export default function Page() {
  const { agent } = useAgent({ agentId: "languageAgent" });
  const state = agent.state as AgentState | undefined;

  return (
    <DemoFrame
      parentPath="/shared-state/in-app-agent-read"
      subtitle="working memory read from languageAgent"
    >
      <div className="grid h-full grid-cols-1 lg:grid-cols-2">
        <div className="min-h-0 overflow-y-auto border-b border-slate-200 p-4 lg:border-b-0 lg:border-r dark:border-slate-800">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Your main content
          </h1>
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
            Language:{" "}
            <strong className="text-[var(--accent)]">
              {state?.language ?? "—"}
            </strong>
          </p>

          <h2 className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Raw agent.state
          </h2>
          <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
            {JSON.stringify(agent.state ?? {}, null, 2)}
          </pre>
        </div>

        <div className="min-h-0">
          <CopilotChat
            agentId="languageAgent"
            labels={{
              welcomeMessageText:
                'Try "Switch to Spanish" and watch the panel on the left.',
            }}
          />
        </div>
      </div>
    </DemoFrame>
  );
}
