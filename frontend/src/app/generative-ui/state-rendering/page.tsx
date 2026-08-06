import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/generative-ui/state-rendering" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Tool rendering shows you a tool <em>call</em>. State rendering shows
          the agent&apos;s accumulated <em>state</em> — a list that grows across
          turns rather than a single event.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          In Mastra this is working memory: the agent carries a Zod schema, the
          model updates it, and CopilotKit surfaces it as{" "}
          <code>agent.state</code>. Note the tool itself does almost nothing —
          its comment reads &ldquo;working memory is automatically
          updated&rdquo;. Calling it is what prompts the model to write memory,
          not the return value.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={[
              "Add a search for the tallest mountains",
              "Now add one for the deepest oceans",
            ]}
            expect="An item appears in the list on the left, and the second prompt adds a second while keeping the first."
            fail="The list stays empty while the chat replies normally — working memory is not being written."
          />
        </div>
      </Panel>

      <Callout tone="info" title="Why this route uses its own agent">
        Working memory takes one schema per agent, and the docs define three
        different ones — <code>searches</code> here, <code>language</code> on
        Shared State, <code>document</code> on Predictive State Updates. They
        cannot be merged without inventing a schema no page shows, so each gets
        its own agent.
      </Callout>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/generative-ui/state-rendering/demo-chat/page.tsx" />
      </Panel>

      <Panel title="The agent, schema, and tool">
        <SourceCodeGroup
          files={[
            { file: "frontend/src/mastra/agents.ts", region: "search-agent" },
            { file: "frontend/src/mastra/tools.ts", region: "add-search" },
          ]}
        />
      </Panel>
    </>
  );
}
