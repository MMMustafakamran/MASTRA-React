"use client";

import { CopilotChat, CopilotKitProvider, useAgent } from "@copilotkit/react-core/v2";
import { useEffect, useState } from "react";

import { DemoFrame } from "@/components/demo-frame";

/**
 * Learning, against the page's runtime at `/api/copilotkit-learning`.
 *
 * The page's selector is `agentId === "expense-agent" ? "expense-review" :
 * undefined`, so which agent a run goes to is the whole experiment: one tab per
 * id, the same Mastra `myAgent` behind both. A run on `expense-agent` should bind its Thread
 * to the `expense-review` container; a run on `default` should bind nothing.
 *
 * What this route can and cannot show. Assignment happens server-side, inside
 * the runtime, and the page gives the client no way to read it back — the
 * check it prescribes is the dashboard. So the panel prints the Thread id each
 * tab is on, which is what you look up there. Everything after assignment
 * (Run Learning, review Insights, approve a Skill, `copilotkit skills
 * download`) is dashboard and CLI work behind a login, and is not on this
 * route.
 */

const AGENT_IDS = ["expense-agent", "default"] as const;
type AgentId = (typeof AGENT_IDS)[number];

const EXPECTED: Record<AgentId, string> = {
  "expense-agent": '"expense-review"',
  default: "undefined — not assigned",
};

function AssignmentPanel({ agentId }: { agentId: AgentId }) {
  const { agent, isReady } = useAgent({ agentId });
  // The Thread id is a client-side UUID, so it is read after mount — rendered
  // on the server it would never match the one the browser generates.
  const [threadId, setThreadId] = useState<string | null>(null);
  useEffect(() => {
    setThreadId(agent.threadId ?? null);
  }, [agent, agent.threadId, agent.messages.length]);
  return (
    <table data-testid="learning-assignment" className="mt-2 w-full text-left text-xs">
      <tbody className="font-mono">
        <tr>
          <th className="w-56 py-1 pr-3 font-medium text-slate-500">agentId</th>
          <td className="py-1">{agentId}</td>
        </tr>
        <tr className="border-t border-slate-200 dark:border-slate-800">
          <th className="py-1 pr-3 font-medium text-slate-500">getLearningContainerId returns</th>
          <td data-testid="learning-expected" className="py-1">
            {EXPECTED[agentId]}
          </td>
        </tr>
        <tr className="border-t border-slate-200 dark:border-slate-800">
          <th className="py-1 pr-3 font-medium text-slate-500">Thread</th>
          <td data-testid="learning-thread" className="py-1 break-all">
            {threadId ?? "—"}
          </td>
        </tr>
        <tr className="border-t border-slate-200 dark:border-slate-800">
          <th className="py-1 pr-3 font-medium text-slate-500">agent ready</th>
          <td data-testid="learning-ready" className="py-1">
            {String(isReady)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default function Page() {
  const [agentId, setAgentId] = useState<AgentId>("expense-agent");

  return (
    <DemoFrame parentPath="/learning" subtitle="getLearningContainerId · /api/copilotkit-learning">
      <CopilotKitProvider
        runtimeUrl="/api/copilotkit-learning"
        headers={{ "x-copilotkit-user-id": "demo-user" }}
      >
        <div className="flex h-full flex-col">
          <div className="shrink-0 border-b border-slate-200 p-3 dark:border-slate-800">
            <div className="flex gap-2">
              {AGENT_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAgentId(id)}
                  className={`rounded-md border px-3 py-1.5 text-sm ${
                    id === agentId
                      ? "border-[var(--accent)] text-[var(--accent)]"
                      : "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>
            <AssignmentPanel key={agentId} agentId={agentId} />
          </div>
          <div className="min-h-0 flex-1">
            {/* [2] learning: a run on the agent the selector assigns */}
            <CopilotChat key={agentId} agentId={agentId} />
          </div>
        </div>
      </CopilotKitProvider>
    </DemoFrame>
  );
}
