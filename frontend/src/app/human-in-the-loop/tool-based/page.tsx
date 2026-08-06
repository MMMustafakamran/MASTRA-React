import { RouteHeader } from "@/components/route-header";
import { SourceCode } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/human-in-the-loop/tool-based" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          A frontend tool whose result is a human decision. The agent proposes
          two options, and the run suspends until one is clicked.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The difference from an ordinary frontend tool is the completion
          signal. <code>useFrontendTool</code> finishes when its{" "}
          <code>handler</code> returns; <code>useHumanInTheLoop</code> has no
          handler at all — it renders UI and hands you <code>respond</code>, and
          the string you pass becomes the tool result.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Can you show me two good options for a restaurant name?"]}
            expect="Two buttons render in the message stream. Nothing further streams until you click one; the agent's next message reflects your choice."
            fail="The agent lists two options as plain text with no buttons, or continues without waiting."
          />
        </div>
      </Panel>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/human-in-the-loop/tool-based/demo-chat/page.tsx" />
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Nothing is declared on the Mastra side — the tool is forwarded over
          AG-UI like any other frontend tool.
        </p>
      </Panel>
    </>
  );
}
