"use client";

import { CopilotChat, ToolCallStatus, useHumanInTheLoop } from "@copilotkit/react-core/v2";
import { useEffect } from "react";
import { z } from "zod";

import { DemoFrame } from "@/components/demo-frame";

/**
 * Governed Action Approval UI — the page's tool-call variant.
 *
 * The guide publishes two patterns. This is `useHumanInTheLoop`, the one that
 * works against any agent. The `useInterrupt` variant needs a backend that can
 * pause a run and attach `interrupt.metadata.action`, which no Mastra agent
 * here does — see the route page.
 *
 * Everything below is the page's code as published — schema, card, tool and
 * all. It compiles unchanged against @copilotkit/react-core 1.66.2: `args` is
 * inferred from `parameters`, and `render` accepts `null`.
 */

// [1] governed actions: the action envelope
// [!code highlight]
type GovernedAction = {
  id: string;
  summary: string;
  tool: string;
  reference: string;
  verdict: "allow" | "deny" | "require_approval";
  arguments: Record<string, unknown>;
};

const governedActionSchema = z.object({
  id: z.string(),
  summary: z.string(),
  tool: z.string(),
  reference: z.string(),
  verdict: z.enum(["allow", "deny", "require_approval"]),
  arguments: z.record(z.unknown()),
});

// [2] governed actions: the approval card
// [!code highlight]
function GovernedActionCard({
  action,
  onApprove,
  onReject,
  onBlock,
}: {
  action: GovernedAction;
  onApprove: () => void;
  onReject: () => void;
  onBlock: () => void;
}) {
  useEffect(() => {
    if (action.verdict === "allow") onApprove();
    if (action.verdict === "deny") onBlock();
  }, [action.id, action.verdict]);

  const status =
    action.verdict === "allow"
      ? "Allowed by policy"
      : action.verdict === "deny"
        ? "Blocked by policy"
        : "User approval required";

  return (
    <section className="my-2 rounded-lg border border-slate-200 p-4 shadow-sm dark:border-slate-700">
      <div className="space-y-1">
        <p className="text-sm font-medium">{status}</p>
        <h3 className="text-base font-semibold">{action.summary}</h3>
        <p className="text-sm text-slate-500">Tool: {action.tool}</p>
        <p className="text-sm text-slate-500">Reference: {action.reference}</p>
      </div>

      <pre className="mt-3 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-100">
        {JSON.stringify(action.arguments, null, 2)}
      </pre>

      {action.verdict === "require_approval" && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onApprove}
            className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white"
          >
            Approve and run
          </button>
          <button
            type="button"
            onClick={onReject}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium dark:border-slate-600"
          >
            Reject
          </button>
        </div>
      )}
    </section>
  );
}

// [3] governed actions: register the approval tool
// [!code highlight]
function GovernedActionTool() {
  useHumanInTheLoop(
    {
      name: "approve_governed_action",
      description:
        "Ask the user to approve a governed side-effect action before it runs.",
      parameters: governedActionSchema,
      render: ({ args, status, respond }) => {
        if (status !== ToolCallStatus.Executing || !respond) {
          return null;
        }

        return (
          <GovernedActionCard
            action={args}
            onApprove={() =>
              respond({
                approved: true,
                actionId: args.id,
                reference: args.reference,
              })
            }
            onReject={() =>
              respond({
                approved: false,
                actionId: args.id,
                reference: args.reference,
              })
            }
            onBlock={() =>
              respond({
                approved: false,
                actionId: args.id,
                reference: args.reference,
              })
            }
          />
        );
      },
    },
    [],
  );

  return null;
}

export default function Page() {
  return (
    <DemoFrame
      parentPath="/human-in-the-loop/governed-actions"
      subtitle="approve_governed_action — the run waits on your verdict"
    >
      <GovernedActionTool />
      <CopilotChat
        agentId="myAgent"
        labels={{
          welcomeMessageText:
            'Try "Send an invoice reminder to acme@example.com — ask me to approve it first."',
        }}
      />
    </DemoFrame>
  );
}
