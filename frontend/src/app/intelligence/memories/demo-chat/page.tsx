"use client";

import {
  CopilotChat,
  CopilotKitProvider,
  useMemories,
} from "@copilotkit/react-core/v2";
import { useState } from "react";

import { DemoFrame } from "@/components/demo-frame";

/**
 * Memories & Recall, against this repo's real Intelligence runtimes.
 *
 * Memory is an Intelligence surface, so the "documented" runtime here is the
 * one the Intelligence Quickstart builds — `lib/intelligence-runtime.ts`,
 * mounted multi-route at `/api/copilotkit-threads` (the memory routes are REST,
 * so the single-route mount could not serve them at all). The app-wide
 * `/api/copilotkit` is not an Intelligence runtime in this repo. Whether the
 * routes answer is the page's own question — "Activating memory": the
 * deployment has to be entitled, and an unentitled one looks like
 * `isAvailable: false` from the client.
 *
 * Left panel: the page's `MemoryList`, with the one change it needs to load —
 * the import moved from `@copilotkit/react-core` to `/v2`. The verbatim file is
 * `../memory-list.tsx`, which does not compile; see there.
 *
 * Right panel: the hook's other fields, which the page names but its component
 * does not show (`realtimeStatus`, `error`), plus a save. The page teaches saving
 * over REST and MCP only; the hook's `addMemory` is the React route it does not
 * mention. The content and kind are the page's own curl example.
 */

// [2] memories: the page's component, import moved to /v2
function MemoryList() {
  const { memories, isLoading, isAvailable, removeMemory } = useMemories();

  if (!isAvailable) return <p>Memory is not available for this runtime.</p>;
  if (isLoading) return <p>Loading memories…</p>;

  return (
    <ul>
      {memories.map((memory) => (
        <li key={memory.id}>
          {memory.content}
          <button type="button" onClick={() => void removeMemory(memory.id)}>
            Forget
          </button>
        </li>
      ))}
    </ul>
  );
}

function MemoryProbe() {
  const { memories, isLoading, isAvailable, realtimeStatus, error, addMemory, refresh } =
    useMemories();
  const [saveResult, setSaveResult] = useState<string | null>(null);

  async function saveExample() {
    setSaveResult("saving…");
    try {
      // [3] memories: save the page's example memory
      const saved = await addMemory({
        content: "Prefers concise status updates.",
        kind: "operational",
      });
      setSaveResult(`saved · id ${saved.id}`);
    } catch (e) {
      setSaveResult(`failed · ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const rows: [string, string][] = [
    ["isAvailable", String(isAvailable)],
    ["isLoading", String(isLoading)],
    ["realtimeStatus", realtimeStatus],
    ["memories", String(memories.length)],
    ["error", error ? error.message : "null"],
  ];

  return (
    <div>
      <table data-testid="memory-probe" className="w-full text-left text-xs">
        <tbody className="font-mono">
          {rows.map(([k, v]) => (
            <tr key={k} className="border-t border-slate-200 first:border-0 dark:border-slate-800">
              <th className="w-36 py-1 pr-3 font-medium text-slate-500">{k}</th>
              <td data-testid={`memory-${k}`} className="py-1 break-all">
                {v}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid="memory-save"
          onClick={() => void saveExample()}
          className="rounded-md border border-[var(--accent)] px-3 py-1.5 text-sm text-[var(--accent)]"
        >
          Save “Prefers concise status updates.”
        </button>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300"
        >
          Refresh
        </button>
      </div>
      {saveResult && (
        <p data-testid="memory-save-result" className="mt-2 font-mono text-xs break-all">
          {saveResult}
        </p>
      )}
    </div>
  );
}

const RUNTIMES = {
  documented: {
    label: "As documented · /api/copilotkit-threads",
    url: "/api/copilotkit-threads",
    note: "The runtime the Intelligence Quickstart builds. The page adds nothing to it.",
  },
  "memory-access": {
    label: "With memory.access · /api/copilotkit-memory",
    url: "/api/copilotkit-memory",
    note: "Same runtime plus the `memory: { access }` option the page never mentions.",
  },
} as const;
type RuntimeKey = keyof typeof RUNTIMES;

function Panels({ runtime }: { runtime: RuntimeKey }) {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-slate-200 px-3 pt-3 text-xs text-slate-500 dark:border-slate-800">
        <p data-testid="memory-runtime">{RUNTIMES[runtime].note}</p>
        <div className="grid gap-4 py-3 text-sm md:grid-cols-2">
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              The page&apos;s MemoryList (import → /v2)
            </h2>
            <div data-testid="memory-list">
              <MemoryList />
            </div>
          </section>
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              What the hook reports
            </h2>
            <MemoryProbe />
          </section>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        {/* Both runtimes register `default` (→ myAgent), so the bare chat resolves. */}
        <CopilotChat />
      </div>
    </div>
  );
}

export default function Page() {
  const [runtime, setRuntime] = useState<RuntimeKey>("documented");

  return (
    <DemoFrame parentPath="/intelligence/memories" subtitle="useMemories · two runtimes">
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 gap-2 border-b border-slate-200 p-3 dark:border-slate-800">
          {(Object.keys(RUNTIMES) as RuntimeKey[]).map((key) => (
            <button
              key={key}
              type="button"
              data-testid={`memory-runtime-${key}`}
              onClick={() => setRuntime(key)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                key === runtime
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"
              }`}
            >
              {RUNTIMES[key].label}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1">
          {/* Nested in the app-wide provider; keyed so each runtime gets a fresh core. */}
          <CopilotKitProvider
            key={runtime}
            runtimeUrl={RUNTIMES[runtime].url}
            useSingleEndpoint={false}
            headers={{ "x-copilotkit-user-id": "demo-user" }}
          >
            <Panels runtime={runtime} />
          </CopilotKitProvider>
        </div>
      </div>
    </DemoFrame>
  );
}
