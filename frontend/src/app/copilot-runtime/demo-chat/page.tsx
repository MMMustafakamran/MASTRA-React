"use client";

import { CopilotChat } from "@copilotkit/react-core/v2";
import { useState } from "react";

import { DemoFrame } from "@/components/demo-frame";

/**
 * Agent routing across every agent on the Mastra instance.
 *
 * `getLocalAgents` registers all of them at once, keyed by the name each has in
 * the instance's `agents: { … }` object — so the ids below are exactly those
 * keys. Each id carries its own message list, so switching starts a fresh
 * conversation.
 */

const AGENTS = [
  { id: "myAgent", blurb: "Quickstart agent · no tools" },
  { id: "weatherAgent", blurb: "weatherInfo tool" },
  { id: "languageAgent", blurb: "working memory: language" },
  { id: "streamingAgent", blurb: "working memory: document" },
  { id: "searchAgent", blurb: "addSearch · working memory: searches" },
  { id: "colleaguesContactAgent", blurb: "reads ag-ui request context" },
  { id: "backgroundAgentsAgent", blurb: "run_deep_research (background)" },
] as const;

type AgentId = (typeof AGENTS)[number]["id"];

export default function Page() {
  const [agentId, setAgentId] = useState<AgentId>("myAgent");
  const active = AGENTS.find((a) => a.id === agentId)!;

  return (
    <DemoFrame parentPath="/copilot-runtime" subtitle={`routing to "${agentId}"`}>
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-b border-slate-200 p-3 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            {AGENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAgentId(a.id)}
                className={`rounded-md border px-2.5 py-1 font-mono text-xs transition-colors ${
                  agentId === a.id
                    ? "border-[var(--accent)] text-[var(--accent)]"
                    : "border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300"
                }`}
              >
                {a.id}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">{active.blurb}</p>
        </div>

        <div className="min-h-0 flex-1">
          <CopilotChat key={agentId} agentId={agentId} />
        </div>
      </div>
    </DemoFrame>
  );
}
