import type { Hunk, PageOutcome, PageReport, Severity } from "@/lib/doc-sync/types";

/**
 * Rendering for a single page's diff.
 *
 * Deliberately not Shiki-highlighted, unlike every other code surface in this
 * app: the `+`/`-` gutter characters and interleaved old/new lines are not
 * valid input to any grammar, so highlighting them produces confidently wrong
 * colours. Line tints carry the meaning instead.
 */

const SEVERITY_STYLES: Record<Severity, string> = {
  high: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200",
  medium:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
  low: "border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-200",
  none: "border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400",
};

const SEVERITY_LABEL: Record<Severity, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "None",
};

/** Mirrors `StatusBadge` in `route-header.tsx` without widening `RouteStatus`. */
export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${SEVERITY_STYLES[severity]}`}
    >
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

const OUTCOME_LABEL: Record<PageOutcome, string> = {
  unchanged: "Unchanged",
  changed: "Changed",
  new: "New",
  missing: "404 upstream",
  unstable: "Unstable",
  error: "Error",
};

const OUTCOME_MARK: Record<PageOutcome, { glyph: string; className: string }> = {
  unchanged: { glyph: "✓", className: "text-emerald-600 dark:text-emerald-400" },
  changed: { glyph: "!", className: "text-amber-600 dark:text-amber-400" },
  new: { glyph: "+", className: "text-sky-600 dark:text-sky-400" },
  missing: { glyph: "✗", className: "text-rose-600 dark:text-rose-400" },
  unstable: { glyph: "~", className: "text-amber-600 dark:text-amber-400" },
  error: { glyph: "✗", className: "text-rose-600 dark:text-rose-400" },
};

/**
 * The per-section check mark. `outcome` is undefined for a route whose doc page
 * was not part of the last run — rendered as a neutral dot rather than a tick,
 * because "not checked" and "checked and fine" must never look alike.
 */
export function CheckMark({ outcome }: { outcome?: PageOutcome }) {
  const mark = outcome
    ? OUTCOME_MARK[outcome]
    : { glyph: "·", className: "text-slate-400 dark:text-slate-600" };

  return (
    <span
      aria-label={outcome ? OUTCOME_LABEL[outcome] : "Not checked"}
      title={outcome ? OUTCOME_LABEL[outcome] : "Not checked"}
      className={`inline-flex w-4 shrink-0 justify-center font-mono text-sm font-semibold ${mark.className}`}
    >
      {mark.glyph}
    </span>
  );
}

function shortHash(hash?: string): string {
  return hash ? hash.slice(0, 12) : "—";
}

function Evidence({ page }: { page: PageReport }) {
  return (
    <dl className="grid grid-cols-[minmax(0,9rem)_1fr] gap-x-4 gap-y-1 text-xs">
      {(
        [
          ["Existing snapshot", shortHash(page.previousSha256)],
          ["Newly fetched", shortHash(page.sha256)],
          ["Size", page.bytes ? `${page.bytes} bytes · ${page.lines} lines` : "—"],
        ] as [string, string][]
      ).map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
          <dd className="font-mono break-all text-slate-700 dark:text-slate-300">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * What expanding a section row shows: the comparison between the copy that was
 * already stored and the one just pulled.
 *
 * When a page is unchanged there is by definition nothing to render as a diff,
 * so it shows the matching hashes instead. That is the evidence the check
 * actually happened, which is the point of listing every page rather than only
 * the broken ones.
 */
export function PageComparison({ page }: { page?: PageReport }) {
  if (!page) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-400">
        This doc page was not part of the last run.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {page.error && (
        <p className="text-sm text-amber-700 dark:text-amber-400">{page.error}</p>
      )}

      {page.outcome === "unchanged" && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Identical — the page fetched just now hashes the same as the stored
          copy, so nothing on this route needs re-checking.
        </p>
      )}

      {page.outcome === "new" && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Stored for the first time. There was no earlier copy to compare
          against, so differences start showing from the next sync.
        </p>
      )}

      {page.outcome === "missing" && (
        <p className="text-sm text-rose-700 dark:text-rose-400">
          The page returned 404. The previously stored copy has been kept, so
          you can still read what it used to say.
        </p>
      )}

      {page.outcome === "unstable" && (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Two reads seconds apart returned different content — a deploy probably
          landed mid-run. This page was left out of the snapshot; sync again.
        </p>
      )}

      {page.snapshotEdited && (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          The stored copy had been changed locally — it no longer matched the
          hash recorded for it. This diff therefore starts from your edited
          copy, not from what was last fetched. Expected if you edited it to
          test; otherwise the snapshot file was corrupted.
        </p>
      )}

      {page.rewritten && (
        <p className="text-sm text-rose-700 dark:text-rose-400">
          Rewritten past the diff cap — read the page itself rather than the
          hunks below.
        </p>
      )}
      {page.fenceCountChanged && (
        <p className="text-sm text-rose-700 dark:text-rose-400">
          The number of fenced code blocks changed — treated as high regardless
          of what the line diff found.
        </p>
      )}
      {page.fenceParseWarning && (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          A code fence was left unclosed at end of file, so the severities below
          are less reliable than usual.
        </p>
      )}

      <Evidence page={page} />

      {page.hunks.length > 0 && (
        <>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono text-rose-700 dark:text-rose-400">−</span>{" "}
            existing snapshot{"   "}
            <span className="font-mono text-emerald-700 dark:text-emerald-400">
              +
            </span>{" "}
            newly fetched
          </p>
          <div className="space-y-3">
            {page.hunks.map((hunk, i) => (
              <HunkView key={i} hunk={hunk} />
            ))}
          </div>
        </>
      )}

      {page.droppedHunks ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {page.droppedHunks} further hunk(s) not shown.
        </p>
      ) : null}
    </div>
  );
}

const LINE_STYLES = {
  add: "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200",
  remove: "bg-rose-50 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200",
  context: "text-slate-500 dark:text-slate-400",
} as const;

const GUTTER = { add: "+", remove: "−", context: " " } as const;

export function HunkView({ hunk }: { hunk: Hunk }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-200 px-3 py-2 text-xs dark:border-slate-800">
        <SeverityBadge severity={hunk.severity} />
        <span className="font-mono text-slate-500 dark:text-slate-400">
          line {hunk.startLine}
        </span>
        {hunk.heading && (
          <span className="text-slate-600 dark:text-slate-400">
            under <span className="font-medium">{hunk.heading}</span>
          </span>
        )}
        {hunk.language && (
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {hunk.language}
          </code>
        )}
        {hunk.truncated && (
          <span className="text-amber-700 dark:text-amber-400">truncated</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <pre className="min-w-full text-xs leading-relaxed">
          {hunk.lines.map((line, i) => (
            <div
              key={i}
              className={`flex gap-2 px-3 ${LINE_STYLES[line.op]}`}
            >
              <span aria-hidden className="select-none opacity-60">
                {GUTTER[line.op]}
              </span>
              <span className="whitespace-pre-wrap break-words">{line.text || " "}</span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
