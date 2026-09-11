import { RouteHeader } from "@/components/route-header";
import { SourceCode } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

const SERVER_LOG = `POST /api/copilotkit-learning/agent/expense-agent/run  → 404 {"error":"Failed to initialize thread"}
  Failed to get or create thread: Intelligence platform error 404:
  {"code":"LEARNING_CONTAINER_NOT_FOUND","message":"The Learning Container was not found in this project."}

POST /api/copilotkit-learning/agent/default/run        → 200  "Hello! How are you today?"`;

export default function Page() {
  return (
    <>
      <RouteHeader path="/learning" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Learning groups Threads from one kind of work into a container,
          analyzes completed runs into Insights, and proposes Skills you review
          and publish. The only code the page asks for is one runtime callback,{" "}
          <code>getLearningContainerId</code>, that decides which container a
          new Thread joins. This route mounts that runtime verbatim at{" "}
          <code>/api/copilotkit-learning</code> and runs one agent it assigns and
          one it does not — both are this repo&apos;s Mastra{" "}
          <code>myAgent</code>.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={[
              "On expense-agent: Review this expense: $42 team lunch, receipt attached.",
              "On default: Say hello in five words.",
            ]}
            expect="Both agents answer; expense-agent's Thread shows up in the expense-review container in the dashboard."
            fail="What actually happens here: expense-agent never answers — see below. default answers."
          />
        </div>
      </Panel>

      <Callout tone="warn" title="A container ID that does not exist breaks the chat, not just the assignment">
        The page&apos;s example routes <code>expense-agent</code> to{" "}
        <code>expense-review</code>. That container does not exist in this
        project, and the result is not an unassigned Thread: the platform
        refuses to create the Thread at all, the run fails, and the chat shows
        the user&apos;s message and then nothing — no reply, no error in the
        transcript (the failure is only in the browser console).{" "}
        <code>default</code>, on the same runtime and the same Mastra agent,
        answers normally. The page&apos;s troubleshooting row for this case
        reads &quot;A Thread never appears in the container&quot;, which
        describes a much milder failure than the one you get.
        <pre className="mt-3 overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
          {SERVER_LOG}
        </pre>
      </Callout>

      <Callout tone="warn" title="The snippet leans on two things it never defines">
        <code>new CopilotRuntime({"{ agents, intelligence, identifyUser }"})</code>{" "}
        — <code>agents</code> and <code>identifyUser</code> appear nowhere else
        on the page. They are supplied in <code>lib/learning-runtime.ts</code>,
        above the verbatim block, and marked as this harness&apos;s. On Mastra{" "}
        <code>agents</code> is not even an object you write by hand — the
        Quickstart gets it from <code>MastraAgent.getLocalAgents</code>, whose
        keys are the Mastra instance&apos;s, so an <code>expense-agent</code> id
        only exists if you register one under that name.
      </Callout>

      <Callout tone="warn" title="No version floor">
        <code>getLearningContainerId</code> exists on{" "}
        <code>CopilotKitIntelligence</code> from runtime 1.70; on the 1.66.2
        this repo&apos;s lockfile pins, the option is not in the typings at
        all, so the page&apos;s snippet is a type error there. The page names
        no version, and its coding-agent prompt tells you not to use the
        deprecated <code>ɵlearning</code> option without saying what older
        runtimes have instead.
      </Callout>

      <Callout tone="premium" title="Not exercised here">
        Creating a container, Run Learning, reviewing Insights, approving a
        Skill, and <code>copilotkit skills download</code> are dashboard and CLI
        steps behind a login this harness does not drive. They are not on the
        clip, and nothing here says whether they work. (The Inspector&apos;s
        Learning tab on this mount answers{" "}
        <code>503 &quot;Inspector Learning is temporarily unavailable&quot;</code>.)
      </Callout>

      <Panel title="Source">
        <SourceCode file="frontend/src/lib/learning-runtime.ts" />
        <div className="mt-4">
          <SourceCode file="frontend/src/app/learning/demo-chat/page.tsx" />
        </div>
      </Panel>
    </>
  );
}
