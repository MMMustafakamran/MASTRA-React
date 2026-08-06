"use client";

import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { useCallback, useState } from "react";

import { DemoFrame } from "@/components/demo-frame";


export default function Page() {
  const { agent } = useAgent({ agentId: "myAgent" });
  const { copilotkit } = useCopilotKit();
  const [input, setInput] = useState("");

  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;
    agent.addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: input,
    });
    setInput("");
    await copilotkit.runAgent({ agent });
  }, [input, agent, copilotkit]);

  return (
    <DemoFrame
      parentPath="/custom-look-and-feel/headless-ui"
      subtitle="hand-built chat over useAgent + useCopilotKit"
    >
      <div className="mx-auto flex h-full max-w-3xl flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {agent.messages.length === 0 && (
            <p className="text-sm text-slate-500">
              No messages yet. Try &ldquo;Tell me a joke&rdquo;.
            </p>
          )}

          {agent.messages.map((msg) => {
            const text =
              typeof msg.content === "string"
                ? msg.content
                : JSON.stringify(msg.content ?? "");
            if (!text || msg.role === "tool") return null;

            return (
              <div
                key={msg.id}
                className={
                  msg.role === "user"
                    ? "ml-auto max-w-md rounded-lg bg-blue-100 p-3 text-slate-900"
                    : "max-w-md rounded-lg bg-gray-100 p-3 text-slate-900"
                }
              >
                <p>{text}</p>
              </div>
            );
          })}

          {agent.isRunning && <div className="text-gray-400">Thinking...</div>}
        </div>

        <form
          className="flex gap-2 border-t border-slate-200 p-4 dark:border-slate-800"
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage();
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          />
          <button
            type="submit"
            disabled={agent.isRunning}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            Send
          </button>
          {agent.isRunning && (
            <button
              type="button"
              onClick={() => copilotkit.stopAgent({ agent })}
              className="rounded-lg border border-rose-300 px-3 py-2 text-sm font-medium text-rose-600"
            >
              Stop
            </button>
          )}
        </form>
      </div>
    </DemoFrame>
  );
}
