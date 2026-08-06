import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/generative-ui/tool-rendering" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          A tool call is an event in the stream, not just a function result — so
          you can render it. <code>useRenderTool</code> attaches a component to
          one tool by name, and <code>useDefaultRenderTool</code> registers a
          wildcard that catches everything without a dedicated renderer.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The renderer name must equal the Mastra tool&apos;s <code>id</code>{" "}
          exactly. That is the most common reason a tool runs but its UI never
          appears.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["What's the weather in Tokyo?"]}
            expect="The reply is preceded by 'Calling weather API...' which becomes 'Called the weather API for Tokyo.' once the call completes."
            fail="The tool call renders as raw JSON or not at all — the renderer name and the tool id disagree."
          />
        </div>
      </Panel>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/generative-ui/tool-rendering/demo-chat/page.tsx" />
      </Panel>

      <Panel
        title="The tool and the agent"
        description="An ordinary Mastra createTool — nothing about it is CopilotKit-specific."
      >
        <SourceCodeGroup
          files={[
            { file: "frontend/src/mastra/tools.ts", region: "weather-info" },
            { file: "frontend/src/mastra/agents.ts", region: "weather-agent" },
          ]}
          note={
            <>
              One more drift: the doc&apos;s{" "}
              <code>execute: async ({"{ location }"})</code> destructures the
              input directly, which is correct for @mastra/core 1.56 — worth
              noting because some other framework docs show a{" "}
              <code>{"{ context }"}</code> wrapper that does not apply here.
            </>
          }
        />
      </Panel>
    </>
  );
}
