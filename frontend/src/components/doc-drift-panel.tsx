import Link from "next/link";

import { SeverityBadge } from "@/components/doc-diff";
import { DocSyncButton } from "@/components/doc-sync-button";
import { Panel } from "@/components/ui";
import { docTargets } from "@/lib/doc-sync/paths";
import { readLatestReport, readManifest } from "@/lib/doc-sync/store";

/**
 * The doc-drift summary and its sync button, for the landing page.
 *
 * Self-contained — it reads the snapshot itself rather than taking props — so
 * dropping it into a landing page is a one-line change. That matters because
 * this ships into fifteen sibling repos whose landing pages are otherwise
 * nothing alike.
 *
 * It is async, which a synchronous server component can still render as a
 * child; the host page needs no restructuring. The host does need
 * `export const dynamic = "force-dynamic"`, or `next build` will inline a
 * snapshot state that then never updates.
 */
export async function DocDriftPanel() {
  const [manifestState, report] = await Promise.all([readManifest(), readLatestReport()]);
  const baseline = manifestState.kind === "absent";
  const tracked = docTargets().length;

  return (
    <Panel
      title="Doc drift"
      description={`Re-fetch the markdown behind all ${tracked} tracked doc pages, diff against the stored snapshot, then replace it.`}
      actions={<DocSyncButton baseline={baseline} />}
    >
      {baseline ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          No snapshot yet. The first run stores {tracked} pages; from the next
          one on, anything the docs change shows up here — with edits inside
          code blocks ranked highest, since those are the ones that can
          invalidate a route.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <SeverityBadge severity={report?.highest ?? "none"} />
          <span className="text-slate-700 dark:text-slate-300">
            {report?.aborted
              ? report.aborted.reason
              : report
                ? `${report.counts.changed} changed · ${report.counts.unchanged} unchanged · ${report.counts.missing} missing`
                : "Snapshot stored, no run recorded yet."}
          </span>
          <Link
            href="/doc-sync"
            className="text-[var(--accent)] underline underline-offset-4"
          >
            Full report
          </Link>
        </div>
      )}
    </Panel>
  );
}
