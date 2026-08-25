import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/prebuilt-components/copilot-threads-drawer" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The <code>CopilotThreadsDrawer</code> component provides a prebuilt
          sidebar for managing persistent conversations (threads). It displays
          past threads, allows switching between them, creating new threads, and
          deleting or archiving existing ones.
        </p>

        <div className="mt-4">
          <TryIt
            prompts={[
              "Create a plan for a TypeScript project",
              "What were we talking about?",
            ]}
            expect="Messages are stored in the active thread. Clicking 'New thread' starts a fresh conversation while preserving past threads in the drawer."
            fail="The drawer stays in a loading spinner or shows a license error."
          />
        </div>
      </Panel>

      <Panel title="The demo">
        <SourceCode file="frontend/src/app/prebuilt-components/copilot-threads-drawer/demo-chat/page.tsx" />
      </Panel>

      <Panel
        title="Runtime & Provider Configuration"
        description="The dedicated multi-route endpoint and provider that power threads."
      >
        <SourceCodeGroup
          files={[
            { file: "frontend/src/components/threads-provider.tsx" },
            { file: "frontend/src/app/api/copilotkit-threads/[[...slug]]/route.ts" },
          ]}
        />
      </Panel>
    </>
  );
}
