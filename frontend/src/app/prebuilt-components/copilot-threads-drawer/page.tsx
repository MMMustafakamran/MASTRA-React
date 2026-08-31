import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

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

      <Callout
        tone="warn"
        title="Finding — the load-bearing provider was missing until this page was tracked"
      >
        <p>
          Reconciled on 2026-08-31, the first sync that tracked this page. The
          guide is explicit that the shared provider is what makes the drawer
          work: &ldquo;Place <code>&lt;CopilotThreadsDrawer&gt;</code> next to{" "}
          <code>&lt;CopilotChat&gt;</code> and wrap <strong>both</strong> in a
          shared <code>&lt;CopilotChatConfigurationProvider&gt;</code> … That
          shared configuration is what lets the Drawer drive the chat: with no
          callbacks, selecting a row connects the chat to that thread and
          replays its history.&rdquo;
        </p>
        <p className="mt-2">
          <code>ThreadsProvider</code> supplied only{" "}
          <code>CopilotKitProvider</code>, so both this route and{" "}
          <code>/threads</code> paired the two components with no shared
          configuration between them and no callbacks of their own — the one
          arrangement the guide says will not work. It is added there now,
          around all three thread routes. Nothing in the pipeline could have
          caught this: the route, the recorder entry and the build were all
          green, and the page had no drift baseline to compare against.
        </p>
      </Callout>
    </>
  );
}
