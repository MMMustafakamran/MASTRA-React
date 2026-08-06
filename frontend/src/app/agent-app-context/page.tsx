import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/agent-app-context" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Telling the agent what is going on in your app — the current user, the
          open record, the visible page — without stuffing it into a chat
          message. <code>useAgentContext</code> registers a description and a
          value, and CopilotKit forwards them on every run.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          What makes the Mastra version distinctive is the read side.{" "}
          <code>instructions</code> is a <em>function</em> that receives{" "}
          <code>requestContext</code>, pulls the <code>ag-ui</code> entry, finds
          the item by its description, and interpolates it into the system
          prompt. The context becomes part of the instructions rather than
          arriving as a tool or a message.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Who are my colleagues?", "What is Jane Smith's role?"]}
            expect="The agent answers from the list on the left, which it was never told in a message."
            fail="It says it has no information about your colleagues — the context is not reaching the instructions."
          />
        </div>
      </Panel>
      
      <Panel title="Source">
        <SourceCode file="frontend/src/app/agent-app-context/demo-chat/page.tsx" />
      </Panel>

      <Panel title="The agent that reads it">
        <SourceCodeGroup
          files={[{ file: "frontend/src/mastra/agents.ts", region: "colleagues-agent" }]}
        />
      </Panel>
    </>
  );
}
