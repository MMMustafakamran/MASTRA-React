import Link from "next/link";

import { StatusBadge } from "@/components/route-header";
import { Panel } from "@/components/ui";
import { DOCS_ROOT, DOC_SYNC_DATE, NAV, demoPath, docUrl } from "@/lib/nav-config";

export default function Page() {
  return (
    <>
      <header className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Status overview
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
          Every doc page tracked by this harness, its route, and where it stands.
          This mirrors the checklist in the repo README.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Synced against{" "}
          <a
            href={DOCS_ROOT}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--accent)] underline underline-offset-4"
          >
            the live docs
          </a>{" "}
          on {DOC_SYNC_DATE}.
        </p>
      </header>

      {NAV.map((group) => (
        <Panel key={group.title} title={group.title}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800">
                  <th className="pb-2 pr-4 font-medium">Route</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">Doc page</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {group.routes.map((route) => (
                  <tr key={route.path} className="align-top">
                    <td className="py-3 pr-4">
                      <Link
                        href={route.path}
                        className="font-medium text-[var(--accent)] underline underline-offset-4"
                      >
                        {route.title}
                      </Link>
                      <p className="mt-0.5 font-mono text-xs text-slate-500">
                        {route.path}
                      </p>
                      {demoPath(route) && (
                        <Link
                          href={demoPath(route)!}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-xs text-slate-500 underline underline-offset-4 hover:text-[var(--accent)]"
                        >
                          demo ↗
                        </Link>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={route.status} />
                      {route.statusNote && (
                        <p className="mt-1 max-w-xs text-xs text-slate-500">
                          {route.statusNote}
                        </p>
                      )}
                    </td>
                    <td className="py-3">
                      <a
                        href={docUrl(route)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-slate-600 underline underline-offset-4 dark:text-slate-400"
                      >
                        {route.docPath}
                      </a>
                      {route.offNav && (
                        <p className="mt-1 text-xs text-sky-700 dark:text-sky-400">
                          Resolves, but absent from the doc sidebar.
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ))}
    </>
  );
}
