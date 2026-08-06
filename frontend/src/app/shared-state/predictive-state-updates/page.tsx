import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/shared-state/predictive-state-updates" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          State that updates <em>during</em> a run rather than at the end of it.
          The agent writes a document straight into working memory via Mastra&apos;s
          built-in <code>updateWorkingMemory</code> tool, and the UI renders each
          update as it arrives — so you watch the text being written.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Two pieces make that work. The agent&apos;s instructions insist the
          document belongs in shared state and must never be pasted into a chat
          message. And the frontend opts into{" "}
          <code>OnStateChanged</code> / <code>OnRunStatusChanged</code> updates,
          without which the component would only re-render on message changes.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={[
              "Write a short blog post about otters",
              "Now make it more formal",
            ]}
            expect="The left pane fills in progressively with a LIVE badge while the run is active, and the chat itself stays short — the document never appears as a chat message."
            fail="The document appears in the chat instead of the pane, or only lands once the run finishes."
          />
        </div>
      </Panel>

      <Callout tone="info" title="An import worth noticing">
        The doc imports <code>UseAgentUpdate</code> from{" "}
        <code>@copilotkit/react-core</code> — the v1 entrypoint — while
        importing everything else from <code>/v2</code>. Both the hook and the
        enum are exported from <code>/v2</code>, which is what this repo uses
        throughout.
      </Callout>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/shared-state/predictive-state-updates/demo-chat/page.tsx" />
      </Panel>

      <Panel title="The agent and its schema">
        <SourceCodeGroup
          files={[{ file: "frontend/src/mastra/agents.ts", region: "streaming-agent" }]}
        />
      </Panel>
    </>
  );
}
