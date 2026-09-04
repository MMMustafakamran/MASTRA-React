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

      <Callout tone="info" title="Fixed upstream: both missing props are gone">
        The page used to pass{" "}
        <code>useAgent({"{ agentId, initialState }"})</code> and, in the
        &ldquo;render in the chat&rdquo; section, a <code>render</code> function.
        Neither prop has ever been on <code>useAgent</code> in 1.66.2. Both are
        now gone: the seed moved into a <code>useEffect</code> gated on{" "}
        <code>isReady</code>, which the hook does return, and the render section
        returns plain JSX. The demo runs the new snippet as published.
      </Callout>

      <Callout tone="warn" title="`isReady` does not mean the state has loaded">
        The published seed writes <code>english</code> whenever{" "}
        <code>state.language</code> is still undefined at the moment{" "}
        <code>isReady</code> flips true. But <code>isReady</code> only says the
        runtime <code>/info</code> sync resolved — it says nothing about whether
        a state snapshot has arrived. Working memory that already holds{" "}
        <code>spanish</code> is undefined on the client until it replays, and
        the effect fires against that gap. Here the routes run on the in-memory
        runtime and start empty, so the seed is harmless and the panel simply
        reads <code>english</code> from load. On a persisted thread the same
        snippet is a race between the seed and the replay, and the doc offers no
        guard for it.
      </Callout>

      <Callout tone="warn" title="The new render sample blanks the whole page">
        &ldquo;Rendering agent state in your app&rdquo; reuses the component
        name <code>YourMainContent</code> from the step above — the component
        that draws the entire left pane — but its body is now{" "}
        <code>if (!state.language) return null;</code>. Copied in literally, the
        main content disappears until state arrives, rather than one line being
        hidden. The old <code>render</code> prop failed to compile; this one
        compiles and deletes your UI.
      </Callout>

      <Callout tone="warn" title="Rendering state inside the chat is no longer documented">
        The section was retitled from &ldquo;Rendering agent state in the
        chat&rdquo; to &ldquo;in your app&rdquo;, and the in-chat option went
        with the title. Nothing on the page now says how to put working memory
        into the conversation, and no replacement page is linked.
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
