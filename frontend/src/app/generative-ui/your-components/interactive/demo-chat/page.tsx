"use client";

import { CopilotChat, useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { z } from "zod";

import { DemoFrame } from "@/components/demo-frame";

/**
 * A component the agent uses to *interact* with the user, not just to display.
 *
 * `useHumanInTheLoop` registers a tool with a `render` and no `handler`. The run
 * suspends on the tool call and stays suspended until `respond` fires, so what
 * the user clicks becomes the tool result the model reads next.
 *
 * Mastra has native AG-UI support, so nothing is declared in `src/mastra` — the
 * tool is forwarded automatically while this route is mounted.
 *
 * The generic is supplied explicitly: unlike `useRenderTool`, this hook does not
 * infer its arg type from `parameters`, so `args.command` would otherwise be
 * `unknown` and unusable in JSX.
 */
export default function Page() {
  useHumanInTheLoop<{ command: string }>({
    name: "humanApprovedCommand",
    description: "Ask human for approval to run a command.",
    parameters: z.object({
      command: z.string().describe("The command to run"),
    }),
    render: ({ args, respond, status }) => {
      if (status !== "executing") return <></>;
      return (
        <div className="my-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Approval required
          </p>
          <pre className="mt-2 overflow-x-auto rounded bg-slate-950 p-3 text-xs text-slate-100">
            {args.command}
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => respond?.(`Tell the user the command ran`)}
              className="rounded-md px-3 py-1.5 rounded-md border border-white text-sm text-white font-medium"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => respond?.(`Tell the user the command wasn't run`)}
              className="rounded-md border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-600"
            >
              Deny
            </button>
          </div>
        </div>
      );
    },
  });

  return (
    <DemoFrame
      parentPath="/generative-ui/your-components/interactive"
      subtitle="useHumanInTheLoop — the run waits for your click"
    >
      <CopilotChat
        agentId="myAgent"
        labels={{
          welcomeMessageText:
            'Try "Run the command rm -rf /tmp/cache" — I will ask before doing anything.',
        }}
      />
    </DemoFrame>
  );
}
