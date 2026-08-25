import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/headless-threads" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The <code>useThreads</code> hook provides a completely headless API to
          list, create, switch, and delete persistent conversations without using
          prebuilt CopilotKit drawer UI.
        </p>

        <div className="mt-4">
          <TryIt
            prompts={[
              "Create a travel itinerary for Paris",
              "What did we discuss earlier?",
            ]}
            expect="Threads list in the custom sidebar. Clicking 'New Conversation' creates a fresh thread and switches to it."
            fail="Threads fail to load or error with 'Runtime URL is not configured'."
          />
        </div>
      </Panel>

      <Panel title="The demo">
        <SourceCode file="frontend/src/app/headless-threads/demo-chat/page.tsx" />
      </Panel>

      <Panel
        title="Runtime & Provider Configuration"
        description="The dedicated multi-route endpoint and provider that power headless threads."
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
