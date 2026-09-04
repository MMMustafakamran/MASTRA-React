# QA findings — 2026-09-04 sync

**Repo:** Mastra-react · **Docs:** <https://docs.copilotkit.ai/mastra>

**Versions pinned for every finding below:**

| Package | Declared | Installed |
| --- | --- | --- |
| `@copilotkit/react-core` | `^1.66.2` | 1.66.2 |
| `@mastra/core` | — | 1.56.0 |
| `@ag-ui/mastra` | — | 1.1.1 |
| `zod` | — | **3.25.76** |

6 pages drifted, and one entirely new page was found that the CLI drift check
cannot see.

---

## 1. Shared State: `initialState` and `render` are gone — HIGH

**Pages:** `in-app-agent-read`, `in-app-agent-write`

README finding #3 — *"`useAgent` has no `initialState`"* — is **fixed
upstream**. Both props are gone. Seeding moved to a `useEffect` gated on
`isReady`, which the hook does return, so the published snippet compiles.
`setState` gained the spread it needed.

In Mastra the spread matters more than anywhere else: `agent.state` here *is*
Mastra working memory, so a bare `setState({ language })` drops every other key
the memory schema holds.

Implemented as published. Findings on what replaced it:

### 1a. `isReady` does not mean the state has loaded

The seed writes `english` whenever `state.language` is undefined at the moment
`isReady` flips true. `isReady` only reports that the runtime `/info` sync
resolved — nothing about whether a state snapshot has arrived. Working memory
already holding `spanish` is undefined on the client until it replays, and the
effect fires into that gap.

Harmless on these routes, which start empty. On a persisted thread it is a race
the page gives you no guard for.

### 1b. The snippet builds a guarded `state` and then ignores it

It computes `const state = (agent.state ?? {}) as Partial<AgentState>`, uses it
in the effect, then renders `{agent.state?.language}` on the highlighted line.
The guarded const exists only to feed the effect's dependency array.

### 1c. The render sample is named after the component it would replace

"Rendering agent state in your app" reuses the name `YourMainContent` from the
step above — the component that draws the whole page — with a body of
`if (!state.language) return null;` plus one `div`. Taken at its word, your main
content becomes a line that vanishes whenever working memory is empty.

Implemented verbatim under its published name and rendered in a dashed box on
the demo, so the return-null behaviour is watchable.

### 1d. In-chat rendering is no longer documented anywhere

The section was retitled from "Rendering agent state in the chat" to "in your
app", and the in-chat option went with it. No replacement page is linked.

Mastra has no "re-run the agent" section, so the un-spread sibling snippet that
affects AG2 and MS Agent Framework does not apply here.

---

## 2. The same line is spelled two ways across the guides — MEDIUM

| Guide | Published |
| --- | --- |
| AG2 | `{agent.state.language}` |
| **Mastra** | `{agent.state?.language}` |
| MS Agent Framework | `{agent.state?.language}` |

Same guide, same step, same line, differing by the optional chaining that
decides whether the page survives an undefined state. Nothing says which is
intended.

---

## 3. Governed Action Approval UI — new page, HIGH

**Page:** `/mastra/human-in-the-loop/governed-actions`, added 2026-09-04
**Route:** `/human-in-the-loop/governed-actions` (new)

Found only by running the sitemap comparison by hand — see §5.

Unusually, the published tool-call code compiles unchanged here: `args` is
inferred from `parameters` as the exact envelope type, `render` accepts the
`null` it returns, and `z.record(z.unknown())` is valid on zod 3.25.76. It is
implemented byte-for-byte.

### 3a. The `useInterrupt` half is not implementable

The page leads with a `useInterrupt` variant reading
`interrupt?.metadata?.action`. `Interrupt.metadata` is a real optional field on
the AG-UI type, so the snippet is well-formed — but it needs a backend that
pauses a run and attaches an action to it, and no Mastra agent here does.

The page shows only the consuming half. Nothing says which backends can emit
such an interrupt, or how the action reaches `metadata` in the first place.

### 3b. The guardrails are prose only

Five are listed: check policy server-side, use a stable `id` and `reference` so
an approval cannot be replayed, show the exact arguments, treat `deny` as
terminal, log everything.

The snippets implement exactly one — showing the arguments. `handleApproval`,
which compares `actionId` and `reference` to stop replay, is defined and wired
to nothing; the tool variant never calls it. Follow the page and you get an
approval UI with no replay protection and no audit trail, while the page reads
as though it covered both.

### 3c. The auto-verdict effect omits the handlers it calls

`GovernedActionCard` auto-approves on `allow` and auto-blocks on `deny` from a
`useEffect` keyed on `[action.id, action.verdict]`, while calling `onApprove`
and `onBlock`. Linted verbatim:

> React Hook useEffect has missing dependencies: 'onApprove' and 'onBlock'.

It works here only because the handlers close over `args`, which changes with
the id. It is published as an example to copy, and it will not survive a reader
wrapping those handlers in state.

### 3d. Cross-repo: the same schema does not compile on zod 4

`z.record(z.unknown())` is a zod 3 signature. Agno-react runs zod 4.4.3, where
`z.record` requires both a key and a value schema — the published form is
`TS2554` there. The page names no zod version. Whether its code compiles
depends entirely on a dependency it never mentions.

---

## 4. Credentials — HIGH

`INTELLIGENCE_API_KEY` → `CPK_INTELLIGENCE_API_KEY` in quickstart,
headless-threads and inspector. Placeholder `your_license_key` → `cpk-...`, and
the prose stopped calling it a license key.

Nothing says whether the old name still works, so `api/copilotkit-threads` reads
the new name first and falls back to the old one; `daily-recorder.yml` passes
both spellings through.

**Unresolved contradiction:** Headless Threads now states that managed project
setup does *not* issue `COPILOTKIT_LICENSE_TOKEN`, while the drawer still gates
on a license status and stays locked without one. Nothing reconciles these.

Also newly named and never defined: `SL_ENABLED`.

---

## 5. Tooling gap found while doing this sync — HIGH

`npm run drift:sync` compares hashes of pages already in the manifest. It never
fetches the sitemap, so a page appearing or disappearing upstream is invisible
to it — that comparison lives solely in the `/doc-sync` server action.

A clean CLI run prints **NO DOC DRIFT**, which reads as "the docs have not
moved" when it only means "the pages we already knew about have not moved".
`governed-actions` (§3) was invisible for exactly this reason.

Running the comparison by hand found 9 URLs under `/mastra` neither tracked nor
previously recorded: 8 `/intelligence/*` renames plus `/webmcp`.

**Fixed:** the CLI script now prints its own scope on every run, and the
manifest's `sitemap` block is rebuilt from what the sitemap actually lists.

---

## 6. A superseded workaround in this repo — MEDIUM

`/human-in-the-loop/tool-based` carried an explicit generic:

```tsx
useHumanInTheLoop<{ option_1: string; option_2: string }>({ … })
```

added on the belief that `args` was not inferred from `parameters`. Probed
against 1.66.2: inference works, and `args.someUnknownField` is still a compile
error. The generic was an unpublished departure with nothing to show for it, and
its comment asserted a limitation that does not hold. Removed; the page
publishes no generic and neither do we now.

(The `if (!respond) return <></>` next to it *is* published, and stays.)

---

## Coverage after this sync

| Area | State |
| --- | --- |
| 6 drifted pages | implemented |
| `governed-actions` | new route, demo, recorder action, tracked |
| Sitemap record | rebuilt, clean |
| `webmcp` | **not covered** — new top-level page, no route |
| `useInterrupt` variant of governed actions | **not covered** — no backend can emit the interrupt |
| Recordings | **not re-run.** Every clip predates these changes. |

Both Shared State clips will differ: the Language line reads `english` from load
rather than a dash (the dash was ours, never the docs'), and a dashed box shows
the render sample returning nothing before the seed lands.

`governed-actions` has a dedicated recorder action, because the standard
prompt-and-wait would film an approval card nobody approves and end on a
spinner. It reads the arguments block, clicks **Approve and run**, then waits
for the agent to continue.
