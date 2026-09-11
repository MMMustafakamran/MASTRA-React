import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

const CRASH = `GET /api/copilotkit/info → 200
  agents: myAgent, a2uiAgent, weatherAgent, languageAgent, streamingAgent,
          searchAgent, colleaguesContactAgent, backgroundAgentsAgent   (no "default")

Runtime Error  src/app/generative-ui/frontend-cards/deployment-watcher.tsx (17:29)
  useAgent: Agent 'default' not found after runtime sync (runtimeUrl=/api/copilotkit).
  Known agents: [myAgent, a2uiAgent, weatherAgent, languageAgent, streamingAgent,
  searchAgent, colleaguesContactAgent, backgroundAgentsAgent]
  Verify your runtime /info and/or agents__unsafe_dev_only.

Page: "This page couldn't load"`;

export default function Page() {
  return (
    <>
      <RouteHeader path="/generative-ui/frontend-cards" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          A card your app puts in the chat on its own — a job finished, a
          socket pushed something — with no agent turn behind it. It is a
          message with <code>role: &quot;activity&quot;</code>: the transcript
          renders it through a registered renderer, and it is stripped from
          every run request, so the model never sees it.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={[
              "Click “Simulate: deployment finished”, then ask: Have you been shown any deployment card?",
            ]}
            expect="Per the page: the card appears in the transcript, the run payload carries only user, and the agent says it saw no card."
            fail="What actually happens on this repo: the route crashes about a second after load — useAgent() throws because this runtime has no agent called default. See below."
          />
        </div>
      </Panel>

      <Callout tone="warn" title="On this repo the page's code crashes the route: there is no `default` agent">
        Step 3&apos;s <code>useAgent()</code> and step 2&apos;s{" "}
        <code>&lt;CopilotChat /&gt;</code> pass no <code>agentId</code>, so both
        resolve to <code>&quot;default&quot;</code>. The page is byte-identical
        under every framework prefix and never mentions agent ids, but the
        Mastra Quickstart builds <code>new Mastra({"{ agents: { myAgent } }"})</code>{" "}
        and <code>MastraAgent.getLocalAgents</code> registers each agent under
        that key — so a reader who followed it has <code>myAgent</code>, not{" "}
        <code>default</code>. This repo&apos;s <code>/api/copilotkit</code> is
        built the same way: <code>myAgent</code> and seven others, no{" "}
        <code>default</code>. Until <code>/info</code> answers,{" "}
        <code>useAgent()</code> hands back a provisional agent; the moment it
        does, react-core 1.71.0 throws, and the error boundary replaces the
        whole route. Verified with the page&apos;s two components alone on a
        scratch route (same crash, same line), so the harness&apos;s probe is
        not the cause.
        <pre className="mt-3 overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
          {CRASH}
        </pre>
      </Callout>

      <Callout tone="success" title="With an agent id named, the central claim holds">
        A throwaway control (not kept) ran the same provider and renderer with{" "}
        <code>useAgent({"{ agentId: \"myAgent\" }"})</code> and{" "}
        <code>&lt;CopilotChat agentId=&quot;myAgent&quot; /&gt;</code>: the card
        rendered, <code>agent.messages</code> read{" "}
        <code>activity, user, assistant</code>, the run request that left the
        browser carried only <code>user</code>, and the agent answered that it
        had received no deployment card. So the mechanism works on Mastra; the
        snippet as published does not reach it. Runtime and react-core 1.71.0.
      </Callout>

      <Callout tone="warn" title="Step 3 is never wired to step 2">
        Step 2&apos;s <code>Page</code> renders <code>&lt;CopilotChat /&gt;</code>{" "}
        and nothing else; step 3 builds <code>&lt;DeploymentWatcher /&gt;</code>{" "}
        and never says where it goes. It has to be under the provider for{" "}
        <code>useAgent()</code> to work — this route mounts it there. And its
        socket is <code>wss://example.com/deployments</code>, a placeholder that
        404s the handshake (seen in the console here), so mounted as published
        it never adds a card. The demo&apos;s button calls the same{" "}
        <code>addMessage</code>, which the page names as an equivalent trigger.
      </Callout>

      <Callout tone="info" title="Not re-checked here: cards added before the runtime connects">
        On a runtime that does register <code>default</code>, a card added
        while <code>useAgent()</code> still returns the provisional agent (
        <code>isReady: false</code>) is silently dropped when the real agent
        replaces it — the page never mentions <code>isReady</code>. On this repo
        the provisional agent is replaced by a throw instead, so that race
        cannot be reached with the page&apos;s code.
      </Callout>

      <Panel title="Source">
        <SourceCodeGroup
          files={[
            { file: "frontend/src/app/generative-ui/frontend-cards/event-card.tsx" },
            { file: "frontend/src/app/generative-ui/frontend-cards/deployment-watcher.tsx" },
          ]}
        />
        <div className="mt-4">
          <SourceCode file="frontend/src/app/generative-ui/frontend-cards/demo-chat/page.tsx" />
        </div>
      </Panel>
    </>
  );
}
