"use client";

import { useEffect } from "react";

import { CopilotChat, useAgent } from "@copilotkit/react-core/v2";

import { DemoFrame } from "@/components/demo-frame";

/**
 * Reading Mastra working memory in your own UI.
 *
 * `languageAgent` declares a `{ language }` working-memory schema. Asking it to
 * switch language updates that memory, and `agent.state` — and this panel —
 * follow, with no message parsing on the frontend.
 *
 * The page used to seed with `useAgent({ initialState })`, a prop that has
 * never existed on the hook. It now seeds in an effect gated on `isReady`,
 * which is a real return value in @copilotkit/react-core 1.66.2 — so the
 * published snippet compiles and is reproduced verbatim below.
 */

type AgentState = {
  language: "english" | "spanish";
};

export default function Page() {
  // [1] shared state: read working memory
  // [!code highlight]
  const { agent, isReady } = useAgent({ agentId: "languageAgent" });
  const state = (agent.state ?? {}) as Partial<AgentState>;

  // [2] shared state: seed state once the agent is ready
  // [!code highlight]
  useEffect(() => {
    if (!isReady || state.language !== undefined) return;
    agent.setState({ ...(agent.state ?? {}), language: "english" });
  }, [agent, isReady, state.language]);

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
              {state.language ?? "—"}
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
