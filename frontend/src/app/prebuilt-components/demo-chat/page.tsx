"use client";

import {
  CopilotChat,
  CopilotPopup,
  CopilotSidebar,
} from "@copilotkit/react-core/v2";
import { useState } from "react";

import { DemoFrame } from "@/components/demo-frame";

type Variant = "chat" | "sidebar" | "popup";

const TABS: { id: Variant; label: string; blurb: string }[] = [
  { id: "chat", label: "CopilotChat", blurb: "Inline — fills its container." },
  {
    id: "sidebar",
    label: "CopilotSidebar",
    blurb: "Docked to the right edge of the viewport.",
  },
  {
    id: "popup",
    label: "CopilotPopup",
    blurb: "Floating launcher in the bottom corner.",
  },
];

/**
 * All three prebuilt components against the same agent.
 *
 * Only the selected one is mounted: the sidebar and popup both use fixed
 * positioning and would overlap each other on screen.
 */
export default function Page() {
  const [variant, setVariant] = useState<Variant>("chat");
  const active = TABS.find((t) => t.id === variant)!;

  return (
    <DemoFrame parentPath="/prebuilt-components" subtitle={active.blurb}>
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 flex-wrap gap-2 border-b border-slate-200 p-3 dark:border-slate-800">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setVariant(tab.id)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                variant === tab.id
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-slate-300 text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1">
          {variant === "chat" && (
            <CopilotChat
              agentId="myAgent"
              labels={{ welcomeMessageText: "Hi! How can I assist you today?" }}
            />
          )}

          {variant === "sidebar" && (
            <>
              <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-500">
                The sidebar is docked at the right edge of the window.
              </div>
              <CopilotSidebar
                agentId="myAgent"
                defaultOpen
                labels={{
                  modalHeaderTitle: "Sidebar Assistant",
                  welcomeMessageText: "How can I help you today?",
                }}
              />
            </>
          )}

          {variant === "popup" && (
            <>
              <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-500">
                The launcher is in the bottom corner — click it to open the
                popup.
              </div>
              <CopilotPopup
                agentId="myAgent"
                labels={{
                  modalHeaderTitle: "Popup Assistant",
                  welcomeMessageText: "Need any help?",
                }}
              />
            </>
          )}
        </div>
      </div>
    </DemoFrame>
  );
}
