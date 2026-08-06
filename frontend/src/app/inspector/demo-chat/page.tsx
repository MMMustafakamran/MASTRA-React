"use client";

import { CopilotChat } from "@copilotkit/react-core/v2";

import { DemoFrame } from "@/components/demo-frame";

/**
 * A chat to give the inspector something to inspect.
 *
 * The inspector itself is deliberately NOT mounted here — the provider already
 * renders `<CopilotKitInspector core={copilotkit} />` once `showDevConsole` is
 * on. Mounting one by hand forwards `core ?? null` and reports "CopilotKit core
 * not attached".
 */
export default function Page() {
  return (
    <DemoFrame
      parentPath="/inspector"
      subtitle="provider-mounted overlay, anchored to the viewport edge"
    >
      <CopilotChat
        agentId="myAgent"
        labels={{
          welcomeMessageText:
            "Send a message, then open the inspector docked at the edge of the window.",
        }}
      />
    </DemoFrame>
  );
}
