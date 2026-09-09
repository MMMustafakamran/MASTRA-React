import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/generative-ui/a2ui" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          A2UI is Google&apos;s declarative Generative UI spec: the agent emits
          a component tree as JSON Lines and the client renders it. Every other
          Generative UI route here hands the agent React that the frontend
          wrote — <code>useComponent</code>, <code>useRenderTool</code>. A2UI
          inverts that. The agent describes the interface, and no component on
          this route was registered in advance.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The consequence worth checking is that the entire integration is
          server-side. Enabling <code>a2ui</code> on the runtime is the whole
          setup; the demo page below is a bare <code>&lt;CopilotChat&gt;</code>{" "}
          with no renderer, no catalog, and no schema.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={[
              "Show me three pricing plans as cards: Free, Pro and Team.",
            ]}
            expect="A laid-out group of cards appears in the thread — headings, body text and a button on each — rendered from the agent's stream."
            fail="The agent answers in prose or prints raw JSON. Prose means the A2UI tool was never offered to this agent; raw JSON means it was called but nothing on the client rendered the result."
          />
        </div>
      </Panel>

      <Callout tone="info" title="Why the middleware is scoped to one agent">
        The doc&apos;s snippet is a bare <code>a2ui: {}</code>, which applies{" "}
        <code>A2UIMiddleware</code> to every registered agent. One runtime here
        serves all of this harness&apos;s demo routes, so that would have handed
        an extra UI-authoring tool to <code>weatherAgent</code>,{" "}
        <code>searchAgent</code> and the rest, and changed what those pages
        record. The same section documents the narrower form —{" "}
        <code>a2ui: {`{ agents: ["my-agent"] }`}</code> — and that is what the
        route uses, naming <code>a2uiAgent</code> alone.
      </Callout>

      <Callout tone="info" title="No frontend renderer is imported">
        The page&apos;s Frontend section says the renderer &ldquo;activates
        automatically — no extra configuration needed&rdquo;, and offers{" "}
        <code>a2ui={`{{ theme: myCustomTheme }}`}</code> only for overriding the
        default theme. No theme is passed here on purpose: with one, a take
        could not distinguish a working default renderer from a themed one.
      </Callout>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/generative-ui/a2ui/demo-chat/page.tsx" />
      </Panel>

      <Panel
        title="The runtime option and the agent"
        description="The only two places A2UI appears in this repo — and neither is a component."
      >
        <SourceCodeGroup
          files={[
            { file: "frontend/src/app/api/copilotkit/[[...slug]]/route.ts" },
            { file: "frontend/src/mastra/agents.ts", region: "a2ui-agent" },
          ]}
        />
      </Panel>
    </>
  );
}
