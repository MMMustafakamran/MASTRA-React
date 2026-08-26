import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/quickstart" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The bring-your-own-agent path. Mastra is TypeScript, so there is no
          separate agent process: the Mastra instance is imported directly into
          the runtime route and bound with{" "}
          <code>MastraAgent.getLocalAgents</code>. One command, one port.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={[
              "What tools do you have access to?",
              "What do you think about React?",
            ]}
            expect="Tokens stream in a word at a time and the reply renders as markdown."
            fail="An error banner — check that OPENAI_API_KEY is set and the dev server was restarted after setting it."
          />
        </div>
      </Panel>

      <Panel title="The demo">
        <SourceCode file="frontend/src/app/quickstart/demo-chat/page.tsx" />
      </Panel>

      <Panel
        title="The three files that make it work"
        description="Read from this repo, so they can be diffed against the doc's samples directly."
      >
        <SourceCodeGroup
          files={[
            { file: "frontend/src/app/api/copilotkit/[[...slug]]/route.ts" },
            { file: "frontend/src/mastra/index.ts" },
            { file: "frontend/src/mastra/agents.ts", region: "my-agent" },
          ]}
        />
      </Panel>

      <Callout tone="warn" title="One departure from the doc's samples">
        <p>
          <strong>Agents need an <code>id</code>.</strong> The doc creates{" "}
          <code>new Agent({"{ name, instructions, model }"})</code>, but{" "}
          <code>AgentConfig</code> in @mastra/core 1.56 requires{" "}
          <code>id</code> — omitting it is a type error. Every agent here has
          one.
        </p>
      </Callout>

      <Callout tone="info" title="The doc's main path is now a separate agent server">
        <p>
          The quickstart now starts Mastra with <code>npx mastra dev</code> and
          reaches it over HTTP via <code>MastraAgent.getRemoteAgents</code> and a{" "}
          <code>MastraClient</code>. This repo keeps the embedded shape the same
          page documents as the alternative: &ldquo;If your Mastra instance lives
          inside this Next.js app rather than in its own process, swap{" "}
          <code>getRemoteAgents</code> for{" "}
          <code>{"getLocalAgents({ mastra, resourceId })"}</code> and drop the
          client.&rdquo;
        </p>
        <p className="mt-2">
          That is not a preference here. Shared State and Background Tasks need
          working memory and <code>untilIdle</code>, and neither survives the
          remote path — see <a href="/copilot-runtime">Copilot Runtime</a>.
        </p>
      </Callout>
    </>
  );
}
