import type { ReactNode } from "react";

import { CodeFigure } from "./code-figure";

/** Small presentational primitives shared by every route. */

export function Panel({
  title,
  description,
  children,
  className = "",
  actions,
}: {
  title?: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-3 dark:border-slate-800">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warn" | "premium" | "success";
  title?: string;
  children: ReactNode;
}) {
  const tones = {
    info: "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100",
    warn: "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
    premium:
      "border-violet-300 bg-violet-50 text-violet-950 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-100",
    success:
      "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
  } as const;

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? "mt-1" : ""}>{children}</div>
    </div>
  );
}

/**
 * An inline snippet — code written in the page rather than read off disk.
 *
 * Shares `CodeFigure` with `SourceCode` so both look and highlight the same.
 * Async for the same reason: highlighting is. Every caller is a server
 * component.
 */
export async function CodeBlock({
  code,
  filename,
  language,
}: {
  code: string;
  filename?: string;
  language?: string;
}) {
  return (
    <CodeFigure
      code={code}
      caption={filename}
      language={language}
      scroll="inline"
    />
  );
}

/**
 * The concrete thing a tester should type, and what should happen. Every
 * interactive route carries one so pass/fail is unambiguous.
 */
export function TryIt({
  prompts,
  expect,
  fail,
}: {
  prompts: string[];
  expect: ReactNode;
  fail?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Try it
      </p>
      <ul className="mt-2 space-y-1.5">
        {prompts.map((p) => (
          <li key={p}>
            <code className="rounded bg-white px-2 py-1 text-xs text-slate-800 shadow-sm dark:bg-slate-950 dark:text-slate-200">
              {p}
            </code>
          </li>
        ))}
      </ul>
      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="shrink-0 font-semibold text-emerald-700 dark:text-emerald-400">
            Pass:
          </dt>
          <dd className="text-slate-700 dark:text-slate-300">{expect}</dd>
        </div>
        {fail && (
          <div className="flex gap-2">
            <dt className="shrink-0 font-semibold text-rose-700 dark:text-rose-400">
              Fail:
            </dt>
            <dd className="text-slate-700 dark:text-slate-300">{fail}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

export function KeyValue({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(0,10rem)_1fr] gap-x-4 gap-y-2 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="font-medium text-slate-500 dark:text-slate-400">{k}</dt>
          <dd className="min-w-0 break-words text-slate-800 dark:text-slate-200">
            {v}
          </dd>
        </div>
      ))}
    </dl>
  );
}

