import { RouteHeader } from "@/components/route-header";
import { SourceCode } from "@/components/source-code";
import { Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/programmatic-control" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <code>useAgent</code> hands you the agent instance directly — its
          messages, shared state, thread id, and whether it is currently running.
          Combined with <code>copilotkit.runAgent()</code> you can drive a
          conversation from a button, a form, or a background trigger with no
          chat UI in the picture.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["What's the weather in Tokyo?"]}
            expect="Status flips to Running, the assistant message grows as tokens arrive, and the message count climbs. Stop halts it mid-stream."
            fail="Nothing happens on Run — the agent id registered in the runtime does not match the one passed to useAgent."
          />
        </div>
      </Panel>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/programmatic-control/demo-chat/page.tsx" />
      </Panel>

      <Panel title="runAgent vs. agent.runAgent">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <code>copilotkit.runAgent({"{ agent }"})</code> is the orchestrated
          path: it executes frontend tools, handles the follow-up runs those
          tools trigger, and routes errors through the subscriber system.{" "}
          <code>agent.runAgent()</code> is the low-level call — it sends the
          request but does neither, so a browser-executed tool would never fire.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <code>agentId</code> is passed explicitly on every route in this repo.
          The backend serves three agents, so there is no single implicit
          default to fall back on.
        </p>
      </Panel>
    </>
  );
}
