"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { NavSidebar } from "./nav-sidebar";

/**
 * Decides whether a route gets the app shell.
 *
 * `/…/demo-chat` routes render full-bleed with no sidebar or padding, so they
 * can be screen-recorded without the harness chrome in frame. Everything else
 * gets the normal sidebar layout.
 *
 * Doing this here — rather than with a second root layout — keeps the whole app
 * under one `CopilotKitProvider`, so a demo route continues the same
 * conversation as the page it was opened from.
 */
export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDemo = pathname?.endsWith("/demo-chat") ?? false;

  if (isDemo) {
    return <div className="h-dvh overflow-hidden">{children}</div>;
  }

  return (
    <>
      <NavSidebar />
      <main className="lg:pl-72">
        <div className="mx-auto max-w-5xl space-y-6 px-5 py-10 lg:px-8">
          {children}
        </div>
      </main>
    </>
  );
}
