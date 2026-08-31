import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

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

      <Callout
        tone="warn"
        title="Finding — this route was implemented against an API that does not exist"
      >
        <p>
          Reconciled with the guide on 2026-08-31, the first sync that tracked
          this page at all. The demo destructured{" "}
          <code>activeThreadId</code>, <code>setActiveThreadId</code> and{" "}
          <code>createNewThread</code> from <code>useThreads</code>. None of the
          three is on <code>UseThreadsResult</code> in{" "}
          <code>@copilotkit/react-core@1.66.2</code> (declared{" "}
          <code>^1.66.2</code>), which returns the list, the loading and error
          state, and the mutations — among them{" "}
          <code>startNewThread</code>, not <code>createNewThread</code>. The
          route failed <code>tsc</code> with three TS2339 errors while still
          building and rendering, because Next builds do not typecheck by
          default.
        </p>
        <p className="mt-2">
          The guide never asked for that shape. Its &ldquo;Switch between
          threads&rdquo; step keeps the selection in the app —{" "}
          <code>useState</code> in the component, then the highlighted{" "}
          <code>&lt;CopilotChat threadId=&#123;activeThreadId&#125; /&gt;</code>{" "}
          — and the demo omitted <code>threadId</code> entirely, so clicking
          a row could never have switched the chat. This is the harness&apos;s
          defect, not the doc&apos;s, and it is the exact gap
          <code>project-context.md</code> predicts for a page with a route and a
          recorder entry but no drift baseline: nothing compared the two until
          the page was snapshotted.
        </p>
      </Callout>
    </>
  );
}
