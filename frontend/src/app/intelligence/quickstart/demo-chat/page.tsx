"use client";

import { CopilotChat } from "@copilotkit/react-core/v2";
import { useState } from "react";

import { DemoFrame } from "@/components/demo-frame";
import { SingleEndpointProvider } from "@/components/single-endpoint-provider";

/**
 * The single-route transport, and a probe for the claim attached to it.
 *
 * The chat below runs entirely through `POST /api/copilotkit-single`. Nothing
 * about the conversation looks different — that part of the step works.
 *
 * The probe is here because the doc's sentence introducing the step is broader
 * than the endpoint: "It carries chat, thread, memory, and annotation requests
 * through one `POST` endpoint." Three of those four are checkable from the
 * browser in one click each, so the button sends the envelope and prints
 * whatever comes back.
 */

const PROBES = [
  {
    method: "info",
    claim: "negotiation",
    note: "Sent by the client itself on connect.",
  },
  {
    method: "agent/run",
    claim: "chat",
    note: "What the chat below uses.",
  },
  { method: "threads/list", claim: "thread", note: "Doc: thread requests." },
  { method: "memories/list", claim: "memory", note: "Doc: memory requests." },
  { method: "annotate", claim: "annotation", note: "Doc: annotation requests." },
] as const;

type Result = { status: number; body: string };

function ProbePanel() {
  const [results, setResults] = useState<Record<string, Result>>({});
  const [busy, setBusy] = useState(false);

  async function runProbes() {
    setBusy(true);
    const next: Record<string, Result> = {};
    for (const probe of PROBES) {
      try {
        const response = await fetch("/api/copilotkit-single", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ method: probe.method, params: {}, body: {} }),
        });
        next[probe.method] = {
          status: response.status,
          body: (await response.text()).slice(0, 240),
        };
      } catch (error) {
        next[probe.method] = { status: 0, body: String(error) };
      }
    }
    setResults(next);
    setBusy(false);
  }

  return (
    <div className="shrink-0 border-b border-slate-200 p-3 dark:border-slate-800">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runProbes}
          disabled={busy}
          className="rounded-md border border-[var(--accent)] px-3 py-1.5 text-sm text-[var(--accent)] disabled:opacity-50"
        >
          {busy ? "Probing…" : "Probe the envelope methods"}
        </button>
        <p className="text-xs text-slate-500">
          POSTs <code>{'{ method, params, body }'}</code> to{" "}
          <code>/api/copilotkit-single</code>, once per documented request class.
        </p>
      </div>

      {Object.keys(results).length > 0 && (
        <table className="mt-3 w-full text-left text-xs">
          <thead className="text-slate-500">
            <tr>
              <th className="py-1 pr-3 font-medium">Doc claim</th>
              <th className="py-1 pr-3 font-medium">method</th>
              <th className="py-1 pr-3 font-medium">Status</th>
              <th className="py-1 font-medium">Response</th>
            </tr>
          </thead>
          <tbody className="align-top font-mono text-slate-700 dark:text-slate-300">
            {PROBES.map((probe) => {
              const result = results[probe.method];
              if (!result) return null;
              const ok = result.status !== 400 && result.status !== 404;
              return (
                <tr
                  key={probe.method}
                  className="border-t border-slate-200 dark:border-slate-800"
                >
                  <td className="py-1 pr-3 font-sans">{probe.claim}</td>
                  <td className="py-1 pr-3">{probe.method}</td>
                  <td
                    className={`py-1 pr-3 ${
                      ok
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-rose-700 dark:text-rose-400"
                    }`}
                  >
                    {result.status}
                  </td>
                  <td className="py-1 break-all">{result.body}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <DemoFrame
      parentPath="/intelligence/quickstart"
      subtitle="single-route transport · /api/copilotkit-single"
    >
      <SingleEndpointProvider>
        <div className="flex h-full flex-col">
          <ProbePanel />
          <div className="min-h-0 flex-1">
            {/* [3] intelligence quickstart: chat over the single endpoint */}
            {/* [!code highlight] */}
            <CopilotChat agentId="myAgent" />
          </div>
        </div>
      </SingleEndpointProvider>
    </DemoFrame>
  );
}
