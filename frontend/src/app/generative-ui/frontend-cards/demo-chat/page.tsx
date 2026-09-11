"use client";

import {
  CopilotChat,
  CopilotKit,
  useAgent,
  useCopilotKit,
} from "@copilotkit/react-core/v2";
import { useEffect, useState } from "react";

import { DemoFrame } from "@/components/demo-frame";

import { DeploymentWatcher } from "../deployment-watcher";
import { eventCardRenderer } from "../event-card";

/**
 * Frontend-Driven Cards.
 *
 * The provider is step 2's, props unchanged: `runtimeUrl="/api/copilotkit"`
 * and `renderActivityMessages`, nothing else — no `agent`, no
 * `useSingleEndpoint`, no headers. It nests inside the app-wide provider, so
 * this route runs on its own core, the way a reader's app would.
 *
 * Step 2's `Page` renders only `<CopilotChat />`. Three things are added inside
 * it, and none of them change what the page teaches:
 *
 *   - `<DeploymentWatcher />`, step 3 verbatim. The page never says where it
 *     mounts; under the provider is the only place `useAgent()` works.
 *   - A button that adds the same activity message step 3 adds. Step 3's
 *     trigger is a WebSocket at a placeholder host that never sends anything;
 *     the page names "a button `onClick`" as an equivalent trigger.
 *   - A probe for the page's "What the agent receives" table: the roles in
 *     `agent.messages`, beside the roles in the run request that actually left
 *     the browser. The page says `activity` is in the first and never in the
 *     second. The probe reads the request body itself rather than trusting
 *     the library's own accounting.
 *
 * ON THIS REPO THE ROUTE CRASHES, and that is the finding, not a harness bug.
 * The bare `useAgent()` (step 3, and the probe) and `<CopilotChat />` (step 2)
 * resolve to agent id "default". `/api/copilotkit` registers the Mastra agents
 * under their instance keys (`myAgent`, …) and has no `default`, so once
 * `/info` answers, react-core 1.71.0 throws "useAgent: Agent 'default' not
 * found after runtime sync" from DeploymentWatcher and the route is replaced
 * by the error boundary. Do not add an `agentId` here — the page publishes
 * none. See the route page for the control that names one.
 */

type Probe = { roles: string[]; at: string } | null;

/** Pulls the message roles out of an outgoing agent-run request body. */
function rolesInRunBody(raw: string): string[] | null {
  try {
    const body = JSON.parse(raw);
    const messages = body?.messages ?? body?.body?.messages ?? body?.params?.messages;
    if (!Array.isArray(messages)) return null;
    return messages.map((m: { role?: string }) => m.role ?? "?");
  } catch {
    return null;
  }
}

function CardControls() {
  const { agent, isReady } = useAgent();
  const { copilotkit } = useCopilotKit();
  const [payload, setPayload] = useState<Probe>(null);

  // Taps every POST this route sends to the runtime, and records the roles in
  // any body that carries a message list — which is exactly the run payload.
  useEffect(() => {
    const original = window.fetch;
    window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/api/copilotkit") && typeof init?.body === "string") {
        const roles = rolesInRunBody(init.body);
        if (roles) setPayload({ roles, at: new Date().toLocaleTimeString() });
      }
      return original(input, init);
    };
    return () => {
      window.fetch = original;
    };
  }, []);

  function addCard() {
    // Step 3's `addMessage` call, fired from a click instead of a socket.
    agent.addMessage({
      id: crypto.randomUUID(),
      role: "activity",
      activityType: "app-event-card",
      content: {
        title: "Deployment finished",
        detail: `sha ${Math.random().toString(16).slice(2, 9)}`,
      },
    });
  }

  const transcriptRoles = agent.messages.map((m) => m.role);
  const leaked = payload?.roles.includes("activity") ?? false;

  return (
    <div className="shrink-0 border-b border-slate-200 p-3 dark:border-slate-800">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          data-testid="add-activity-card"
          onClick={addCard}
          className="rounded-md border border-[var(--accent)] px-3 py-1.5 text-sm text-[var(--accent)]"
        >
          Simulate: deployment finished
        </button>
      </div>

      <table className="mt-3 w-full text-left text-xs">
        <tbody className="align-top">
          <tr>
            <th className="w-64 py-1 pr-3 font-medium text-slate-500">
              <code>useAgent()</code> → agent
            </th>
            <td data-testid="agent-state" className="py-1 font-mono">
              {`${agent.agentId ?? "?"} · isReady ${String(isReady)} · runtime ${copilotkit.runtimeConnectionStatus}`}
            </td>
          </tr>
          <tr className="border-t border-slate-200 dark:border-slate-800">
            <th className="w-64 py-1 pr-3 font-medium text-slate-500">
              <code>agent.messages</code> (what the chat renders)
            </th>
            <td data-testid="roles-transcript" className="py-1 font-mono">
              {transcriptRoles.length ? transcriptRoles.join(", ") : "—"}
            </td>
          </tr>
          <tr className="border-t border-slate-200 dark:border-slate-800">
            <th className="py-1 pr-3 font-medium text-slate-500">
              Last run payload (what the agent receives)
            </th>
            <td
              data-testid="roles-payload"
              className={`py-1 font-mono ${
                leaked
                  ? "text-rose-700 dark:text-rose-400"
                  : "text-emerald-700 dark:text-emerald-400"
              }`}
            >
              {payload
                ? `${payload.roles.join(", ")}  (${payload.at})`
                : "no run sent yet"}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function Page() {
  return (
    <DemoFrame
      parentPath="/generative-ui/frontend-cards"
      subtitle="activity messages"
    >
      {/* [2] frontend cards: register the renderer on the provider */}
      <CopilotKit
        runtimeUrl="/api/copilotkit"
        renderActivityMessages={[eventCardRenderer]} // [!code highlight]
      >
        <DeploymentWatcher />
        <div className="flex h-full flex-col">
          <CardControls />
          <div className="min-h-0 flex-1">
            <CopilotChat />
          </div>
        </div>
      </CopilotKit>
    </DemoFrame>
  );
}
