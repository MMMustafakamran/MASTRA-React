import { RouteHeader } from "@/components/route-header";
import { SourceCode } from "@/components/source-code";
import { Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/custom-look-and-feel/headless-ui" />
      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The slot system customises CopilotKit&apos;s chat. This replaces it
          entirely: the bubbles, the input, the thinking indicator, and the
          layout are all hand-written. CopilotKit still supplies the message
          list, the streaming, and the run lifecycle — you just stop using its
          components to display them.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Tell me a joke", "What's the weather in Tokyo?"]}
            expect="Messages stream into the custom bubbles and 'Thinking...' appears while the run is active."
            fail="Send does nothing, or the assistant reply never appears — copilotkit.runAgent() is not being awaited, or the agent id is wrong."
          />
        </div>
      </Panel>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/custom-look-and-feel/headless-ui/demo-chat/page.tsx" />
      </Panel>
    </>
  );
}
