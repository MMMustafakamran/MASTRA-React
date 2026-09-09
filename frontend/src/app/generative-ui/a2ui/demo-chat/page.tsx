"use client";

import { CopilotChat } from "@copilotkit/react-core/v2";

import { DemoFrame } from "@/components/demo-frame";

/**
 * A2UI — docs.copilotkit.ai/mastra/generative-ui/a2ui
 *
 * This file is short on purpose, and the shortness IS the demo.
 *
 * Every other Generative UI route in this harness registers React on the
 * frontend: `useComponent` on Display-only, `useRenderTool` on Tool Rendering,
 * `useHumanInTheLoop` on Interactive. A2UI registers nothing. The agent streams
 * a declarative JSONL component tree, the renderer that ships inside
 * CopilotKit turns it into DOM, and the page below is a bare `<CopilotChat>` —
 * exactly as the doc's Frontend section states: "The A2UI renderer activates
 * automatically — no extra configuration needed on the frontend."
 *
 * The whole integration therefore lives on the server, in the runtime's `a2ui`
 * option (`api/copilotkit/[[...slug]]/route.ts`). If cards appear below without
 * this file describing a single one of them, the feature works.
 *
 * The doc also shows an optional `a2ui={{ theme: myCustomTheme }}` prop on the
 * provider. It is deliberately NOT passed here: the page says that prop "is
 * only needed if you want to override the default theme provided", and passing
 * a theme would mean the take could not tell a working default renderer from a
 * themed one.
 */
export default function Page() {
  return (
    <DemoFrame
      parentPath="/generative-ui/a2ui"
      subtitle="A2UIMiddleware · no frontend components registered"
    >
      <CopilotChat
        agentId="a2uiAgent"
        labels={{
          welcomeMessageText:
            'Try "Show me three pricing plans as cards" — the layout below is streamed by the agent, not written in this page.',
        }}
      />
    </DemoFrame>
  );
}
