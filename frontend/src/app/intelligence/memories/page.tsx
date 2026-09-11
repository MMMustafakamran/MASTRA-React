import { RouteHeader } from "@/components/route-header";
import { SourceCode } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

const TSC_OUTPUT = `$ npx tsc --noEmit        # memory-list.tsx with the @ts-expect-error lines removed
src/app/intelligence/memories/memory-list.tsx: error TS2305:
  Module '"@copilotkit/react-core"' has no exported member 'useMemories'.
src/app/intelligence/memories/memory-list.tsx: error TS7006:
  Parameter 'memory' implicitly has an 'any' type.`;

const PROBE = `As documented   GET  /api/copilotkit-threads/memories   → 404 {"error":"Not found"}  (runtime gate)
(Intelligence   POST /api/copilotkit-threads/memories   → 404
 Quickstart     useMemories() in the browser:
 runtime)         locally (no COPILOTKIT_LICENSE_TOKEN → /info mode "sse", no intelligence.wsUrl)
                  the hook never sends a request: isAvailable TRUE · list empty ·
                  Save → "Runtime URL is not configured"

memory.access   GET  /api/copilotkit-memory/memories    → 403 MEMORY_NOT_ENTITLED (platform)
                POST /api/copilotkit-memory/memories    → 403
                useMemories(): isAvailable TRUE · list renders empty · Save → "Request failed: 403"

Both            realtimeStatus stays "connecting" for the whole session
Chat            "Got it! I'll keep the updates concise." — nothing was saved`;

export default function Page() {
  return (
    <>
      <RouteHeader path="/intelligence/memories" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Long-term memory: short statements about a user or project that
          outlive any one thread and are recalled into later ones. The page
          explains the model (three kinds, two scopes, supersede-not-patch,
          retire-not-delete), how access is entitled, and how to read and write
          memories from React, REST and MCP. This route runs its React half
          against this repo&apos;s real Intelligence runtimes.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Please remember that I prefer concise status updates."]}
            expect="Per the page: the list shows this user's memories, and Save adds one."
            fail="What actually happens — see below: the save fails on both runtimes, the list is empty, and the agent claims it will remember anyway."
          />
        </div>
      </Panel>

      <Callout tone="warn" title="The React snippet imports a hook that is not there">
        <code>import {"{ useMemories }"} from &quot;@copilotkit/react-core&quot;</code>{" "}
        — the package root is the v1 surface and has no such export, on the
        lockfile&apos;s 1.66.2 or CI&apos;s 1.71.0. It ships only from{" "}
        <code>@copilotkit/react-core/v2</code>. Under Next 16 a missing named
        export is a Turbopack compile error, so a route that imports the file
        does not build at all. The verbatim file is kept, errors acknowledged,
        and imported by nothing; the demo runs the same component with the
        import moved to <code>/v2</code>.
        <pre className="mt-3 overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
          {TSC_OUTPUT}
        </pre>
      </Callout>

      <Callout tone="warn" title="Set up as the page says, the memory routes 404">
        The page says memory &quot;is not a feature flag&quot; and that{" "}
        <code>isAvailable: false</code> is what an unentitled deployment looks
        like. The runtime has a gate in front of entitlement: every{" "}
        <code>/memories/*</code> route 404s at the runtime unless it is built
        with <code>memory: {"{ access }"}</code> (or the deprecated{" "}
        <code>exposeMemoryRoutes: true</code>) — present on 1.66.2 and 1.71.0
        alike. The page never mentions either. This repo&apos;s Intelligence
        Quickstart runtime (<code>/api/copilotkit-threads</code>) answers{" "}
        <code>404 Not found</code> to both a list and a save.
      </Callout>

      <Callout tone="warn" title="…and the hook reports memory as available anyway">
        Neither runtime ever makes the hook say <code>isAvailable: false</code>.
        With the routes opened (the second runtime on the demo), the platform
        answers <code>403 MEMORY_NOT_ENTITLED</code> for this project. The hook
        flips <code>isAvailable</code> only on a 404, 422 or 501 from the list
        call (<code>@copilotkit/core</code> 1.71.0), so it reports{" "}
        <code>true</code>, and the page&apos;s <code>MemoryList</code> — which
        never reads <code>error</code> — renders an empty list. On the
        documented runtime in a local run it is worse: without{" "}
        <code>COPILOTKIT_LICENSE_TOKEN</code> this repo builds that runtime
        without Intelligence, <code>/info</code> carries no{" "}
        <code>intelligence.wsUrl</code>, and the client never sends a memory
        request at all — <code>isAvailable</code> stays <code>true</code>, the
        list is empty, and Save fails with &quot;Runtime URL is not
        configured&quot;, though a runtime URL is configured. (CI sets the
        license token, so there the documented runtime is Intelligence-mode and
        the client reaches the 404 above.)
      </Callout>

      <Callout tone="warn" title="Smaller gaps">
        <code>realtimeStatus</code> stayed <code>connecting</code> on both
        runtimes and never reached the <code>unavailable</code> the page
        describes. The page shows reading and forgetting from React but never
        saving, though the hook has <code>addMemory</code>; saving is shown only
        over REST and MCP. The REST examples post to{" "}
        <code>https://your-deployment</code> without saying that managed users
        call <code>api.intelligence.copilotkit.ai</code>. And the agent answers
        &quot;Got it! I&apos;ll keep the updates concise.&quot; — it has no
        memory tools here, and nothing tells the user nothing was saved.
      </Callout>

      <Panel title="What the demo observed (1.71.0, local)">
        <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
          {PROBE}
        </pre>
      </Panel>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/intelligence/memories/memory-list.tsx" />
        <div className="mt-4">
          <SourceCode file="frontend/src/app/api/copilotkit-memory/[[...slug]]/route.ts" />
        </div>
        <div className="mt-4">
          <SourceCode file="frontend/src/app/intelligence/memories/demo-chat/page.tsx" />
        </div>
      </Panel>
    </>
  );
}
