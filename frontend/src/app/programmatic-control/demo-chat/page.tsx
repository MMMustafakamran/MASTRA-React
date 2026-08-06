"use client";

import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { useState } from "react";

import { DemoFrame } from "@/components/demo-frame";

/**
 * Driving the agent with no chat component anywhere.
 *
 * Messages are appended by hand and the run triggered explicitly, which is what
 * `<CopilotChat />` does internally.
 */

/**
 * The doc's "Updating State" example — writing into agent state from the app.
 *
 * Two changes were needed to make it run here:
 *
 *   - `agentId` is passed explicitly. The doc calls a bare `useAgent()`, which
 *     relies on a single implicit default agent. This repo registers three and
 *     no `default`, so without the id the selector would not resolve the same
 *     agent the panel above is displaying.
 *   - `agent.state` is read optionally. It is undefined until the first run,
 *     and the doc's `agent.state.user_theme` throws on the initial render.
 */
function ThemeSelector() {
  const { agent } = useAgent({ agentId: "myAgent" });
  const state = agent.state as { user_theme?: string } | undefined;

  const updateTheme = (theme: string) => {
    agent.setState({
      ...agent.state,
      user_theme: theme,
    });
  };

  return (
    <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Toggle agent state
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => updateTheme("dark")}
          className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            state?.user_theme === "dark"
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300"
          }`}
        >
          Dark Mode
        </button>
        <button
          type="button"
          onClick={() => updateTheme("light")}
          className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            state?.user_theme === "light"
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300"
          }`}
        >
          Light Mode
        </button>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Current: <strong>{state?.user_theme || "default"}</strong>
        </p>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Writes straight into <code>agent.state</code> — watch the JSON above
        update. The value rides along with the next run. (You can check in inspector as well)
      </p>
    </div>
  );
}

export default function Page() {
  const { agent } = useAgent({ agentId: "myAgent" });
  const { copilotkit } = useCopilotKit();
  const [draft, setDraft] = useState("What's the weather in Tokyo?");

  const run = async () => {
    agent.addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: draft,
    });
    await copilotkit.runAgent({ agent });
  };

  return (
    <DemoFrame
      parentPath="/programmatic-control"
      subtitle="useAgent + copilotkit.runAgent()"
    >
      <div className="mx-auto flex h-full max-w-3xl flex-col gap-4 overflow-y-auto p-4">
        <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Agent state
          </h2>
          <dl className="mt-2 grid grid-cols-[minmax(0,8rem)_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-slate-500">Agent ID</dt>
            <dd className="break-all">
              <code>{agent.agentId ?? "—"}</code>
            </dd>
            <dt className="text-slate-500">Thread ID</dt>
            <dd className="break-all">
              <code>{agent.threadId ?? "—"}</code>
            </dd>
            <dt className="text-slate-500">Status</dt>
            <dd>
              <span className="inline-flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    agent.isRunning
                      ? "animate-pulse bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                />
                {agent.isRunning ? "Running" : "Idle"}
              </span>
            </dd>
            <dt className="text-slate-500">Messages</dt>
            <dd>{agent.messages.length}</dd>
          </dl>

          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            agent.state
          </p>
          <pre className="mt-1 max-h-32 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
            {JSON.stringify(agent.state ?? {}, null, 2)}
          </pre>

          <ThemeSelector />
        </section>

        <div className="flex flex-wrap gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
            placeholder="Message to send"
          />
          <button
            type="button"
            onClick={() => void run()}
            disabled={agent.isRunning || !draft.trim()}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Run agent
          </button>
          <button
            type="button"
            onClick={() => copilotkit.stopAgent({ agent })}
            disabled={!agent.isRunning}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200"
          >
            Stop
          </button>
        </div>

        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Conversation ({agent.messages.length})
          </h2>
          {agent.messages.length === 0 && (
            <p className="text-sm text-slate-500">Nothing yet.</p>
          )}
          {agent.messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-lg p-3 text-sm ${
                msg.role === "user"
                  ? "ml-8 bg-slate-100 dark:bg-slate-800"
                  : "mr-8 bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
              }`}
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {msg.role}
              </p>
              <p className="whitespace-pre-wrap text-slate-800 dark:text-slate-100">
                {typeof msg.content === "string"
                  ? msg.content
                  : JSON.stringify(msg.content)}
              </p>
            </div>
          ))}
        </section>
      </div>
    </DemoFrame>
  );
}
