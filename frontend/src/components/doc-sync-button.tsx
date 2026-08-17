"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { runDocSync } from "@/lib/doc-sync/actions";
import type { SyncResult } from "@/lib/doc-sync/types";

/**
 * The one control the whole feature hangs off. Rendered on both `/` and
 * `/doc-sync`; the action's `refresh()` re-renders whichever one you clicked
 * from, so the panel underneath updates in the same response that returns the
 * summary below the button.
 *
 * The action must be dispatched inside a transition — that is what lets React
 * keep the page interactive while ~35 fetches are in flight, and it is what
 * makes `refresh()`'s re-render arrive as a seeded navigation rather than a
 * second roundtrip.
 */
export function DocSyncButton({ baseline }: { baseline: boolean }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SyncResult | null>(null);

  const label = baseline ? "Create doc baseline" : "Sync docs now";

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setResult(await runDocSync());
          })
        }
        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        {pending && (
          <span
            aria-hidden
            className="size-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"
          />
        )}
        {pending ? "Fetching docs…" : label}
      </button>

      {result && !pending && (
        <p
          className={`max-w-xs text-right text-xs ${
            result.ok
              ? "text-slate-600 dark:text-slate-400"
              : "text-rose-700 dark:text-rose-400"
          }`}
        >
          {result.message}{" "}
          {result.ok && result.changed > 0 && (
            <Link
              href="/doc-sync"
              className="text-[var(--accent)] underline underline-offset-4"
            >
              See the diffs
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
