import Link from "next/link";

import { docUrl, findRoute } from "@/lib/nav-config";

/**
 * Chrome for a `/demo-chat` route: a thin bar, then the demo filling the rest
 * of the viewport.
 *
 * Kept deliberately minimal — these routes exist to be screen-recorded, so the
 * bar is one line and everything below it is the thing being demonstrated.
 */
export function DemoFrame({
  parentPath,
  children,
  subtitle,
}: {
  /** The doc route this demo belongs to. */
  parentPath: string;
  children: React.ReactNode;
  subtitle?: string;
}) {
  const route = findRoute(parentPath);

  return (
    <div className="flex h-dvh flex-col bg-white dark:bg-slate-950">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-slate-200 px-4 py-2 dark:border-slate-800">
        <div className="flex min-w-0 items-baseline gap-2">
          <h1 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {route?.title ?? "Demo"}
          </h1>
          {subtitle && (
            <span className="truncate text-xs text-slate-500">{subtitle}</span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 text-xs">
          <Link
            href={parentPath}
            className="text-slate-500 underline underline-offset-4 hover:text-slate-800 dark:hover:text-slate-200"
          >
            ← Notes &amp; source
          </Link>
          {route && (
            <a
              href={docUrl(route)}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--accent)] underline underline-offset-4"
            >
              Doc ↗
            </a>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
