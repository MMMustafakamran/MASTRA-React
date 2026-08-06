"use client";

import { CopilotChat } from "@copilotkit/react-core/v2";

import { DemoFrame } from "@/components/demo-frame";

/**
 * Long-running work dispatched to a background worker.
 *
 * A tool marked `background: { enabled: true }` does not block the run. Mastra
 * queues it, the agent replies straight away, and progress arrives separately
 * as AG-UI activity events.
 *
 * The renderer for those events is registered on the provider rather than here
 * — see `components/background-task-activity.tsx` for why.
 */
export default function Page() {
  return (
    <DemoFrame
      parentPath="/background-tasks"
      subtitle="background tool → AG-UI activity events"
    >
      <CopilotChat
        agentId="backgroundAgentsAgent"
        labels={{
          welcomeMessageText:
            'Try "Research the history of the Dutch East India Company" — the work runs in the background.',
        }}
      />
    </DemoFrame>
  );
}
