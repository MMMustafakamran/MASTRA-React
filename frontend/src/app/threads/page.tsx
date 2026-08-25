import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Panel, TryIt } from "@/components/ui";

const CONCEPTS: [string, string][] = [
  ["Durable Persistence", "Conversations survive full page reloads and browser restarts."],
  ["User Scoping", "Threads are partitioned per user (via identifyUser) and per agent."],
  ["Auto-Naming", "Threads are automatically named a moment after the first turn completes."],
  ["Multi-Route Dispatch", "Requires a [[...slug]] catch-all endpoint (Gate 1 in THREADS-AUTH)."],
];

export default function Page() {
  return (
    <>
      <RouteHeader path="/threads" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Persistent threads store conversation history across sessions. The
          runtime endpoint dispatches thread CRUD requests to the Intelligence
          layer or in-memory fallback, allowing conversation replay and
          multi-user partitioning.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700">
                <th className="pb-2 pr-4 font-medium">Concept</th>
                <th className="pb-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {CONCEPTS.map(([title, desc]) => (
                <tr key={title}>
                  <td className="py-2 pr-4 font-medium text-slate-800 dark:text-slate-100">
                    {title}
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-400">
                    {desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <TryIt
            prompts={[
              "Remember my favorite color is teal",
              "What is my favorite color?",
            ]}
            expect="Send a message, refresh the browser page, and verify the conversation is restored and continues seamlessly."
            fail="The thread disappears on reload or the chat resets to the welcome screen."
          />
        </div>
      </Panel>

      <Panel title="The demo">
        <SourceCode file="frontend/src/app/threads/demo-chat/page.tsx" />
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
