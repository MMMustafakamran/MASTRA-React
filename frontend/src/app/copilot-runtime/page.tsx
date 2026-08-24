import { RouteHeader } from "@/components/route-header";
import { SourceCode } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

const COMPARISON: [string, string, string][] = [
  ["Where agents run", "In this Next process", "A separate Mastra server"],
  ["Working memory / shared state", "Supported", "Not supported"],
  ["Wiring", "getLocalAgents({ mastra, resourceId })", "getRemoteAgents({ … })"],
  ["Deployment", "One app to deploy", "Two services to run"],
];

export default function Page() {
  return (
    <>
      <RouteHeader path="/copilot-runtime" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The runtime resolves agents by id and streams their output to the
          browser. What is unusual about the Mastra integration is that there is
          nothing to connect <em>to</em> — <code>getLocalAgents</code> takes the
          Mastra instance itself and registers every agent on it, in this
          process.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Hello"]}
            expect="All seven ids stream a reply. Switching ids starts a separate conversation, because each carries its own message list."
            fail="One id errors with an agent-not-found message — its key is missing from the Mastra instance's agents object."
          />
        </div>
      </Panel>

      <Panel
        title="This repo's runtime"
        description="Read from disk — diff it against the doc's sample."
      >
        <SourceCode file="frontend/src/app/api/copilotkit/[[...slug]]/route.ts" />
      </Panel>

      <Panel title="The Mastra instance">
        <SourceCode file="frontend/src/mastra/index.ts" />
      </Panel>

      <Panel
        title="Local vs. remote agents"
        description="Both are supported by @ag-ui/mastra, but they are not interchangeable here."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700">
                <th className="pb-2 pr-4 font-medium" />
                <th className="pb-2 pr-4 font-medium">Local</th>
                <th className="pb-2 font-medium">Remote</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {COMPARISON.map(([label, local, remote]) => (
                <tr key={label}>
                  <td className="py-2 pr-4 font-medium text-slate-800 dark:text-slate-100">
                    {label}
                  </td>
                  <td className="py-2 pr-4 text-emerald-700 dark:text-emerald-400">
                    {local}
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-400">
                    {remote}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <Callout tone="warn" title="Local is not optional for this harness">
            The Shared State pages state plainly that reading working memory
            will <strong>not</strong> work with a remote Mastra agent. Four
            routes here depend on working memory, so switching to{" "}
            <code>getRemoteAgents</code> would break them — which is why this
            repo has no separate agent server at all.
          </Callout>
        </div>
      </Panel>
    </>
  );
}
