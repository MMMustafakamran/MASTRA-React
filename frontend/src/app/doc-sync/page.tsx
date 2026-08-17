import Link from "next/link";

import { CheckMark, PageComparison, SeverityBadge } from "@/components/doc-diff";
import { DocSyncButton } from "@/components/doc-sync-button";
import { RouteHeader } from "@/components/route-header";
import { Callout, KeyValue, Panel } from "@/components/ui";
import { docTargets, normalizeDocPath } from "@/lib/doc-sync/paths";
import { readLatestReport, readManifest } from "@/lib/doc-sync/store";
import type { PageReport } from "@/lib/doc-sync/types";
import { NAV, docUrl } from "@/lib/nav-config";

/**
 * The full drift report.
 *
 * Every tracked section is listed, matched or not — a page that is fine and a
 * page that was never checked have to be distinguishable at a glance, which
 * they are not if the report only prints failures. Each row expands to the
 * comparison behind its check.
 *
 * Reads exactly two files: the latest report and the manifest. The report
 * embeds its own hunks, so rendering never touches a snapshot body.
 *
 * `force-dynamic` is not optional. Without it `next build` would read the
 * report once, inline it into a static page, and serve a frozen snapshot
 * forever — and it would look correct in dev, where pages re-render per
 * request.
 */
export const dynamic = "force-dynamic";

export default async function Page() {
  const [manifestState, report] = await Promise.all([readManifest(), readLatestReport()]);
  const manifest = manifestState.kind === "ok" ? manifestState.manifest : null;
  const baseline = manifestState.kind === "absent";
  const targets = docTargets();

  // Routes are what you navigate; doc pages are what gets fetched, and several
  // routes can share one. Keying by normalized docPath is what lets every row
  // find its result.
  const byDocPath = new Map<string, PageReport>(
    (report?.pages ?? []).map((p) => [p.docPath, p]),
  );

  return (
    <>
      <RouteHeader path="/doc-sync" />

      <Panel
        title="Snapshot"
        description="Fetches the markdown source behind every doc page this repo tracks, diffs it against the stored copy, then replaces that copy."
        actions={<DocSyncButton baseline={baseline} />}
      >
        <KeyValue
          rows={[
            [
              "Last synced",
              manifest ? formatStamp(manifest.syncedAt) : "never — no snapshot yet",
            ],
            ["Doc pages tracked", `${targets.length}`],
            [
              "Last run",
              report ? `${report.durationMs}ms · ${report.pages.length} checked` : "—",
            ],
            [
              "Result",
              report?.aborted ? (
                "aborted — snapshot untouched"
              ) : report ? (
                <span key="r" className="inline-flex items-center gap-2">
                  <SeverityBadge severity={report.highest} />
                  {summarize(report.counts)}
                </span>
              ) : (
                "—"
              ),
            ],
          ]}
        />
      </Panel>

      {manifestState.kind === "error" && (
        <Callout tone="warn" title="The manifest could not be read">
          <p>{manifestState.error}</p>
          <p className="mt-1">
            Delete <code>doc-snapshot/manifest.json</code> and re-run to rebuild
            the baseline.
          </p>
        </Callout>
      )}

      {baseline && (
        <Callout tone="info" title="No snapshot recorded yet">
          <p>
            The first run stores {targets.length} pages and has nothing to
            compare them against. Differences start appearing on the run after
            that.
          </p>
        </Callout>
      )}

      {report?.aborted && (
        <Callout tone="warn" title="Run aborted — snapshot left untouched">
          <p>{report.aborted.reason}</p>
          <p className="mt-1">
            The sync commits all pages or none. A partial snapshot would make
            the next run&apos;s diff silently wrong about whichever pages were
            skipped.
          </p>
        </Callout>
      )}

      {report && !report.aborted && report.highest === "high" && (
        <Callout tone="warn" title="A change landed inside a code block">
          <p>
            An implementation here may no longer match what its doc page
            teaches. Expand the flagged sections below, reconcile the affected
            routes, and re-run the sync.
          </p>
        </Callout>
      )}

      <Panel
        title="Sections checked"
        description="Every doc page this repo tracks, in nav order. Expand a row to compare the stored copy against the one just fetched."
      >
        <div className="space-y-6">
          {NAV.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {group.title}
              </h3>
              <div className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {group.routes.map((route) => {
                  const page = byDocPath.get(normalizeDocPath(route.docPath));
                  return (
                    <details key={route.path} className="group">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <span
                          aria-hidden
                          className="w-3 shrink-0 select-none font-mono text-xs text-slate-400 transition-transform group-open:rotate-90 dark:text-slate-500"
                        >
                          ▸
                        </span>
                        <CheckMark outcome={page?.outcome} />
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {route.title}
                        </span>
                        <code className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          {route.path}
                        </code>
                        {page && page.severity !== "none" && (
                          <SeverityBadge severity={page.severity} />
                        )}
                        <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                          {page ? OUTCOME_TEXT[page.outcome] : "not checked"}
                        </span>
                      </summary>

                      <div className="border-t border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-900/60">
                        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                          <a
                            href={docUrl(route)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--accent)] underline underline-offset-4"
                          >
                            doc page ↗
                          </a>
                          <Link
                            href={route.path}
                            className="text-[var(--accent)] underline underline-offset-4"
                          >
                            open route
                          </Link>
                          <code className="font-mono text-slate-500 dark:text-slate-400">
                            {normalizeDocPath(route.docPath)}
                          </code>
                        </div>
                        <PageComparison page={page} />
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {report &&
        (report.sitemap.newUnmapped.length > 0 ||
          report.sitemap.confirmedRemoved.length > 0) && (
          <Panel
            title="Nav drift"
            description="Compared against the site's sitemap, which is the only way to notice pages that were added or removed rather than edited."
          >
            {report.sitemap.confirmedRemoved.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-400">
                  Removed upstream
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  These 404 on the markdown endpoint <em>and</em> are absent
                  from the sitemap. A 404 on its own is more often a site quirk
                  than a deletion, so both signals are required.
                </p>
                <ul className="mt-2 space-y-1">
                  {report.sitemap.confirmedRemoved.map((url) => (
                    <li
                      key={url}
                      className="font-mono text-xs text-slate-600 dark:text-slate-400"
                    >
                      {url}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.sitemap.newUnmapped.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  New upstream, no route here ({report.sitemap.newUnmapped.length})
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  Listed once, then folded into the manifest&apos;s{" "}
                  <code>knownUnmapped</code> so they stop being reported. Prune
                  that list by hand as you add routes.
                </p>
                <ul className="mt-2 space-y-1">
                  {report.sitemap.newUnmapped.map((url) => (
                    <li
                      key={url}
                      className="font-mono text-xs text-slate-600 dark:text-slate-400"
                    >
                      {url}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>
        )}
    </>
  );
}

const OUTCOME_TEXT: Record<string, string> = {
  unchanged: "unchanged",
  changed: "changed",
  new: "stored",
  missing: "404 upstream",
  unstable: "unstable",
  error: "error",
};

function summarize(counts: Record<string, number>): string {
  const parts = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${n} ${OUTCOME_TEXT[k] ?? k}`);
  return parts.length > 0 ? parts.join(" · ") : "nothing checked";
}

/** Formatted server-side — `toLocaleString()` on the client would disagree at hydration. */
function formatStamp(iso: string): string {
  return iso.replace("T", " ").replace(/\.\d+Z$/, " UTC");
}
