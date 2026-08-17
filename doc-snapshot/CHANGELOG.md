# Doc drift changelog

What the CopilotKit docs changed under this repo, written by the sync on
`/doc-sync`. Only pages that actually moved are recorded — a sync that finds
everything unchanged writes nothing here at all.

Holds the 3 most recent dated entries. When a change lands on a fourth
date, the oldest entry is dropped. Entries are counted, not aged, so a gap of
weeks between changes does not expire anything.

## 2026-08-17

### 13:44 UTC — 2 pages, highest severity high

**High — Copilot Runtime** · _local snapshot edit, not an upstream change_

`/mastra/copilot-runtime` · route `/copilot-runtime` · under “Setting Up the Runtime” · in a `ts` block

6 code lines changed.

````diff
- 
+ const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
+ runtime,
+ serviceAdapter,
+ endpoint: "/api/copilotkit",
+ });
````

**Low — Inspector** · _local snapshot edit, not an upstream change_

`/mastra/inspector` · route `/inspector` · under “Navigation and Threads”

3 prose lines changed.

````diff
+ When Threads has no real rows, or when Threads is locked, the Inspector keeps
+ the overview video, three local example threads, their detail tabs, and the
+ guided tour. The examples do not send real Thread requests. With reduced motion
````
