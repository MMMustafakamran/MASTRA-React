import Link from "next/link";

import {
  STATUS_LABEL,
  demoPath,
  docUrl,
  findRoute,
  type RouteStatus,
} from "@/lib/nav-config";

const STATUS_STYLES: Record<RouteStatus, string> = {
  working:
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
  partial:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
  reference:
    "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  broken:
    "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200",
  "not-started":
    "border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400",
};

export function StatusBadge({ status }: { status: RouteStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/**
 * Every route renders this. It resolves its own metadata from the path so a
 * page can never drift from the nav or the status table.
 */
export function RouteHeader({ path }: { path: string }) {
  const route = findRoute(path);
  const demo = route ? demoPath(route) : undefined;

  if (!route) {
    return (
      <header className="border-b border-rose-300 pb-4">
        <p className="text-sm text-rose-700">
          No nav entry registered for <code>{path}</code>.
        </p>
      </header>
    );
  }

  return (
    <header className="border-b border-slate-200 pb-5 dark:border-slate-800">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          {route.title}
        </h1>
        <StatusBadge status={route.status} />
        {route.offNav && (
          <span className="inline-flex items-center rounded-full border border-sky-300 bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-200">
            Not in doc sidebar
          </span>
        )}
      </div>

      <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
        {route.summary}
      </p>

      {route.statusNote && (
        <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-500">
          {route.statusNote}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        {demo && (
          // Always a new tab: the demo route is chrome-free and meant to be
          // recorded or watched on its own, so it should not replace the notes
          // you opened it from.
          <Link
            href={demo}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-[var(--accent)] px-3 py-1.5 font-medium text-white"
          >
            Open demo ↗
          </Link>
        )}
        <a
          href={docUrl(route)}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-[var(--accent)] underline underline-offset-4"
        >
          Doc page being tested ↗
        </a>
        <Link
          href="/status"
          className="text-slate-500 underline underline-offset-4 hover:text-slate-800 dark:hover:text-slate-200"
        >
          All statuses
        </Link>
      </div>

      
    </header>
  );
}
