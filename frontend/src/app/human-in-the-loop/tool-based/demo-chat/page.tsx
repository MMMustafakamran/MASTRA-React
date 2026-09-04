"use client";

import { CopilotChat, useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { z } from "zod";

import { DemoFrame } from "@/components/demo-frame";

/**
 * The doc's `offerOptions` tool.
 *
 * `useHumanInTheLoop` registers a tool with a `render` and no `handler`. The
 * run suspends on the call and stays suspended until `respond` fires, so what
 * the user clicks becomes the tool result the model reads next.
 *
 * No explicit generic: the hook infers `args` from `parameters`, so this is
 * the page's snippet unchanged. It used to be written
 * `useHumanInTheLoop<{ option_1: string; option_2: string }>` here, on the
 * belief that inference did not work — that is not true of
 * @copilotkit/react-core 1.66.2, and the added generic was a departure from
 * the published code with nothing to show for it. Verified by probe: removing
 * it typechecks, and `args.someUnknownField` is still a compile error.
 */
export default function Page() {
  useHumanInTheLoop({
    name: "offerOptions",
    description:
      "Give the user a choice between two options and have them select one.",
    parameters: z.object({
      option_1: z.string().describe("The first option"),
      option_2: z.string().describe("The second option"),
    }),
    render: ({ args, respond }) => {
      if (!respond) return <></>;
      return (
        <div className="my-2 flex flex-wrap gap-2 text-white rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => respond(`${args.option_1} was selected`)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] dark:border-slate-600"
          >
            {args.option_1}
          </button>
          <button
            type="button"
            onClick={() => respond(`${args.option_2} was selected`)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] dark:border-slate-600"
          >
            {args.option_2}
          </button>
        </div>
      );
    },
  });

  return (
    <DemoFrame
      parentPath="/human-in-the-loop/tool-based"
      subtitle="the run waits for your click"
    >
      <CopilotChat
        agentId="myAgent"
        labels={{
          welcomeMessageText:
            'Try "Can you show me two good options for a restaurant name?"',
        }}
      />
    </DemoFrame>
  );
}
