"use client";

import { CopilotChat, CopilotThreadsDrawer } from "@copilotkit/react-core/v2";
import { DemoFrame } from "@/components/demo-frame";
import { ThreadsProvider } from "@/components/threads-provider";

function ThreadsDemo() {
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
              "Persistent Threads Demo — conversations are stored durably across page refreshes.",
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
        parentPath="/threads"
        subtitle="Persistent Threads across browser sessions and reloads."
      >
        <ThreadsDemo />
      </DemoFrame>
    </ThreadsProvider>
  );
}
