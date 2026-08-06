import { RouteHeader } from "@/components/route-header";
import { SourceCode } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/generative-ui/your-components/interactive" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The other half of &ldquo;your components&rdquo;: a component the agent
          uses to <em>ask</em> the user something, rather than only to show them
          something. Here that is an approval gate — the agent proposes a
          command, and nothing continues until you approve or deny it.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={[
              "Run the command rm -rf /tmp/cache",
              "Deploy the app with: npm run deploy",
            ]}
            expect="An approval card renders in the message stream with the command in a code block, and nothing further streams until you click Approve or Deny. The agent's next message reflects which you chose."
            fail="The agent describes the command as plain text with no buttons, or continues without waiting — the tool name did not reach the agent."
          />
        </div>
      </Panel>

      <Panel
        title="How it differs from Display-only"
        description="Same registration shape, different completion signal."
      >
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <code>useComponent</code> registers a tool with a{" "}
          <code>render</code> and no handler, and the run carries straight on —
          a one-way draw. <code>useHumanInTheLoop</code> also has no handler, but
          its render props include <code>respond</code>, and the run stays
          suspended until you call it. The string you pass becomes the tool
          result, which is why the agent&apos;s reply changes with the button.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The <code>status !== &quot;executing&quot;</code> guard matters:
          without it the card would also render while the call is still streaming
          in, and again after it resolves — so you would be shown an approval
          prompt for a decision already made.
        </p>
      </Panel>

      <Callout tone="info" title="Two HITL samples, two doc pages">
        This is not the same sample as{" "}
        <a
          href="/human-in-the-loop/tool-based"
          className="underline underline-offset-4"
        >
          Human in the Loop
        </a>
        . That page&apos;s <code>offerOptions</code> asks the user to{" "}
        <em>choose</em> between two values the agent generated; this page&apos;s{" "}
        <code>humanApprovedCommand</code> asks the user to <em>authorise</em> an
        action before it happens. Both are implemented here, on separate routes,
        because both appear in the docs.
      </Callout>

      <Callout tone="warn" title="Two things worth knowing">
        <p>
          <strong>No Mastra-side declaration.</strong> Frontend tools are
          forwarded over AG-UI automatically, so nothing is added to{" "}
          <code>src/mastra</code> for this route.
        </p>
        <p className="mt-2">
          <strong>The generic is not inferred.</strong>{" "}
          <code>useHumanInTheLoop</code> defaults its arg type to{" "}
          <code>Record&lt;string, unknown&gt;</code> rather than reading{" "}
          <code>parameters</code>, so the doc&apos;s <code>args.command</code> is{" "}
          <code>unknown</code> and will not compile in JSX. The source supplies
          the type parameter explicitly.
        </p>
      </Callout>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/generative-ui/your-components/interactive/demo-chat/page.tsx" />
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          The hook registration, the <code>status</code> guard, and both{" "}
          <code>respond?.()</code> strings are the doc&apos;s. Only the button
          and container styling is this repo&apos;s.
        </p>
      </Panel>
    </>
  );
}
