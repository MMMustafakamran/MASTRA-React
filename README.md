# CopilotKit + Mastra Test Suite

A navigable, working test harness for the CopilotKit Mastra integration — each doc page is a route that actually runs the thing it describes.

| | |
|---|---|
| **Doc sync date** | Machine-maintained — `doc-snapshot/manifest.json` → `syncedAt`, rewritten on every sync |
| **CopilotKit packages** | `@copilotkit/react-core` 1.66.2 · `@copilotkit/runtime` 1.66.2 |
| **AG-UI packages** | `@ag-ui/mastra` 1.1.1 · `@ag-ui/client` 0.0.57 |
| **Mastra packages** | `@mastra/core` 1.56.0 · `@mastra/memory` 1.25.0 · `@mastra/libsql` 1.19.0 |
| **Frontend** | Next.js 16.3.0 (App Router) · React 19.2 · TypeScript · Tailwind 4 |
| **Build status** | No CI. Verified locally: typecheck ✅ · lint ✅ · dev server boots with all 7 agents registered ✅ |

---

## 2. Overview

[Mastra](https://mastra.ai) is a TypeScript agent framework with native AG-UI support, which is what lets a React app drive it with streaming, tool calls, shared state, and generative UI.

This repo covers a **scoped set of 19 doc pages** (§8). Each route implements what its page teaches and shows the exact source that makes it work.

**Everything comes from the documentation.** No agent, tool, instruction, or working-memory schema was invented — the seven agents and three tools are exactly the ones the doc pages define.

Tracks: **<https://docs.copilotkit.ai/mastra>**

---

## 3. Architecture

```
Browser (React 19)
  │  @copilotkit/react-core/v2 — CopilotKitProvider, CopilotChat, hooks
  │  POST /api/copilotkit
  ▼
Next.js 16 App Router  ·  localhost:3000
  │  Copilot Runtime  (@copilotkit/runtime)
  │  agents: MastraAgent.getLocalAgents({ mastra, resourceId, untilIdle })
  ▼
Mastra  —  in the same process
  │  src/mastra/index.ts → 7 agents, working memory in in-memory LibSQL
  ▼
OpenAI  (gpt-4o by default)
```

**There is no separate agent server.** Mastra is TypeScript, and the Quickstart's bring-your-own path imports the Mastra instance directly into the runtime route via `getLocalAgents` — so agents run inside the Next app. One command, one port, and no `backend/` directory.

That is required rather than merely convenient: the Shared State pages state that reading working memory does **not** work against a remote Mastra agent, and four routes here depend on working memory.

### The seven agents

| Agent id | Tools / state | Used by |
|---|---|---|
| `myAgent` | — | Quickstart, Prebuilt Components, Slots, Headless UI, Programmatic Control, Inspector, Display-only, Frontend Tools, HITL, AG-UI |
| `weatherAgent` | `weatherInfo` | Tool Rendering |
| `languageAgent` | working memory: `language` | Shared State read + write |
| `streamingAgent` | working memory: `document` | Predictive State Updates |
| `searchAgent` | `addSearch` · working memory: `searches` | State Rendering |
| `colleaguesContactAgent` | reads `ag-ui` request context | Readables |
| `backgroundAgentsAgent` | `run_deep_research` (background) | Background Tasks |

Seven rather than one because working memory takes a **single Zod schema per agent**, and the docs define three different ones. Agent ids come from the keys in the Mastra instance's `agents: { … }` object, not from each agent's `name` — that is what routes pass as `agentId`.

---

## 4. Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 20+ | Next.js 16 requires 20+. |
| npm | 10+ | Or pnpm/yarn/bun. |
| OpenAI API key | — | Required. |

No Python, no second runtime, no separate agent process.

---

## 5. Setup

```bash
git clone <this-repo> mastra && cd mastra
cd frontend && npm install
cp ../.env.example .env.local
```

### Upgrading Packages Safely
To upgrade packages to their latest versions without breaking peer dependencies:
```bash
cd frontend
npx npm-check-updates --peer -u
npm install
```

Then edit `frontend/.env.local`:

| Variable | What it does |
|---|---|
| `OPENAI_API_KEY` | **Required.** Read server-side by the Mastra agents; never exposed to the browser. |
| `OPENAI_MODEL` | Model for every agent. Defaults to `gpt-4o`. |
| `NEXT_PUBLIC_COPILOTKIT_LICENSE_KEY` | Optional; no route here needs it. |

**Default port:** **3000** — the only one.

---

## 6. Running the project

One process, one terminal.

```bash
cd frontend
npm run dev
```

Success looks like:

```
▲ Next.js 16.3.0
- Local:   http://localhost:3000
✓ Ready in 1.2s
```

Open **<http://localhost:3000>**. If chats fail, the usual cause is a missing `OPENAI_API_KEY` — Next reads `.env.local` at startup, so restart after setting it.

---

## 7. What to expect — walkthrough per section

### How each route is split

| | |
|---|---|
| **`<route>`** | Notes, pass/fail criteria, and **the exact source**, read off disk at render time. No live chat. |
| **`<route>/demo-chat`** | Just the running feature, no chrome — built for screen recording. Reached via **Open demo ↗**, which always opens a new tab. |

Code on a page is never a re-typed approximation: each page reads real files via `src/lib/source.ts` and syntax-highlights them with Shiki at build time. Excerpts use `#region` markers, which stay visible in the source and are labelled with line numbers.

### Getting Started

**`/`** — Orientation and the agent roster.

**`/quickstart`** — Mastra instance bound with `getLocalAgents`. **Try:** `What tools do you have access to?` **Pass:** tokens stream. **Fail:** an error banner — check `OPENAI_API_KEY`.

### Basics

**`/prebuilt-components`** — `CopilotChat`, `CopilotSidebar`, `CopilotPopup` in tabs. **Pass:** all three drive the same agent and the conversation survives tab switches.

### Custom Look and Feel

**`/custom-look-and-feel/slots`** *(live but absent from the doc sidebar)* — Three override levels. **Pass:** level 1 tints the message area, level 2 auto-focuses the input, level 3 shows a custom header, layout, and cursor.

**`/custom-look-and-feel/headless-ui`** *(live but absent from the sidebar)* — A chat with zero CopilotKit chrome. **Pass:** messages stream into hand-written bubbles.

**`/programmatic-control`** — Drives the agent with no chat component. **Pass:** status flips to Running, the transcript grows, Stop halts it.

**`/inspector`** — The debugging overlay, mounted by the provider. **Pass:** the event list fills and Available Agents lists all seven.

### Generative UI

**`/generative-ui/your-components/display-only`** — `useComponent`. **Try:** `Show the weather card for Tokyo: 77 degrees, clear`. **Pass:** a card renders inline.

**`/generative-ui/your-components/interactive`** — `useHumanInTheLoop` approval gate. **Try:** `Run the command rm -rf /tmp/cache`. **Pass:** an approval card renders with the command in a code block and **nothing further streams** until you click Approve or Deny; the agent's next message reflects your choice. **Fail:** plain text with no buttons, or it continues without waiting. Distinct from Human in the Loop below — that one asks you to *choose* between two values, this one asks you to *authorise* an action.

**`/generative-ui/tool-rendering`** — Named renderer for `weatherInfo` plus a wildcard. **Try:** `What's the weather in Tokyo?` **Pass:** "Calling weather API..." becomes "Called the weather API for Tokyo."

**`/generative-ui/state-rendering`** — `searches` working memory. **Try:** `Add a search for the tallest mountains`, then another. **Pass:** items accumulate in the left pane.

### App Control

**`/frontend-tools`** — `sayHello` executing in the browser. **Try:** `Say hello to Malaika`. **Pass:** a browser alert appears, then the agent confirms.

**`/human-in-the-loop/tool-based`** — `offerOptions`. **Try:** `Can you show me two good options for a restaurant name?` **Pass:** two buttons render and **nothing further streams** until you click one.

**`/background-tasks`** — A background tool surfaced as AG-UI activity events. **Try:** `Research the history of the Dutch East India Company`. **Pass:** a short reply plus an activity card that shows "Working…" then completes, with no further input from you.

### Shared State

**`/shared-state/in-app-agent-read`** — Reading working memory. **Try:** `Switch to Spanish`. **Pass:** the Language line updates and the agent starts replying in Spanish.

**`/shared-state/in-app-agent-write`** — `agent.setState`. **Try:** press Toggle Language, then `tell me a joke`. **Pass:** the reply comes back in the new language — the toggle changed behaviour, not just the panel.

**`/shared-state/predictive-state-updates`** — A document streamed into working memory. **Try:** `Write a short blog post about otters`. **Pass:** the left pane fills progressively with a LIVE badge, and the document never appears as a chat message.

**`/agent-app-context`** — `useAgentContext` read back through `requestContext`. **Try:** `Who are my colleagues?` **Pass:** the agent answers from the list on the left.

### Backend

**`/copilot-runtime`** — Routing across all seven agents, and the local-vs-remote tradeoff. **Pass:** all seven stream, each with its own conversation.

**`/ag-ui`** — Live AG-UI event capture. **Try:** `Hello`. **Pass:** `RUN_STARTED` → `TEXT_MESSAGE_CONTENT` burst → `RUN_FINISHED`.

**`/status`** — Every route in one table.

---

## 8. Testing checklist / current status

| Doc page | Route | Status | Notes |
|---|---|---|---|
| `/mastra` | `/` | 📖 Reference | Orientation + agent roster. |
| `/mastra/quickstart?agent=bring-your-own` | `/quickstart` | ✅ Working | |
| `/mastra/prebuilt-components` | `/prebuilt-components` | ✅ Working | Doc page is a 145-byte component stub. |
| `/mastra/prebuilt-components/copilot-threads-drawer` | `/prebuilt-components/copilot-threads-drawer` | ✅ Working | Persistent thread drawer sidebar. |
| `/mastra/custom-look-and-feel/slots` | `/custom-look-and-feel/slots` | ✅ Working | **Not in the doc sidebar**; resolves. |
| `/mastra/custom-look-and-feel/headless-ui` | `/custom-look-and-feel/headless-ui` | ✅ Working | **Not in the doc sidebar**; resolves. |
| `/mastra/headless-threads` | `/headless-threads` | ✅ Working | Headless thread management with useThreads. |
| `/mastra/threads` | `/threads` | ✅ Working | Durable persistence and conversation lifecycle. |
| `/mastra/programmatic-control` | `/programmatic-control` | ✅ Working | |
| `/mastra/inspector` | `/inspector` | ✅ Working | Dev-only by design. |
| `/mastra/generative-ui/your-components/display-only` | `/generative-ui/your-components/display-only` | ✅ Working | Needs no Mastra-side declaration. |
| `/mastra/generative-ui/your-components/interactive` | `/generative-ui/your-components/interactive` | ✅ Working | `useHumanInTheLoop` approval gate. Code is in the rendered page, not the raw markdown. |
| `/mastra/generative-ui/tool-rendering` | `/generative-ui/tool-rendering` | ✅ Working | |
| `/mastra/generative-ui/state-rendering` | `/generative-ui/state-rendering` | ✅ Working | |
| `/mastra/frontend-tools` | `/frontend-tools` | ✅ Working | |
| `/mastra/shared-state/in-app-agent-read` | `/shared-state/in-app-agent-read` | ✅ Working | |
| `/mastra/shared-state/in-app-agent-write` | `/shared-state/in-app-agent-write` | ✅ Working | |
| `/mastra/shared-state/predictive-state-updates` | `/shared-state/predictive-state-updates` | ✅ Working | |
| `/mastra/agent-app-context` | `/agent-app-context` | ✅ Working | |
| `/mastra/human-in-the-loop/tool-based` | `/human-in-the-loop/tool-based` | ✅ Working | |
| `/mastra/background-tasks` | `/background-tasks` | ✅ Working | |
| `/mastra/copilot-runtime` | `/copilot-runtime` | ✅ Working | |
| `/mastra/ag-ui` | `/ag-ui` | ✅ Working | |

**Legend:** ✅ Working · ⚠️ Partial · 📖 Reference · 🚧 Not started · ❌ Broken

> **Caveat on "Working":** every route typechecks, lints, and renders, and the dev server boots with all seven agents registered. Individual agent *behaviours* — particularly Background Tasks and Predictive State Updates, which depend on Mastra internals — have not each been driven end-to-end against a live model.

---

## 9. Known issues / doc-vs-implementation discrepancies

Found against `@mastra/core` 1.56.0, `@ag-ui/mastra` 1.1.1, and `@copilotkit/react-core` 1.66.2.

**1. `new Agent(...)` requires an `id`**
The Quickstart, Tool Rendering, and Shared State pages all construct agents with only `{ name, instructions, model }`. `AgentConfig` requires `id` — omitting it is a type error. Every agent here has one.

**2. `getLocalAgents` requires a `resourceId`**
Every page shows `MastraAgent.getLocalAgents({ mastra })`. `GetLocalAgentsOptions` requires `resourceId`, which scopes working memory. A real app would pass the signed-in user's id.

**3. `useAgent` has no `initialState`** — *fixed upstream 2026-09-04*
Both Shared State pages used to seed with `useAgent({ agentId, initialState })`, and the read page passed a `render` function; neither is on `UseAgentProps`. Both are gone. The seed is now a `useEffect` gated on `isReady`, which the hook does return, so the snippet compiles. What replaced it has its own problems — see the callouts on `/shared-state/in-app-agent-read`.

**4. `useRenderTool` sample does not compile**
Tool Rendering writes `render: ({ status, args })` with no `parameters` schema. The shipped named overload requires the schema and names the prop `parameters`.

**5. `requestContext.get()` is typed `{}`**
The Readables page reads `requestContext.get('ag-ui')?.context`. That property does not exist on the return type, and the `.find()` callback below it has an implicit `any`. This repo names the shape explicitly.

**6. `useRenderActivityMessage` does not take a renderer**
The Background Tasks page implies a page-level registration. The shipped hook takes **no arguments** — it is a consumer that returns `renderActivityMessage`/`findRenderer`. Renderers register on the provider via `renderActivityMessages`, which is where this repo puts it.

**7. `untilIdle` is not mentioned on the Background Tasks page**
Enabling `background` on the tool and `backgroundTasks` on the instance is not sufficient for the frontend to see progress — `getLocalAgents` also needs `untilIdle`, which is documented only on `GetLocalAgentsOptions`.

**8. `UseAgentUpdate` imported from the v1 entrypoint**
Predictive State Updates imports it from `@copilotkit/react-core` while importing everything else from `/v2`. Both live in `/v2`.

**9. Four different model ids**
Across these pages the docs specify `gpt-5.4`, `gpt-5.4-mini`, `gpt-4o`, and `gpt-4.1` — and the Quickstart's callout says GPT-4o while its code says otherwise. All agents here read one `OPENAI_MODEL`, defaulting to `gpt-4o`.

**10. `useHumanInTheLoop` does not infer its arg type**
Unlike `useRenderTool`, it defaults to `Record<string, unknown>`, so the HITL page's `args.option_1` is `unknown` and unusable in JSX. The generic is supplied explicitly.

**11. Some pages' `.md` is a stub while the rendered page has the code**
`generative-ui/your-components/interactive.md` is 152 bytes — a bare `<Interactive components={…} />` placeholder. The **rendered** page carries a full `useHumanInTheLoop` sample. Anything reading the markdown (including the `.md` suffix trick this repo used for Step 0) will conclude the page is empty. Worth fetching the rendered HTML for any page whose markdown looks like a component stub. The same is true of `prebuilt-components.md` (145 bytes).

**12. `@copilotkit/react-ui` in the install line**
The Quickstart installs it; it is the v1 package and nothing on that page uses it. Not a dependency here.

---

## 10. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Every chat errors immediately | No `OPENAI_API_KEY` | Set it in `frontend/.env.local` and restart — Next reads env at startup. |
| Tool runs but custom UI never renders | Renderer name ≠ tool `id` | `useRenderTool({ name })` must equal the Mastra tool's `id` exactly. |
| Working-memory panel stays empty | Reading state from a remote agent | Working memory only works with `getLocalAgents`. |
| State resets on restart | In-memory LibSQL | `url: ":memory:"` is the doc's config. Point it at a file or database to persist. |
| No activity card on Background Tasks | Missing one of three switches | Tool needs `background`, instance needs `backgroundTasks` + `storage`, runtime needs `untilIdle`. |
| Model-not-found errors | A `gpt-5.4*` id from the docs | Set `OPENAI_MODEL` to something your account has. |

---

## Doc drift detection

`/doc-sync` keeps this repo honest about the docs it mirrors. Press **Sync docs now** (on the landing page or on `/doc-sync`) and it fetches the markdown source behind all 20 tracked doc pages, diffs each against the copy stored in `doc-snapshot/`, replaces that copy, and reports what moved — ranked by whether the change can actually break an implementation.

Doc pages are fetched by appending `.md` to their URL, which returns the authored MDX rather than 250 KB of rendered HTML. Every response is checked for `text/markdown` before it is allowed near the snapshot: a URL that misses the markdown handler still answers `200` with the HTML app shell, and writing that in would destroy the baseline and report the whole corpus as rewritten on the next run. A run commits all pages or none.

**Severity is decided by where the edit landed**, not how big it was:

| Level | Trigger |
|---|---|
| **High** | a changed line inside a fenced code block, a changed fence count, or a page that now 404s and is gone from the sitemap |
| **Medium** | a changed heading, changed frontmatter `title`/`description`, or prose in the same section as changed code |
| **Low** | other prose |

**Sections checked** lists every tracked page in nav order with a mark — `✓` unchanged, `!` changed, `+` stored, `✗` 404, `~` unstable, `·` not checked. Expanding a row shows the comparison: for a changed page the diff (`−` existing snapshot, `+` newly fetched), and for an unchanged one the two matching hashes, which is the evidence the check ran.

**`doc-snapshot/CHANGELOG.md`** is the record that survives a re-sync. Because syncing replaces the copy it just compared against, the run *after* a change reports nothing — so the changelog is written at the moment of discovery and never rewritten later. Only changed pages are recorded; a clean run does not touch the file. It keeps the three most recent dated entries, counted rather than aged, so a change from six weeks ago still shows if nothing has happened since.

**One sync date.** `syncedAt` in `doc-snapshot/manifest.json`, rewritten on every run and shown on `/`, `/status` and `/doc-sync`. There is no hand-maintained date to keep in step with it.

**To test it**, edit any `doc-snapshot/pages/*.md` file and press the button — a line inside a code fence for High, a `##` heading for Medium, a sentence for Low. The comparison reads the stored file itself, so nothing else needs changing. Both `/doc-sync` and the changelog label the result as a local snapshot edit rather than upstream drift.

Commit `doc-snapshot/` — `pages/`, `manifest.json` and `CHANGELOG.md` are the baseline every diff is taken against. `reports/` is gitignored derived data.

---

## 11. Project structure

```
mastra/
├── CLAUDE.md
├── README.md
├── .env.example
│
└── frontend/                  # the whole app — Next.js + Mastra in one process
    └── src/
        ├── mastra/
        │   ├── index.ts               # ★ Mastra instance: 7 agents, storage, backgroundTasks
        │   ├── agents.ts              # ★ the 7 doc-defined agents + working-memory schemas
        │   ├── tools.ts               # ★ the 3 doc-defined tools
        │   └── model.ts               # single model id for every agent
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx               # / — orientation + agent roster
        │   ├── status/page.tsx
        │   ├── api/copilotkit/[[...slug]]/route.ts   # ★ CopilotRuntime + getLocalAgents
        │   └── <doc route>/
        │       ├── page.tsx           # notes + exact source (server component)
        │       └── demo-chat/page.tsx # ★ the running feature, chrome-free
        ├── components/
        │   ├── providers.tsx          # ★ provider, inspector, activity renderers
        │   ├── background-task-activity.tsx  # ★ AG-UI activity renderer
        │   ├── source-code.tsx        # renders a repo file verbatim
        │   ├── code-figure.tsx        # shared, Shiki-highlighted code block
        │   ├── app-chrome.tsx         # sidebar layout, skipped on /demo-chat
        │   ├── demo-frame.tsx         # thin bar + back link for demo routes
        │   ├── nav-sidebar.tsx
        │   ├── route-header.tsx
        │   └── ui.tsx                 # Panel, Callout, CodeBlock, TryIt
        └── lib/
            ├── nav-config.ts          # ★ single source of truth: routes, docs, status
            ├── source.ts              # server-only file reader
            └── highlight.ts           # server-only Shiki wrapper
```

---

## 12. References

**Getting Started** — [Quickstart (bring your own agent)](https://docs.copilotkit.ai/mastra/quickstart?agent=bring-your-own)

**Basics** — [Prebuilt Components](https://docs.copilotkit.ai/mastra/prebuilt-components)

**Custom Look and Feel** — [Slots](https://docs.copilotkit.ai/mastra/custom-look-and-feel/slots) † · [Headless UI](https://docs.copilotkit.ai/mastra/custom-look-and-feel/headless-ui) † · [Programmatic Control](https://docs.copilotkit.ai/mastra/programmatic-control) · [Inspector](https://docs.copilotkit.ai/mastra/inspector)

**Generative UI** — [Display-only](https://docs.copilotkit.ai/mastra/generative-ui/your-components/display-only) · [Interactive](https://docs.copilotkit.ai/mastra/generative-ui/your-components/interactive) · [Tool Rendering](https://docs.copilotkit.ai/mastra/generative-ui/tool-rendering) · [State Rendering](https://docs.copilotkit.ai/mastra/generative-ui/state-rendering)

**App Control** — [Frontend Tools](https://docs.copilotkit.ai/mastra/frontend-tools) · [Human in the Loop](https://docs.copilotkit.ai/mastra/human-in-the-loop/tool-based) · [Background Tasks](https://docs.copilotkit.ai/mastra/background-tasks)

**Shared State** — [Reading agent state](https://docs.copilotkit.ai/mastra/shared-state/in-app-agent-read) · [Writing agent state](https://docs.copilotkit.ai/mastra/shared-state/in-app-agent-write) · [Predictive State Updates](https://docs.copilotkit.ai/mastra/shared-state/predictive-state-updates) · [Readables](https://docs.copilotkit.ai/mastra/agent-app-context)

**Backend** — [Copilot Runtime](https://docs.copilotkit.ai/mastra/copilot-runtime) · [AG-UI](https://docs.copilotkit.ai/mastra/ag-ui)

**External** — [Mastra docs](https://mastra.ai/en/docs) · [Mastra working memory](https://mastra.ai/en/docs/memory/working-memory) · [AG-UI protocol](https://ag-ui.com)

† Resolves but is absent from the doc sidebar as of the sync date.
