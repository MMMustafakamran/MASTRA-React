import { RouteHeader } from "@/components/route-header";
import { SourceCode } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/human-in-the-loop/governed-actions" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          A checkpoint in front of a side-effecting action. The agent proposes
          one — send an email, update a record, apply a discount — and the run
          stops on an approval card showing what it wants to do, why, which
          policy reference produced the verdict, and the exact arguments. It
          runs only if you approve.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The envelope is a plain <code>GovernedAction</code> object with a{" "}
          <code>verdict</code> of <code>allow</code>, <code>deny</code> or{" "}
          <code>require_approval</code>. Only the last one draws buttons; the
          other two resolve themselves from an effect.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={[
              "Send an invoice reminder to acme@example.com — ask me to approve it first",
              "Now try one that policy should block",
            ]}
            expect="An approval card appears in the chat and the run stops on it. Approving returns an approved response and the agent continues; rejecting returns a refusal and the agent picks another path."
            fail="The agent describes the action in prose and never calls the tool — the model chose not to route through the checkpoint, which is the weakness noted below."
          />
        </div>
      </Panel>

      <Callout tone="info" title="New page, first covered in this sync">
        <code>/mastra/human-in-the-loop/governed-actions</code> appeared in the
        sitemap on 2026-09-04. It was invisible to{" "}
        <code>npm run drift:sync</code>, which only re-hashes pages already in
        the manifest — the sitemap comparison that finds new pages lives solely
        in the <code>/doc-sync</code> action. Found by running that comparison
        by hand.
      </Callout>

      <Callout tone="info" title="The published code compiles as written">
        Unusually, no departures. <code>args</code> is inferred from{" "}
        <code>parameters</code> as the exact envelope type,{" "}
        <code>render</code> accepts the <code>null</code> the snippet returns,
        and <code>z.record(z.unknown())</code> is valid on the installed zod
        3.25.76. The card, the schema and the tool registration are all
        byte-for-byte the page&apos;s.
      </Callout>

      <Callout tone="warn" title="The `useInterrupt` half is not implementable here">
        The page leads with a <code>useInterrupt</code> variant that reads{" "}
        <code>interrupt?.metadata?.action</code>. <code>Interrupt.metadata</code>{" "}
        is a real optional field on the AG-UI type, so the snippet is
        well-formed — but it needs a backend that pauses a run and attaches an
        action to it, and no Mastra agent here does. The page does not say which
        backends can do this, or how the action gets into{" "}
        <code>metadata</code> in the first place; it shows only the consuming
        half. That is the gap, and it is why this route takes the tool-call
        variant instead.
      </Callout>

      <Callout tone="warn" title="Nothing enforces the guardrails the page lists">
        The page closes with five guardrails — check policy server-side, use a
        stable <code>id</code> and <code>reference</code> so an approval cannot
        be replayed, show the exact arguments, treat <code>deny</code> as
        terminal, log everything. Every one of them is prose. The code above
        implements none: <code>handleApproval</code> compares{" "}
        <code>actionId</code> and <code>reference</code>, but it is a standalone
        function the page never wires to anything, and the tool variant does not
        call it at all. Follow the snippets and you get an approval UI with no
        replay protection and no audit trail, while the page reads as though it
        covered both.
      </Callout>

      <Callout tone="warn" title="The verdict shortcut fires from an effect with a stale dep list">
        <code>GovernedActionCard</code> auto-approves on <code>allow</code> and
        auto-blocks on <code>deny</code> from a <code>useEffect</code> keyed on{" "}
        <code>[action.id, action.verdict]</code> — but the effect calls{" "}
        <code>onApprove</code> and <code>onBlock</code>, neither of which is in
        the dependency array. Linted verbatim,{" "}
        <code>react-hooks/exhaustive-deps</code> says: &ldquo;React Hook
        useEffect has missing dependencies: &apos;onApprove&apos; and
        &apos;onBlock&apos;.&rdquo; It happens to work here because the handlers
        only close over <code>args</code>, which changes with the id — but it is
        published as an example to copy, and it will not survive a reader
        wrapping those handlers in state.
      </Callout>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/human-in-the-loop/governed-actions/demo-chat/page.tsx" />
      </Panel>
    </>
  );
}
