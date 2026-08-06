"use client";

import { CopilotChat, useAgent } from "@copilotkit/react-core/v2";
import { useEffect, useRef, useState } from "react";

import { DemoFrame } from "@/components/demo-frame";

/**
 * A live capture of the AG-UI event stream beside the chat producing it.
 *
 * These are the same events the runtime forwards as SSE — subscribing on the
 * client is the cheapest way to see what a run actually emitted.
 */

interface Entry {
  id: number;
  kind: string;
  detail: string;
  at: string;
}

const KIND_COLOR: Record<string, string> = {
  RUN_STARTED: "text-emerald-400",
  RUN_FINISHED: "text-emerald-400",
  RUN_ERROR: "text-rose-400",
  TEXT_MESSAGE_START: "text-sky-400",
  TEXT_MESSAGE_CONTENT: "text-sky-400",
  TEXT_MESSAGE_END: "text-sky-400",
  TOOL_CALL_START: "text-violet-400",
  TOOL_CALL_END: "text-violet-400",
  TOOL_CALL_RESULT: "text-violet-400",
  STATE_CHANGED: "text-amber-400",
  MESSAGES_CHANGED: "text-slate-500",
};

export default function Page() {
  const { agent } = useAgent({ agentId: "myAgent" });
  const [entries, setEntries] = useState<Entry[]>([]);
  const [paused, setPaused] = useState(false);
  const idRef = useRef(0);
  // Read inside the subscriber without re-subscribing when it toggles. Synced
  // in an effect rather than during render.
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const push = (kind: string, detail: string) => {
      if (pausedRef.current) return;
      setEntries((prev) =>
        [
          {
            id: idRef.current++,
            kind,
            detail,
            at: new Date().toLocaleTimeString(),
          },
          ...prev,
        ].slice(0, 300),
      );
    };

    const truncate = (value: unknown, max = 120) => {
      const text = typeof value === "string" ? value : JSON.stringify(value);
      if (!text) return "";
      return text.length > max ? `${text.slice(0, max)}…` : text;
    };

    const subscription = agent.subscribe({
      onRunStartedEvent: () => push("RUN_STARTED", ""),
      onRunFinishedEvent: () => push("RUN_FINISHED", ""),
      // Not every callback flattens its payload: some expose convenience
      // fields, others hand back only the raw `event`.
      onRunErrorEvent: ({ event }) => push("RUN_ERROR", event?.message ?? ""),
      onTextMessageStartEvent: () => push("TEXT_MESSAGE_START", ""),
      onTextMessageContentEvent: ({
        textMessageBuffer,
      }: {
        textMessageBuffer?: string;
      }) => push("TEXT_MESSAGE_CONTENT", truncate(textMessageBuffer)),
      onTextMessageEndEvent: () => push("TEXT_MESSAGE_END", ""),
      onToolCallStartEvent: ({ event }) =>
        push("TOOL_CALL_START", event?.toolCallName ?? ""),
      onToolCallEndEvent: ({
        toolCallName,
        toolCallArgs,
      }: {
        toolCallName?: string;
        toolCallArgs?: unknown;
      }) => push("TOOL_CALL_END", `${toolCallName} ${truncate(toolCallArgs)}`),
      onToolCallResultEvent: ({ event }) =>
        push("TOOL_CALL_RESULT", truncate(event?.content)),
      onStateChanged: () => push("STATE_CHANGED", truncate(agent.state)),
      onMessagesChanged: () =>
        push("MESSAGES_CHANGED", `${agent.messages.length} messages`),
    });

    return () => subscription.unsubscribe();
  }, [agent]);

  return (
    <DemoFrame parentPath="/ag-ui" subtitle="live AG-UI event stream">
      <div className="grid h-full grid-cols-1 lg:grid-cols-2">
        <div className="flex min-h-0 flex-col border-b border-slate-200 lg:border-b-0 lg:border-r dark:border-slate-800">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-800">
            <p className="text-xs text-slate-500">
              {entries.length} events (capped at 300)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaused((v) => !v)}
                className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium dark:border-slate-600"
              >
                {paused ? "Resume" : "Pause"}
              </button>
              <button
                type="button"
                onClick={() => setEntries([])}
                className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium dark:border-slate-600"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-950 p-3 font-mono text-xs">
            {entries.length === 0 ? (
              <p className="text-slate-500">
                No events captured yet. Send a message.
              </p>
            ) : (
              <ul className="space-y-1">
                {entries.map((e) => (
                  <li key={e.id} className="flex gap-2">
                    <span className="shrink-0 text-slate-600">{e.at}</span>
                    <span
                      className={`shrink-0 font-semibold ${
                        KIND_COLOR[e.kind] ?? "text-slate-300"
                      }`}
                    >
                      {e.kind}
                    </span>
                    <span className="min-w-0 break-all text-slate-400">
                      {e.detail}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="min-h-0">
          <CopilotChat
            agentId="myAgent"
            labels={{
              welcomeMessageText:
                "Anything you send here shows up as events on the left.",
            }}
          />
        </div>
      </div>
    </DemoFrame>
  );
}
