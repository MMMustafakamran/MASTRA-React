"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { NAV, type RouteStatus } from "@/lib/nav-config";

const DOT: Record<RouteStatus, string> = {
  working: "bg-emerald-500",
  partial: "bg-amber-500",
  reference: "bg-slate-400",
  broken: "bg-rose-500",
  "not-started": "bg-slate-300 dark:bg-slate-600",
};

export function NavSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="space-y-6 p-4">
      <div>
        <Link
          href="/"
          className="block text-sm font-semibold text-slate-900 dark:text-slate-100"
          onClick={() => setOpen(false)}
        >
          CopilotKit + Mastra
        </Link>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Test harness
        </p>
        <Link
          href="/status"
          onClick={() => setOpen(false)}
          className={`mt-3 inline-block rounded-md border px-2.5 py-1 text-xs font-medium ${
            pathname === "/status"
              ? "border-[var(--accent)] text-[var(--accent)]"
              : "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"
          }`}
        >
          Status overview
        </Link>
      </div>

      {NAV.map((group) => (
        <div key={group.title}>
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {group.title}
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {group.routes.map((route) => {
              const active = pathname === route.path;
              return (
                <li key={route.path}>
                  <Link
                    href={route.path}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                      active
                        ? "bg-slate-100 font-medium text-slate-900 dark:bg-slate-800 dark:text-slate-50"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[route.status]}`}
                      aria-hidden
                    />
                    <span className="min-w-0 truncate">{route.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed left-3 top-3 z-50 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm lg:hidden dark:border-slate-700 dark:bg-slate-900"
        aria-expanded={open}
      >
        {open ? "Close" : "Menu"}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 overflow-y-auto border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-950 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-12 lg:h-0" />
        {nav}
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
        />
      )}
    </>
  );
}
