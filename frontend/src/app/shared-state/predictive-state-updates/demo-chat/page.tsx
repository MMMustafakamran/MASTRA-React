"use client";

import {
  CopilotChat,
  UseAgentUpdate,
  useAgent,
} from "@copilotkit/react-core/v2";

import { DemoFrame } from "@/components/demo-frame";

/**
 * A document streamed into working memory and rendered as it is written.
 *
 * The point of `updates` here: by default `useAgent` re-renders on message
 * changes. Subscribing to `OnStateChanged` and `OnRunStatusChanged` makes the
 * component track state and run status instead, which is what turns a slow
 * write into a live-updating document rather than one that appears at the end.
 */
export default function Page() {
  const { agent } = useAgent({
    agentId: "streamingAgent",
    updates: [UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged],
  });

  const document = (agent.state as { document?: string })?.document ?? "";

  return (
    <DemoFrame
      parentPath="/shared-state/predictive-state-updates"
      subtitle="document streamed into working memory · streamingAgent"
    >
      <div className="grid h-full grid-cols-1 lg:grid-cols-2">
        <div className="min-h-0 overflow-y-auto border-b border-slate-200 p-4 lg:border-b-0 lg:border-r dark:border-slate-800">
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-50">
            Document
            {agent.isRunning && (
              <span className="rounded bg-[var(--accent)] px-1.5 py-0.5 text-xs font-medium text-white">
                LIVE
              </span>
            )}
          </h1>
          <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-slate-200 p-3 text-sm text-slate-800 dark:border-slate-700 dark:text-slate-100">
            {document || "Ask the agent to write something…"}
          </pre>
        </div>

        <div className="min-h-0">
          <CopilotChat
            agentId="streamingAgent"
            labels={{
              welcomeMessageText:
                'Try "Write a short blog post about otters" and watch the left pane fill in.',
            }}
          />
        </div>
      </div>
    </DemoFrame>
  );
}
