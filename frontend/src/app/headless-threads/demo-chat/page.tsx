"use client";

import { CopilotChat, useAgent, useThreads } from "@copilotkit/react-core/v2";
import { useEffect, useReducer, useState } from "react";
import { DemoFrame } from "@/components/demo-frame";
import { ThreadsProvider } from "@/components/threads-provider";

/**
 * "Driving one agent per thread", the section the guide added below the four
 * steps. The published snippet, verbatim:
 *
 *   const { agent } = useAgent({
 *     agentId: `chat-${threadId}`, // local id, unique per mounted thread
 *     runtimeAgentId: "default",   // the one runtime agent they all route to
 *     threadId,                    // the thread this instance is pinned to
 *   });
 *
 * The only change is the runtime agent's name: this harness registers
 * `myAgent`, which is the id every other route on this page already passes.
 * https://docs.copilotkit.ai/mastra/headless-threads
 */
function ThreadAgentTab({
  threadId,
  label,
}: {
  threadId: string;
  label: string;
}) {
  // [!code highlight]
  const { agent, isReady } = useAgent({
    agentId: `chat-${threadId}`, // local id, unique per mounted thread
    runtimeAgentId: "myAgent", // the one runtime agent they all route to
    threadId, // the thread this instance is pinned to
  });

  const [isRunning, setIsRunning] = useState(false);
  const [, repaint] = useReducer((n: number) => n + 1, 0);

  // Harness-side, not from the doc: the hook owns re-rendering for its own
  // consumers, but this panel reads `agent.messages` directly, so it subscribes
  // to repaint as the reply streams in.
  useEffect(() => {
    const subscription = agent.subscribe({
      onMessagesChanged: () => repaint(),
    });
    return () => subscription.unsubscribe();
  }, [agent]);

  const lastAssistant = [...agent.messages]
    .reverse()
    .find((message) => message.role === "assistant");

  return (
    <div className="min-w-0 flex-1 border-l border-slate-200 p-3 first:border-l-0 dark:border-slate-800">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
          {label}
        </p>
        <button
          type="button"
          data-testid="thread-agent-run"
          disabled={!isReady || isRunning}
          onClick={async () => {
            setIsRunning(true);
            try {
              agent.addMessage({
                id: crypto.randomUUID(),
                role: "user",
                content: "In one short line, what thread am I in?",
              });
              await agent.runAgent();
            } finally {
              setIsRunning(false);
            }
          }}
          className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-[11px] font-medium hover:border-slate-400 disabled:opacity-40 dark:border-slate-600"
        >
          {isRunning ? "Running..." : "Run this thread"}
        </button>
      </div>

      <p className="mt-0.5 truncate text-[10px] text-slate-400">
        agentId chat-{threadId.slice(0, 8)} → runtime myAgent ·{" "}
        {agent.messages.length} message(s)
      </p>

      <p
        data-testid="thread-agent-reply"
        className="mt-2 line-clamp-3 text-[11px] text-slate-600 dark:text-slate-400"
      >
        {typeof lastAssistant?.content === "string"
          ? lastAssistant.content
          : "No reply on this thread yet."}
      </p>
    </div>
  );
}

/** The two most recent threads, each mounted against its own pinned agent. */
function PerThreadAgents({
  threads,
}: {
  threads: { id: string; name?: string | null }[];
}) {
  const mounted = threads.slice(0, 2);

  return (
    <div
      data-testid="per-thread-agents"
      className="shrink-0 border-t border-slate-200 dark:border-slate-800"
    >
      <p className="border-b border-slate-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800/60">
        One agent per thread
      </p>

      {mounted.length === 0 ? (
        <p className="p-3 text-[11px] text-slate-500">
          Send a message first — these panels mount against real threads.
        </p>
      ) : (
        <div className="flex">
          {mounted.map((thread) => (
            <ThreadAgentTab
              key={thread.id}
              threadId={thread.id}
              label={thread.name ?? "New conversation"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HeadlessThreadsDemo() {
  // The guide's "Switch between threads" step owns the selection in the app,
  // not in the hook: `const [activeThreadId, setActiveThreadId] = useState()`,
  // then `<CopilotChat threadId={activeThreadId} />`. `useThreads` returns the
  // list and the mutations only.
  // https://docs.copilotkit.ai/mastra/headless-threads
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>();

  const { threads, isLoading, error, deleteThread, startNewThread } =
    useThreads({ agentId: "myAgent" });

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      {/* Custom Headless Thread Sidebar */}
      <div className="flex w-72 shrink-0 flex-col border-r border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Conversations
          </h2>
          <button
            type="button"
            onClick={() => {
              startNewThread();
              setActiveThreadId(undefined);
            }}
            className="rounded bg-[var(--accent)] px-2.5 py-1 text-xs font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            + New
          </button>
        </div>

        {isLoading && (
          <p className="py-2 text-xs text-slate-400">Loading threads...</p>
        )}

        {error && <p className="py-2 text-xs text-red-500">{String(error)}</p>}

        <div className="mt-2 flex-1 space-y-1 overflow-y-auto">
          {threads && threads.length > 0
            ? threads.map((thread) => {
                const isSelected = thread.id === activeThreadId;
                return (
                  <div
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className={`group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors ${
                      isSelected
                        ? "bg-[var(--accent)] text-white font-medium shadow-sm"
                        : "text-slate-700 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="truncate pr-2">
                      {thread.name || thread.id.slice(0, 8)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void deleteThread(thread.id);
                      }}
                      className={`opacity-0 group-hover:opacity-100 hover:text-red-400 text-xs px-1 ${
                        isSelected ? "text-white/80" : "text-slate-400"
                      }`}
                      title="Delete Thread"
                    >
                      ×
                    </button>
                  </div>
                );
              })
            : !isLoading && (
                <p className="text-xs text-slate-400 italic">
                  No conversations yet.
                </p>
              )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1">
          <CopilotChat
            agentId="myAgent"
            // The guide highlights exactly this line. Without it the selection
            // never reaches the chat: it stays on whatever thread it opened with.
            threadId={activeThreadId}
            key={activeThreadId || "default"}
            labels={{
              welcomeMessageText:
                "Headless Threads Demo — create and select conversations from the custom list on the left.",
            }}
          />
        </div>

        <PerThreadAgents threads={threads ?? []} />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ThreadsProvider>
      <DemoFrame
        parentPath="/headless-threads"
        subtitle="Headless thread management using the useThreads hook."
      >
        <HeadlessThreadsDemo />
      </DemoFrame>
    </ThreadsProvider>
  );
}
