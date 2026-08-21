# Doc drift changelog

What the CopilotKit docs changed under this repo, written by the sync on
`/doc-sync`. Only pages that actually moved are recorded — a sync that finds
everything unchanged writes nothing here at all.

Holds the 3 most recent dated entries. When a change lands on a fourth
date, the oldest entry is dropped. Entries are counted, not aged, so a gap of
weeks between changes does not expire anything.

## 2026-08-21

### 18:38 UTC — 2 pages, highest severity medium

**Low — Inspector**

`/mastra/inspector` · route `/inspector` · under “Showing or hiding the Inspector”

7 prose lines changed.

````diff
+ `NEXT_PUBLIC_COPILOTKIT_LICENSE_KEY` is a browser-visible publishable key and is
+ a **different credential** from the server-side `INTELLIGENCE_API_KEY` that
+ `copilotkit project select` writes into your `.env`. The server-side key is
+ consumed by the `CopilotKitIntelligence` client described in
+ [Runtime endpoints](/mastra/backend/runtime-endpoints). Do not substitute one for the
+ other, and never expose the server-side key to the browser.
+ 
````

**Medium — Quickstart**

`/mastra/quickstart` · route `/quickstart` · under “🎉 Start chatting!”

1 heading, 13 prose lines changed.

````diff
+ 
+ <Step>
+ ### Open Inspector and confirm setup
+ 
+ On localhost, click the Inspector button in the corner of the app.
+ 
+ 1. Open **Agents**, then **Agent**. Your agent is listed.
+ 2. Send a chat message. Open **Agents**, then **AG-UI Events**. Events are moving.
````

---

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
