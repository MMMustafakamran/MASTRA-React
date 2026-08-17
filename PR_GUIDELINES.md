# PR Guidelines

## 1. What a single PR should contain

One reviewable unit of work. Pick one:

- **One doc section** — the routes and backend wiring for a single doc group (e.g. all of Rich Threads), plus its README status rows.
- **One fix** — one broken route or one bug, plus the status/notes update that reflects it.
- **One doc sync** — the `doc-snapshot/` refresh for a re-fetch of the live docs, and any implementation drift it exposes.
- **One infra change** — dependency bumps, scaffolding, tooling, `.env.example` changes.

Do not mix these. A doc sync that also rewrites three routes is two PRs. If a fix forces an unrelated dependency bump, land the bump first.

**Size:** if the diff is over ~800 changed lines excluding lockfiles and `doc-snapshot/`, split it or say in the description why it can't be split.

---

## 2. Branches

Never commit directly to `main`. Branch off the latest `main`:

```
git checkout main && git pull
git checkout -b fix/programmatic-control-stale-state
```

| Prefix | Use for |
|---|---|
| `feat/` | A new route, component, or backend capability |
| `fix/` | Something that was broken and now isn't |
| `docs/` | README, this file, `CLAUDE.md`, in-repo notes |
| `sync/` | `doc-snapshot` refreshes and the drift they surface |
| `chore/` | Deps, config, tooling, gitignore |

Use the route or doc-page slug in the branch name so the target is obvious: `feat/generative-ui-tool-rendering`, not `feat/new-page`.

---

## 3. Commits

Format: `<type>: <imperative summary>` — matching the existing `(fix): programmatic control` history, but without the parentheses going forward:

```
fix: keep useCoAgent state after thread switch
feat: add headless threads route with custom list UI
sync: refresh doc-snapshot, 4 pages changed
docs: record typecheck failure in known issues
chore: bump @copilotkit/react-core to 1.66.2
```

Rules:

- Imperative mood, no trailing period, ≤72 chars on the subject line.
- One logical change per commit. `.` and `thread updated` are not acceptable messages — they make `git log` useless as a QA record.
- Body (optional, wrapped at 80) explains **why**, and links the doc page if the change is doc-driven.
- Never commit secrets. `.env`, `.env.local`, and `.copilotkit/` are gitignored — keep it that way. `.env.example` holds placeholders only.
- Never commit `node_modules/`, `.venv/`, `.next/`, `__pycache__/`, `*.tsbuildinfo`, or `doc-snapshot/reports/`.

---

## 4. PR title and description

**Title:** same format as a commit subject, plus the repo's framework if it's ambiguous. `fix: thread history lost on route change`.

**Description** — use this template:

```markdown
## What is in the PR
One or two sentences. What changed and which routes/doc pages it touches.

## Changes Explanation
Explain the changes you made in bullets

## Doc pages covered
- https://docs.copilotkit.ai/{framework}/{page}  → route `/{route}`

## Why were these changes necessary?
The reason. If this is a fix, describe the broken behaviour first,
then the corrected behaviour.

## Screenshots / logs
For anything visual or anything that failed. Terminal output is fine.
```

Drop a section only when it is genuinely empty — write "none" rather than deleting the heading, so a reviewer can tell you considered it.

---

## 5. Harness-specific rules

These are the ones that make or break the value of these repos. Violating them silently is worse than an unfinished PR.

**Reproduce doc code as published.** If a doc page's sample is broken, implement it broken, verify that it's broken, and record the failure in the README's *Known issues / doc-vs-implementation discrepancies* section. Do not silently correct the doc's code — a working route that doesn't match the doc is a false pass and defeats the purpose of the harness. If you also want to show a corrected version, put it in a clearly labelled second panel alongside the verbatim one.

**Never invent missing doc code.** If a doc page omits half the sample, stop and mark the gap loudly in the route and the README. Do not fill it in from another framework's page or from memory of an older version.

**Never paraphrase doc prose into the app or into comments.** Summarize in your own words and link the source page. In-app text that reads like a copy of the doc is a review blocker.

**Re-fetch, don't remember.** Any claim about CopilotKit's API surface in a PR must come from a fetch of the live doc page during that PR, not from recall or from another repo. Note the fetch date in the description if it matters.

**A 404'd doc page is a status-table row, not a guess.** Record it as missing; do not reconstruct the page from a sibling framework.

**Premium features are marked, not faked.** Anything needing a CopilotKit Cloud licence renders its real locked state and says what's missing. A mocked-out "working" premium route is a false pass.

**Status badges must match reality.** Every route header carries a status, and the README table mirrors it. If you didn't run the route in this PR, its status doesn't change — say so.

---


## 8. Merging

- **Squash merge** into `main`. The squash subject follows the commit format; the body keeps the What / Why.
- Keep the PR number in the subject (GitHub adds it) — the README status table can then cite `#12` in Notes.
- Delete the branch after merge.
- Never force-push `main`. Force-pushing your own PR branch before review has started is fine; after a reviewer has commented, push follow-up commits instead so the review thread stays readable.
- Green checks and one approval before merge. If the repo has no CI, the pre-submit checklist is the gate.

---

## 10. Quick reference

```bash
# start
git checkout main && git pull && git checkout -b fix/<slug>

# verify before pushing
cd frontend && npm run build && npx tsc --noEmit && npm run lint
cd ../backend && <the repo's own start command>   # see README §6

# ship
git push -u origin fix/<slug>
gh pr create --fill   # then paste the template from §4 and the checklist from §6
```
