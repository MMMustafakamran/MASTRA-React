"use client";

import { CopilotChat, useThreads } from "@copilotkit/react-core/v2";
import { useState } from "react";
import { DemoFrame } from "@/components/demo-frame";
import { ThreadsProvider } from "@/components/threads-provider";

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

        {error && (
          <p className="py-2 text-xs text-red-500">{String(error)}</p>
        )}

        <div className="mt-2 flex-1 space-y-1 overflow-y-auto">
          {threads && threads.length > 0 ? (
            threads.map((thread) => {
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
          ) : (
            !isLoading && (
              <p className="text-xs text-slate-400 italic">No conversations yet.</p>
            )
          )}
        </div>
      </div>

      {/* Main Chat Area */}
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
