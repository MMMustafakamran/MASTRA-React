"use client";

import { CopilotChat, CopilotThreadsDrawer } from "@copilotkit/react-core/v2";
import { DemoFrame } from "@/components/demo-frame";
import { ThreadsProvider } from "@/components/threads-provider";

function ThreadsDrawerDemo() {
  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      <div className="w-72 shrink-0 border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
        <CopilotThreadsDrawer agentId="myAgent" />
      </div>
      <div className="min-h-0 flex-1">
        <CopilotChat
          agentId="myAgent"
          labels={{
            welcomeMessageText:
              "Persistent Threads Demo — conversations are saved and selectable from the drawer on the left.",
          }}
        />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ThreadsProvider>
      <DemoFrame
        parentPath="/prebuilt-components/copilot-threads-drawer"
        subtitle="Prebuilt CopilotThreadsDrawer sidebar with durable conversation history."
      >
        <ThreadsDrawerDemo />
      </DemoFrame>
    </ThreadsProvider>
  );
}
