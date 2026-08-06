# CopilotKit Framework Test App — Build Instructions

## Purpose

Build a single Next application that acts as a **living test harness** for one CopilotKit agent-backend integration (e.g. Agno, AG2, PydanticAI, AWS Strands, Deep Agents JS, CrewAI, LangGraph, etc.). Every doc page under `https://docs.copilotkit.ai/{framework}/...` becomes a navigable route in the app, and each route contains a **working, interactive implementation** of what that doc page teaches — not a copy of the doc text.

Replace `{framework}` everywhere below with the actual framework slug (`agno`, `ag2`, `pydantic-ai`, `strands`, `deep-agents`, `mastra`, `claude-sdk-python`, etc.) before starting.

---

## Repo layout — one GitHub repo per framework

Each framework (`agno`, `mastra`, `claude-sdk-python`, etc.) lives in its **own separate GitHub repository**, not a shared monorepo. This exact `CLAUDE.md` is copied verbatim into the root of every one of those repos, so the same process applies everywhere — only `{framework}` changes.

```
agno/                          ← its own git repo
├── CLAUDE.md                   ← copy of this file
├── README.md                    ← elaborate, repo-specific — see "README.md spec" below
├── frontend/                     ← Next app; nav = agno's doc sections
├── backend/                       ← agent server (language per this framework's Quickstart)
└── .env.example

mastra/                        ← separate repo, same shape
├── CLAUDE.md
├── README.md
├── frontend/
├── backend/
└── .env.example
```

Rules:

- Never assume another framework's repo, page list, config shape, or backend language applies to this one — Steps 0–4 always run fresh, scoped to this repo, against this framework's own live doc tree.
- If `CLAUDE.md` itself is improved while working in one framework's repo, port the improvement back to the other framework repos too, so all copies stay in sync.
- `README.md` is the single most important deliverable in each repo — it's what anyone (including future-you) uses to actually run and evaluate the project. Build it to the spec below, not as an afterthought.

---

## Step 0 — Discover the real doc structure first

Doc structure varies per framework and changes over time. Do not assume it matches another framework or an older memory of it.

1. Fetch `https://docs.copilotkit.ai/{framework}` and read the left-nav sidebar in the page content — it lists every section and page with real URLs.
2. Build a checklist from that sidebar. As of this writing, the typical top-level groups are:
   - **Getting Started** — Introduction, Quickstart, CopilotKit CLI, Build with agents
   - **Basics** — Prebuilt Components
   - **Rich Threads** — Overview, Threads Drawer, Headless Threads, Thread & History Lifecycle, Synchronize Thread History, (premium) Threads & Persistence Architecture
   - **Custom Look and Feel** — Programmatic Control, Inspector *(older doc versions also had `slots` and `headless-ui` sub-pages — check whether they still exist for your framework before assuming)*
   - **Generative UI** — Tool Rendering, MCP Apps, A2UI
   - **App Control** — Frontend Tools
   - **Intelligence Platform** — Overview, Cloud-Hosted, Self-Hosting, Architecture *(premium — implement as a documented/mocked section, not a real paid integration)*
   - **Backend** — Copilot Runtime, AG-UI
   - **Troubleshooting** — Migration guides, Error Debugging & Observability, Common Issues
3. Fetch every page in the checklist (`web_fetch` each URL) before writing code. Do not paraphrase doc prose into the app — extract the *code samples, config shape, and API surface*, and implement the real thing.
4. Note the framework's backend language/runtime (Python vs Node) from the Quickstart page — this determines your backend scaffold.

---

## Step 1 — Project scaffolding

- Frontend: Next.js (App Router) + TypeScript. Use the CopilotKit v2 frontend surface — hooks *and* UI components both come from `@copilotkit/react-core/v2`, styles from `@copilotkit/react-core/v2/styles.css`. (The older split of `@copilotkit/react-core` + `@copilotkit/react-ui` is v1; check the framework's `troubleshooting/migrate-to-v2` page before assuming.)
- Backend: whatever the Quickstart page specifies for `{framework}` (commonly a Python FastAPI service running the agent + AG-UI protocol endpoint, or a Node service). Use the CopilotKit CLI (`copilotkit init` / `npx copilotkit@latest`) if the Quickstart references it, rather than hand-rolling config.
- `.env.example` for any required keys (model provider key, CopilotKit Cloud public key if used) — never hardcode secrets. (Full run instructions go in `README.md` per the spec in Step 4 — don't duplicate them elsewhere.)

---

## Step 2 — App shell: doc structure = nav structure

- Build a persistent sidebar/topbar that mirrors the checklist from Step 0, grouped the same way the docs group it (Getting Started, Basics, Rich Threads, etc.).
- One route per doc page, e.g. `/quickstart`, `/prebuilt-components`, `/threads`, `/threads/drawer`, `/threads/headless`, `/custom-look-and-feel/programmatic-control`, `/custom-look-and-feel/inspector`, `/generative-ui/tool-rendering`, `/generative-ui/mcp-apps`, `/generative-ui/a2ui`, `/frontend-tools`, `/backend/copilot-runtime`, `/backend/ag-ui`.
- Each route header shows: page title, a link to the live doc it's testing, and a status badge (Not started / In progress / Working / Broken) — this is a QA tool, so make pass/fail state visible at a glance.
- Keep a single shared `CopilotKit` provider at the app root pointing at your local runtime, so agent state/chat persists sensibly as you navigate between test pages where that's expected (and resets where the doc page is specifically demonstrating a fresh/isolated instance).

---

## Step 3 — Implement each section as a real, testable feature

For every route, build the actual functioning example from that doc page, not a static description:

- **Quickstart** — the minimal working chat-with-agent flow exactly as the doc's code sample shows.
- **Prebuilt Components** — render each prebuilt component the doc lists (e.g. `CopilotChat`, `CopilotPopup`, `CopilotSidebar`) in its own tab/panel so all can be exercised side by side.
- **Rich Threads** — implement thread creation, the threads drawer, headless thread list (build your own UI over the headless hook to prove it), and thread history sync against a real or mock persistence layer.
- **Custom Look and Feel** — implement whatever the framework's current pages cover (slots, headless UI, programmatic control, inspector). Actually swap in custom slot components / custom render functions, don't just show config.
- **Generative UI** — implement at least one real generative tool-rendering example, one MCP app if documented, and one A2UI surface if documented, each driven by an actual agent tool call.
- **App Control / Frontend Tools** — register at least one real frontend tool the agent can call and show its effect in the UI.
- **Backend (Copilot Runtime / AG-UI)** — don't just describe the runtime; show a debug panel that surfaces raw AG-UI protocol events/messages so behavior is inspectable during testing.
- **Troubleshooting pages** — turn these into an in-app "known issues / migration notes" panel rather than a live feature, since they're reference material, not something to functionally implement.
- **Premium/Intelligence Platform pages** — implement what's feasible without a paid account (config UI, architecture explanation), and clearly mark anything that requires a CopilotKit Cloud subscription as "requires premium — not testable locally."

---

## Step 4 — Build the repo's README.md to this spec

This README is the front door of the repo — someone should be able to clone it, follow the README alone (no other context), get the app running, and know exactly what they should see at each step. Treat it as a deliverable, not documentation-as-afterthought. Structure:

### 1. Header
- Project title: `CopilotKit + {Framework} Test Suite`
- One-line description of what this repo demonstrates
- Badges/status line: build status if CI exists, doc-sync date (the date Step 0 was last run against live docs), CopilotKit package versions used

### 2. Overview
- 2–4 sentences: what this framework integration is, and what this repo is for (a navigable, working test harness covering every `docs.copilotkit.ai/{framework}` page)
- Link to the live doc root this repo tracks: `https://docs.copilotkit.ai/{framework}`

### 3. Architecture
- Short diagram or bullet list of the pieces: Next frontend ↔ CopilotKit runtime route ↔ agent backend ↔ underlying model provider
- Note the backend language/runtime for this specific framework (Python/FastAPI, Node, etc.) since it varies

### 4. Prerequisites
- Exact versions: Node.js, Python (if applicable), package manager, `uv`/`pip`/etc.
- Required accounts/keys: model provider API key, CopilotKit Cloud key if used
- Any framework-specific CLI tools

### 5. Setup
- Step-by-step, copy-pasteable:
  1. Clone
  2. Install frontend deps (exact command)
  3. Install backend deps (exact command)
  4. Copy `.env.example` → `.env` and fill in each variable, with a one-line explanation of what each variable does
- Call out default ports for frontend and backend explicitly

### 6. Running the project
- The exact command(s) to start frontend and backend (single command if the CLI starts both, separate commands if not)
- What a successful startup looks like in the terminal (e.g. "you should see `Uvicorn running on http://localhost:8000`")
- The URL to open

### 7. What to expect — walkthrough per section
This is the most important part. For every route/nav item in the app (mirroring the doc structure from Step 0), give:
- Route path
- What it demonstrates (one sentence, in your own words — not copied doc prose)
- A concrete example interaction to try (e.g. "type 'what can you do?' into the chat — expect a streamed response citing the agent's registered tools")
- What success looks like vs. what a failure looks like, so someone testing it knows if it's actually working

### 8. Testing checklist / current status
- A table: Doc page | Route | Status (✅ Working / ⚠️ Partial / ❌ Broken / 🚧 Not started) | Notes
- This is the living QA record for the repo — update it whenever a section's status changes, and it's what feeds the root-level status view if this repo is tracked alongside others

### 9. Known issues / doc-vs-implementation discrepancies
- Anything where current package behavior has drifted from what the doc page currently shows
- Link the specific doc page and describe the discrepancy plainly

### 10. Troubleshooting
- Pull directly from the framework's own Troubleshooting doc pages (Common Issues, migration guides, error debugging) — translate into this repo's actual symptoms/fixes, don't just link out

### 11. Project structure
- Brief tree of `frontend/` and `backend/` showing where the key pieces live (routes, adapter/bridge file, runtime route, env config)

### 12. References
- Links to every doc page this repo tests against, grouped the same way the doc nav groups them

---

## Guardrails

- Always re-fetch the live doc page rather than relying on memory of CopilotKit's API — this project moves fast and page structure/APIs change between versions.
- Don't reproduce doc prose verbatim in code comments or in-app text; summarize in your own words and link to the source doc.
- Keep this repo self-contained — no imports from or references to another framework's repo. If you're bootstrapping a new framework repo, copy this `CLAUDE.md` in fresh and re-run Step 0 against that framework's live docs rather than reusing the previous repo's discovered structure.
- If a doc page 404s or a nav item is missing for this framework, note it in the README's status table (Step 4, section 8) rather than guessing at content from another framework's version of that page.