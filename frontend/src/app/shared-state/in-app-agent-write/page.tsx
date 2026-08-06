import { RouteHeader } from "@/components/route-header";
import { SourceCode } from "@/components/source-code";
import { Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/shared-state/in-app-agent-write" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The other direction: the app writing into working memory.{" "}
          <code>agent.setState</code> updates the value and re-renders anything
          reading it, and the agent picks it up on its next run.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          This agent&apos;s instructions say to always reply in the language held
          in working memory — so the toggle is observable in the agent&apos;s
          behaviour, not just in the panel.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={[
              "Press Toggle Language, then say: tell me a joke",
              "Toggle back and ask again",
            ]}
            expect="The panel flips immediately, and the agent's next reply comes back in the newly selected language."
            fail="The panel changes but the agent keeps replying in the old language — the state is not reaching the run."
          />
        </div>
      </Panel>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/shared-state/in-app-agent-write/demo-chat/page.tsx" />
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          The agent and its schema are the same ones shown on the{" "}
          <a
            href="/shared-state/in-app-agent-read"
            className="text-[var(--accent)] underline underline-offset-4"
          >
            reading route
          </a>{" "}
          — the two doc pages share one backend sample.
        </p>
      </Panel>
    </>
  );
}
