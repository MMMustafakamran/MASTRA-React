import { RouteHeader } from "@/components/route-header";
import { SourceCode } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/frontend-tools" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Tools the agent calls that execute in the user&apos;s browser rather
          than in the agent. The handler runs client-side, so it can touch React
          state and browser APIs, then returns a string the model reads as the
          tool result.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Say hello to Damien"]}
            expect="A browser alert appears saying 'Hello, Damien!', and after you dismiss it the agent confirms it said hello."
            fail="The agent replies in text without an alert — the tool was not forwarded."
          />
        </div>
      </Panel>

      <Callout tone="info" title="Nothing to declare on the Mastra side">
        The doc puts it plainly: because Mastra has native AG-UI support,
        frontend tools are automatically available to the agent. There is no
        Mastra-side counterpart to write, which is why this route adds nothing
        to <code>src/mastra</code> and registers the tool on the page that uses
        it.
      </Callout>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/frontend-tools/demo-chat/page.tsx" />
      </Panel>
    </>
  );
}
