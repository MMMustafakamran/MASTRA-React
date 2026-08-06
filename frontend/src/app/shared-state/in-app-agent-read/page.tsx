import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/shared-state/in-app-agent-read" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Shared state in Mastra <em>is</em> working memory. You give the agent a
          Zod schema, Mastra keeps a structured memory record against it, and
          CopilotKit surfaces that as <code>agent.state</code> — reactive, so any
          component re-renders when it changes.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Switch to Spanish", "Change it back to English"]}
            expect="The Language line updates and the raw state block shows the new value; the agent also starts replying in that language."
            fail="The agent acknowledges in text but the panel stays empty — working memory is not being written."
          />
        </div>
      </Panel>

      <Callout tone="warn" title="Two things the doc shows that do not exist">
        <p>
          <code>useAgent({"{ agentId, initialState }"})</code> — there is no{" "}
          <code>initialState</code> prop on <code>useAgent</code> in 1.66.2, so
          the value starts undefined until the agent first writes it.
        </p>
        <p className="mt-2">
          The &ldquo;render in the chat&rdquo; section passes a{" "}
          <code>render</code> function to <code>useAgent</code>. That prop is
          likewise absent from the shipped type.
        </p>
      </Callout>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/shared-state/in-app-agent-read/demo-chat/page.tsx" />
      </Panel>

      <Panel
        title="The agent and its schema"
        description="Working memory is enabled with a Zod schema on the agent's Memory — that schema is the shared state contract."
      >
        <SourceCodeGroup
          files={[{ file: "frontend/src/mastra/agents.ts", region: "language-agent" }]}
          note={
            <>
              This only works with a local agent. The doc is explicit: reading
              working memory will <strong>not</strong> work against a remote
              Mastra agent, which is why the runtime here uses{" "}
              <code>getLocalAgents</code>.
            </>
          }
        />
      </Panel>
    </>
  );
}
