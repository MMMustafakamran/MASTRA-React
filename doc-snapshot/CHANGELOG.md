# Doc drift changelog

What the CopilotKit docs changed under this repo, written by the sync on
`/doc-sync`. Only pages that actually moved are recorded — a sync that finds
everything unchanged writes nothing here at all.

Holds the 3 most recent dated entries. When a change lands on a fourth
date, the oldest entry is dropped. Entries are counted, not aged, so a gap of
weeks between changes does not expire anything.

## 2026-08-26

### 15:05 UTC — 3 pages, highest severity high

**High — Quickstart**

`/mastra/quickstart` · route `/quickstart` · under “Setup Copilot Runtime” · in a `ts` block

63 code lines, 34 prose lines changed. The number of fenced code blocks changed.

The guide now runs Mastra as its own process and reaches it over HTTP, instead
of importing the instance into the runtime route. `getLocalAgents` is kept as a
documented alternative for an embedded instance — which is the shape this repo
uses.

````diff
- import { MastraAgent } from "@ag-ui/mastra"
- import { mastra } from "@/mastra"; // the path to your Mastra instance
+ import { MastraAgent } from "@ag-ui/mastra";
+ import { MastraClient } from "@mastra/client-js";
- agents: MastraAgent.getLocalAgents({ mastra }),
+ agents: ({ request }) =>
+ MastraAgent.getRemoteAgents({
+ mastraClient,
+ resourceId: request.headers.get("x-user-id") ?? "anonymous",
+ }),
+ intelligence: new CopilotKitIntelligence({
+ apiKey: process.env.INTELLIGENCE_API_KEY!,
+ }),
````

**High — Copilot Runtime**

`/mastra/copilot-runtime` · route `/copilot-runtime` · under “Local vs remote agents”

103 code lines, 7 prose lines changed. The number of fenced code blocks changed.

A new section decides local vs remote by where the agent already runs, documents
`getRemoteAgents` as async (pass a factory, not the promise), and records that
`untilIdle` and `requestContext` have no remote equivalent.

````diff
+ ## Local vs remote agents
+ - **Remote** — your Mastra instance already runs as its own process (`mastra dev`,
+ a container, a deployed service). **Choose this for any project that
+ already runs a Mastra service.**
+ - **Local** — your Mastra instance lives inside the same process as the runtime
+ route, and you import it directly.
+ `getLocalAgents` is synchronous and takes the `Mastra` instance itself instead of
+ a client. It also accepts `requestContext` and `untilIdle`, neither of which has a
+ remote equivalent
- ### Enterprise Intelligence Platform
+ ### CopilotKit Intelligence
````

**Low — AG-UI**

`/mastra/ag-ui` · route `/ag-ui` · under “Why the runtime sits in front”

1 prose line changed.

````diff
- routing, and CopilotKit Enterprise Intelligence without changing how the
+ routing, and CopilotKit Intelligence without changing how the
````

---

## 2026-08-24

### 13:19 UTC — 3 pages, highest severity high

**High — Copilot Runtime**

`/mastra/copilot-runtime` · route `/copilot-runtime` · under “Setting Up the Runtime”

41 code lines, 13 prose lines changed. The number of fenced code blocks changed.

````diff
- The runtime is a lightweight server endpoint that you add to your backend. Here's a minimal example using Next.js:
+ The runtime is a lightweight server endpoint that you add to your backend:
- ```ts title="app/api/copilotkit/route.ts"
+ ```npm
+ npm install @copilotkit/runtime
+ ```
+ 
+ Here's a minimal example using Next.js. `createCopilotRuntimeHandler` returns a
````

**High — Quickstart**

`/mastra/quickstart` · route `/quickstart` · under “Setup Copilot Runtime” · in a `ts` block

28 code lines changed.

````diff
- ```ts title="app/api/copilotkit/route.ts"
+ ```ts title="app/api/copilotkit/[[...slug]]/route.ts"
- ExperimentalEmptyAdapter,
- copilotRuntimeNextJSAppRouterEndpoint,
- } from "@copilotkit/runtime";
- import { NextRequest } from "next/server";
+ createCopilotRuntimeHandler,
+ InMemoryAgentRunner,
````

**Low — Inspector**

`/mastra/inspector` · route `/inspector` · under “What it shows”

14 prose lines changed.

````diff
- The CopilotKit Inspector is a built-in debugging tool that overlays on your app, giving you full visibility into what's happening between your frontend and your agents in real time.
+ The CopilotKit Inspector is a built-in debugging tool that overlays on your app.
+ The first open lands on **Home**. Later opens return to the last pane you used.
+ | **Home** | Project, runtime, services, and CopilotKit news. |
+ | **Memory** | Inspect long-term memory when Intelligence exposes it. |
- The primary navigation groups the Inspector into **Threads**, **Agents**, and
- **Learning**. Threads is the default. Open a real Thread to inspect its
+ The sidebar has three groups: **Home**, **Workbench** (Threads, Memory), and
````

---

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

---
