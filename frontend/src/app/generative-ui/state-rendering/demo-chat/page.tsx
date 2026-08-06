"use client";

import { CopilotChat, useAgent } from "@copilotkit/react-core/v2";

import { DemoFrame } from "@/components/demo-frame";

/**
 * Working memory rendered live.
 *
 * `searchAgent` declares a `searches` working-memory schema. Calling
 * `addSearch` updates that memory, and `agent.state` follows — no message
 * parsing on the frontend.
 */

type AgentState = {
  searches: {
    query: string;
    done: boolean;
  }[];
};

export default function Page() {
  const { agent } = useAgent({ agentId: "searchAgent" });
  const state = agent.state as AgentState | undefined;

  return (
    <DemoFrame
      parentPath="/generative-ui/state-rendering"
      subtitle="searches working memory · searchAgent"
    >
      <div className="grid h-full grid-cols-1 lg:grid-cols-2">
        <div className="min-h-0 overflow-y-auto border-b border-slate-200 p-4 lg:border-b-0 lg:border-r dark:border-slate-800">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Searches
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            {state?.searches?.length ? (
              state.searches.map((search, index) => (
                <div key={index} className="flex flex-row gap-2 text-sm">
                  <span>{search.done ? "✅" : "❌"}</span>
                  <span className="text-slate-800 dark:text-slate-100">
                    {search.query}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                No searches yet. Ask the agent to store one.
              </p>
            )}
          </div>

          <h2 className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Raw agent.state
          </h2>
          <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
            {JSON.stringify(agent.state ?? {}, null, 2)}
          </pre>
        </div>

        <div className="min-h-0">
          <CopilotChat
            agentId="searchAgent"
            labels={{
              welcomeMessageText:
                'Try "Add a search for the tallest mountains".',
            }}
          />
        </div>
      </div>
    </DemoFrame>
  );
}
