import { RouteHeader } from "@/components/route-header";
import { SourceCode } from "@/components/source-code";
import { Panel, TryIt } from "@/components/ui";

const EVENTS: [string, string][] = [
  ["Run lifecycle", "onRunStartedEvent, onRunFinishedEvent, onRunErrorEvent"],
  ["Steps", "onStepStartedEvent, onStepFinishedEvent"],
  [
    "Text messages",
    "onTextMessageStartEvent, onTextMessageContentEvent, onTextMessageEndEvent",
  ],
  [
    "Tool calls",
    "onToolCallStartEvent, onToolCallArgsEvent, onToolCallEndEvent, onToolCallResultEvent",
  ],
  ["State", "onStateSnapshotEvent, onStateDeltaEvent"],
  ["Messages", "onMessagesSnapshotEvent"],
  ["Custom", "onCustomEvent, onRawEvent"],
  ["High-level", "onMessagesChanged, onStateChanged"],
];

export default function Page() {
  return (
    <>
      <RouteHeader path="/ag-ui" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          AG-UI is the protocol underneath this whole integration. Messages, tool
          calls, state updates, and lifecycle transitions all travel as discrete
          events over SSE, and <code>agent.subscribe()</code> lets you observe
          them directly — the fastest way to tell whether a problem is in the
          agent, the runtime, or the UI.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["What's the weather in Tokyo?"]}
            expect="RUN_STARTED, a burst of TEXT_MESSAGE_CONTENT, TOOL_CALL_START/END around get_weather, TOOL_CALL_RESULT, then RUN_FINISHED."
            fail="The log stays empty while the chat streams — the subscription is bound to a different agent than the chat is using."
          />
        </div>
      </Panel>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/ag-ui/demo-chat/page.tsx" />
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          One thing the doc does not mention: the subscriber callbacks are not
          uniform. Some flatten their payload into named fields (
          <code>onTextMessageContentEvent</code> gives{" "}
          <code>textMessageBuffer</code>), while others hand back only a raw{" "}
          <code>event</code> object (<code>onToolCallStartEvent</code>,{" "}
          <code>onRunErrorEvent</code>, <code>onToolCallResultEvent</code>).
          Destructuring the wrong shape is a type error, which is how the
          difference surfaces.
        </p>
      </Panel>

      <Panel title="Event coverage">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700">
                <th className="pb-2 pr-4 font-medium">Category</th>
                <th className="pb-2 font-medium">Callbacks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {EVENTS.map(([cat, cbs]) => (
                <tr key={cat} className="align-top">
                  <td className="py-2 pr-4 font-medium text-slate-800 dark:text-slate-100">
                    {cat}
                  </td>
                  <td className="py-2 font-mono text-xs text-slate-600 dark:text-slate-400">
                    {cbs}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="The proxy pattern">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The browser never opens this stream against the agent. CopilotKit
          discovers agents through the runtime and gives each one a proxy
          implementing the same <code>AbstractAgent</code> interface. The runtime
          resolves the agent, executes it, and re-encodes its events as SSE — so
          the frontend contract stays identical no matter which framework is
          behind it.
        </p>
      </Panel>
    </>
  );
}
