import { RouteHeader } from "@/components/route-header";
import { SourceCode } from "@/components/source-code";
import { CodeBlock, Panel, TryIt } from "@/components/ui";

const CONTROL_SNIPPET = `// <CopilotKit> — takes enableInspector, defaults to on for localhost.
<CopilotKit runtimeUrl="/api/copilotkit" enableInspector={false}>

// <CopilotKitProvider> — takes showDevConsole, and DEFAULTS TO false.
// "auto" reproduces the localhost-only behaviour.
<CopilotKitProvider runtimeUrl="/api/copilotkit" showDevConsole="auto">`;

/**
 * The page dropped its feature table for three task tables. These are those,
 * in the page's own order: what you came to do, where a failure opens, and how
 * to get the overlay out of the way.
 */
const GOALS: [string, string][] = [
  ["Confirm that CopilotKit is connected", "Home, then Agent"],
  ["Find out why a run or tool failed", "The red launcher or error pill"],
  ["Follow messages, events, tools, state, context", "Agent and the Inspect panes"],
  ["Reproduce a saved conversation safely", "Threads → Try from here"],
  ["Continue a saved Thread in your application", "Threads → View in your app"],
  ["Enable or repair Intelligence", "Home, or a locked Threads"],
  ["Review what Learning found", "Learning"],
];

const FAILURES: [string, string][] = [
  ["Runtime or connection", "Home"],
  ["Loading the Thread list", "Threads"],
  ["Agent run or RUN_ERROR", "AG-UI Events"],
  ["Tool handler or missing tool", "Agent"],
  ["Loading Learning data", "Learning"],
];

const VISIBILITY: [string, string][] = [
  ["Close the current view", "The close control; reopen from the Inspector button"],
  ["See your app without an overlay", "The pop-out control in the Inspector header"],
  [
    "Hide it temporarily on this domain",
    "Hide Inspector for a day (launcher HUD), or for one week (settings)",
  ],
  ["Disable it for the development app", "Set enableInspector to false"],
];

function TaskTable({
  left,
  right,
  rows,
}: {
  left: string;
  right: string;
  rows: [string, string][];
}) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700">
            <th className="pb-2 pr-4 font-medium">{left}</th>
            <th className="pb-2 font-medium">{right}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map(([a, b]) => (
            <tr key={a}>
              <td className="py-2 pr-4 font-medium text-slate-800 dark:text-slate-100">
                {a}
              </td>
              <td className="py-2 text-slate-600 dark:text-slate-400">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Page() {
  return (
    <>
      <RouteHeader path="/inspector" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          A built-in debugging overlay covering what the frontend and the agent
          are exchanging. It needs no API key and no configuration beyond
          enabling it, and a production build disables it unconditionally. The
          page is now written around what you are trying to do rather than
          around the list of panes.
        </p>

        <TaskTable left="Your goal" right="Start here" rows={GOALS} />

        <p className="mt-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          On an error the launcher turns red and may show an error pill. Clicking
          either one opens the view with the most useful evidence:
        </p>

        <TaskTable left="Failure" right="Opened view" rows={FAILURES} />

        <div className="mt-4">
          <TryIt
            prompts={["What's the weather in San Francisco?"]}
            expect="The event list fills, and Available Agents lists all seven Mastra agents — myAgent, weatherAgent, languageAgent, streamingAgent, searchAgent, colleaguesContactAgent, and backgroundAgentsAgent."
            fail="The inspector never appears — it is force-disabled in production builds, so confirm you are running the dev server."
          />
        </div>
      </Panel>
      <Panel title="How this repo enables it">
        <SourceCode file="frontend/src/components/providers.tsx" />
      </Panel>

      <Panel title="Controlling it">
        <TaskTable left="Goal" right="Action" rows={VISIBILITY} />

        <CodeBlock
          filename="Inspector control by provider"
          language="tsx"
          code={CONTROL_SNIPPET}
        />
      </Panel>

      <Panel title="The demo page">
        <SourceCode file="frontend/src/app/inspector/demo-chat/page.tsx" />
      </Panel>
    </>
  );
}
