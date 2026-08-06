import { RouteHeader } from "@/components/route-header";
import { SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/background-tasks" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Work that outlives the turn that started it. A tool marked{" "}
          <code>background: {"{ enabled: true }"}</code> does not block the run —
          Mastra queues it, the agent replies immediately, and progress arrives
          separately as AG-UI <em>activity</em> events.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          That separate channel is why this route uses{" "}
          <code>useRenderActivityMessage</code> rather than{" "}
          <code>useRenderTool</code>. A renderer declares the{" "}
          <code>activityType</code> it handles and a Zod schema for the payload,
          and CopilotKit routes matching events to it.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Research the history of the Dutch East India Company"]}
            expect="A short reply saying the work is running, plus an activity card that shows 'Working…' and then flips to completed — without you sending anything else."
            fail="No activity card appears. Check that backgroundTasks is enabled on the Mastra instance and untilIdle is set on getLocalAgents."
          />
        </div>
      </Panel>

      <Callout tone="info" title="Three pieces have to line up">
        The tool needs <code>background: {"{ enabled: true }"}</code>; the Mastra
        instance needs <code>backgroundTasks: {"{ enabled: true }"}</code> plus{" "}
        <code>storage</code> for the worker to persist queued work; and the
        runtime needs <code>untilIdle</code> on <code>getLocalAgents</code> so
        the background lifecycle is piped into the run&apos;s stream. The doc
        covers the first two — <code>untilIdle</code> is documented on{" "}
        <code>GetLocalAgentsOptions</code> rather than on this page.
      </Callout>

      <Panel title="Source">
        <SourceCodeGroup
          files={[
            { file: "frontend/src/app/background-tasks/demo-chat/page.tsx" },
            { file: "frontend/src/components/background-task-activity.tsx" },
          ]}
        />
      </Panel>

      <Panel title="Tool, agent, and instance">
        <SourceCodeGroup
          files={[
            { file: "frontend/src/mastra/tools.ts", region: "deep-research" },
            { file: "frontend/src/mastra/agents.ts", region: "background-agent" },
            { file: "frontend/src/mastra/index.ts" },
          ]}
          note={
            <>
              Storage here is in-memory LibSQL, so queued work does not survive a
              restart. That is the doc&apos;s configuration and is fine for a
              harness; a real deployment would point it at a durable database.
            </>
          }
        />
      </Panel>
    </>
  );
}
