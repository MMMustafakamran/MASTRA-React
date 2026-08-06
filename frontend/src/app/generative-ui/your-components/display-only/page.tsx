import { RouteHeader } from "@/components/route-header";
import { SourceCode } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/generative-ui/your-components/display-only" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The simplest form of generative UI: you register a React component
          under a name, the agent decides when to show it, and CopilotKit renders
          it in the chat with the tool arguments spread in as props. No handler,
          no user interaction, no result sent back.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Under the hood <code>useComponent</code> wraps{" "}
          <code>useFrontendTool</code> — it registers a tool with a{" "}
          <code>render</code> and no <code>handler</code>, and prefixes your
          description with a line telling the model the tool draws UI.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Show the weather card for Tokyo: 77 degrees, clear"]}
            expect="A bordered weather card renders inline in the chat with the city, temperature, and condition the agent passed."
            fail="The agent answers in plain text with no card — it did not call the tool, so check the component name and description."
          />
        </div>
      </Panel>

      <Callout tone="info" title="No backend change is needed for this">
        Frontend tools are forwarded to the agent in the AG-UI run input, so the
        model can call <code>showWeather</code> even though{" "}
        <code>src/mastra/agents.ts</code> never declares it. This is the same
        mechanism the Frontend Tools page relies on.
      </Callout>

      <Panel
        title="Source"
        description="Read from this repo — the file the demo route runs."
      >
        <SourceCode file="frontend/src/app/generative-ui/your-components/display-only/demo-chat/page.tsx" />
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          The doc&apos;s &ldquo;without parameters&rdquo; variant omits{" "}
          <code>parameters</code> entirely and types the render props inline. The
          shipped signature infers render props from the schema, so dropping it
          makes those props <code>undefined</code>-shaped rather than the object
          the example destructures — this demo keeps the schema.
        </p>
      </Panel>

      <Panel title="How this differs from Tool Rendering">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <code>useRenderTool</code> attaches UI to a tool that already exists
          and does real work — the agent calls <code>get_weather</code>, it runs
          on the server, and you decide how the call is displayed.{" "}
          <code>useComponent</code> creates a tool whose <em>only</em> purpose is
          to render; there is no server-side work behind it. Use the first to
          visualise something the agent did, the second to let the agent show you
          something.
        </p>
      </Panel>
    </>
  );
}
