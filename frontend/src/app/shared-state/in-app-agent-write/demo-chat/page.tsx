"use client";

import { useEffect } from "react";

import { CopilotChat, useAgent } from "@copilotkit/react-core/v2";

import { DemoFrame } from "@/components/demo-frame";

/**
 * Writing into Mastra working memory from the app.
 *
 * `agent.setState` updates the state the agent sees on its next run — so
 * toggling here changes the language the agent replies in, without you saying
 * anything about it in the conversation.
 */

type AgentState = {
  language: "english" | "spanish";
};

export default function Page() {
  // [1] shared state: bind to the agent
  // [!code highlight]
  const { agent, isReady } = useAgent({ agentId: "languageAgent" });
  const state = (agent.state ?? {}) as Partial<AgentState>;

  // [2] shared state: seed state once the agent is ready
  // [!code highlight]
  useEffect(() => {
    if (!isReady || state.language !== undefined) return;
    agent.setState({ ...(agent.state ?? {}), language: "english" });
  }, [agent, isReady, state.language]);

  // [3] shared state: update working memory
  // [!code highlight]
  const toggleLanguage = () => {
    agent.setState({
      ...(agent.state ?? {}),
      language: state.language === "english" ? "spanish" : "english",
    });
  };

  return (
    <DemoFrame
      parentPath="/shared-state/in-app-agent-write"
      subtitle="agent.setState · languageAgent"
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

          <button
            type="button"
            onClick={toggleLanguage}
            className="mt-4 rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white"
          >
            Toggle Language
          </button>

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
                "Toggle the language on the left, then say anything — I should reply in that language.",
            }}
          />
        </div>
      </div>
    </DemoFrame>
  );
}
