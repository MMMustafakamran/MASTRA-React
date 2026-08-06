import Link from "next/link";

import { RouteHeader } from "@/components/route-header";
import { Callout, KeyValue, Panel, TryIt } from "@/components/ui";
import { DOCS_ROOT } from "@/lib/nav-config";

const AGENTS: [string, string, string][] = [
  ["myAgent", "—", "Quickstart, Prebuilt Components, Slots, Headless UI, Programmatic Control, Inspector, Display-only, HITL, Runtime, AG-UI"],
  ["weatherAgent", "weatherInfo", "Tool Rendering"],
  ["languageAgent", "working memory: language", "Shared State read + write"],
  ["streamingAgent", "working memory: document", "Predictive State Updates"],
  ["searchAgent", "addSearch · working memory: searches", "State Rendering"],
  ["colleaguesContactAgent", "reads ag-ui requestContext", "Readables"],
  ["backgroundAgentsAgent", "run_deep_research (background)", "Background Tasks"],
];

export default function Page() {
  return (
    <>
      <RouteHeader path="/" />

      <Panel title="What this is">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          A working test harness for the CopilotKit + Mastra integration. Each
          route implements one doc page against a real agent, and shows the exact
          source that makes it work.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Everything comes from the documentation. No agent, tool, instruction,
          or working-memory schema was invented for this repo.
        </p>
        <div className="mt-4">
          <KeyValue
            rows={[
              [
                "Docs tracked",
                <a
                  key="d"
                  href={DOCS_ROOT}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--accent)] underline underline-offset-4"
                >
                  {DOCS_ROOT}
                </a>,
              ]
            ]}
          />
        </div>
      </Panel>

      <Callout tone="info" title="There is no separate agent server">
        Mastra is a TypeScript framework, and the Quickstart&apos;s
        bring-your-own path imports the Mastra instance straight into the Next.js
        runtime route via <code>getLocalAgents</code>. Agents run in the same
        process as the app — one command, one port, no backend directory. That
        is also required rather than merely convenient: the Shared State pages
        note that reading working memory does not work with a remote Mastra
        agent.
      </Callout>

      <Panel
        title="The seven agents"
        description="One per doc page that defines one. In Mastra, shared state is working memory, and working memory takes a single schema per agent — so the three different schemas the docs define cannot be merged."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700">
                <th className="pb-2 pr-4 font-medium">Agent id</th>
                <th className="pb-2 pr-4 font-medium">Tools / state</th>
                <th className="pb-2 font-medium">Used by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {AGENTS.map(([id, tools, used]) => (
                <tr key={id} className="align-top">
                  <td className="py-2 pr-4 font-mono text-xs text-slate-800 dark:text-slate-100">
                    {id}
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                    {tools}
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-400">
                    {used}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Agent ids come from the keys in the Mastra instance&apos;s{" "}
          <code>agents: {"{ … }"}</code> object, not from each agent&apos;s{" "}
          <code>name</code> — that is what routes pass as{" "}
          <code>agentId</code>.
        </p>
      </Panel>

      <Panel title="Start here">
        <TryIt
          prompts={["What tools do you have access to?"]}
          expect={
            <>
              On{" "}
              <Link href="/quickstart" className="underline">
                /quickstart
              </Link>
              , a streamed reply.
            </>
          }
          fail="An error banner — check that OPENAI_API_KEY is set and restart the dev server."
        />
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          The{" "}
          <Link
            href="/status"
            className="text-[var(--accent)] underline underline-offset-4"
          >
            status overview
          </Link>{" "}
          lists every route in one table.
        </p>
      </Panel>
    </>
  );
}
