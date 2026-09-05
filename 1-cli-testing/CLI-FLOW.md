# `npx copilotkit@latest create` — interactive flow spec (Mastra)

Working map of every prompt the CLI is expected to show, in order, with the exact
keystroke that answers it. This is the input contract behind
`autorecorder/config/cli.config.ts`; it is not a doc summary.

The CLI is entirely keyboard-driven — no mouse anywhere in the flow.

---

## ⚠ Status of this document: PREDICTED, NOT OBSERVED

**The CLI has not been run in this repo. Nothing below was watched happening.**

Every prompt here is a *prediction*, derived from two things:

1. the reference repo's real, frame-by-frame run
   (`MsPy-react/1-cli-testing/CLI-FLOW.md`, CLI **4.9.24**, Microsoft Agent
   Framework (Python)), and
2. what `npx copilotkit@latest framework list` reports for the `mastra` row,
   run in this repo on **2026-09-04** against CLI **4.9.37**.

The `create` command is the same entrypoint for every framework, so the *shape*
of the flow is expected to carry over. What is genuinely unknown is whether a
TypeScript/Node starter takes exactly the same path as a Python one, and whether
4.9.37 changed any wording since 4.9.24.

Per-step status markers used below:

| Marker | Meaning |
|---|---|
| 🔵 **PREDICTED** | Carried over from the reference run. Screen text never seen in this repo. |
| 🟢 **VERIFIED** | Independently confirmed *in this repo*, and the evidence is named. |
| 🟡 **UNKNOWN** | Believed to exist; wording and behaviour both unconfirmed anywhere. |

Almost everything here is 🔵. **Do not cite this file as evidence of how the
Mastra CLI behaves.** The first real `npm run capture -- --scaffold` should be
watched, and this file and `cli.config.ts` corrected against it — at which point
these markers become 🟢 and this warning block comes out.

**What is actually confirmed in this repo, and how:**

- 🟢 The `mastra` row exists and reads
  `mastra  typescript  🌑 Mastra  -i --mock --channel`.
  Evidence: `npx copilotkit@latest framework list`, run 2026-09-04.
- 🟢 `Mastra` is a unique case-insensitive substring across all 23 rows, so
  `select: { label: 'Mastra' }` cannot land on the wrong framework.
  Evidence: the same listing, all 23 rows checked.
- 🟢 Mastra's starter ships a managed Channel host (`--channel` in its flags), so
  the chat-platform prompt is expected to appear rather than be skipped.
  Evidence: the same listing's flag column and its footer legend.
- 🟢 Mastra reads `OPENAI_API_KEY`.
  Evidence: the same listing's "Vendor keys each framework reads from .env".
- 🟢 The Intelligence project on this account is slug `2`, id `1621`.
  Evidence: `.copilotkit/project.json` in this repo.
- 🟢 The starter produces **no `agent/` directory**.
  Evidence: the four already-scaffolded trees under `1-cli-testing/*/app/`,
  from an earlier manual run — a single Next app, no agent folder at any depth.
- 🟢 CLI version available here is **4.9.37**.
  Evidence: `npx copilotkit@latest --version`, run 2026-09-04.

---

## The keystroke script

The whole run, in order. Details per step below. **All 🔵 unless marked.**

| # | Prompt | Keys | Status |
|---|---|---|---|
| 1 | *(shell)* | `npx copilotkit@latest create --project 2` | 🔵 |
| 2 | `Ok to proceed? (y)` | `y` `Enter` — only if not npx-cached | 🔵 |
| 3 | banner | — | 🔵 |
| 4 | `App name` | `app` `Enter` | 🔵 |
| 5 | `Select agent framework` | **name the row** → `🌑 Mastra` `Enter` | 🟢 row exists |
| 6 | sign-in | wait for auth to finish | 🔵 |
| 7 | `Select a project` | normally skipped by `--project 2` | 🔵 |
| 8 | `Connect this project to a chat platform?` | → `Not now` `Enter` | 🔵 prompt expected 🟢 |
| 9 | `Want me to install the dependencies…? [Y/n]` | `n` — **no Enter** | 🔵 |
| 10 | OpenAI API key | `Enter` — leave empty, CLI exits | 🟡 |

The model key is **not** supplied through the CLI. It is seeded into the copies
afterwards by `CLI_DISTRIBUTION` in `autorecorder/config/cli.config.ts`, from the
repo-root `.env`, so no recording ever contains a secret.

### Step 5 is the one that matters

`cli.config.ts` answers it with `select: { label: 'Mastra' }` — it walks the list
until the highlight is on that row and only then presses Enter.

It does **not** count arrow keys, and must never be changed to. The reference
repo's real run needed `Down` × 12 to reach its row; Mastra sits further down the
same list. A count that is right today silently scaffolds a **different
framework** the day CopilotKit ships a new integration above it — and reports
success while doing it. The list has 23 entries today and grows.
`npm run doctor` rejects any step that sends more than one arrow key without a
`select`.

---

## Preconditions

| Thing | Why it matters |
|---|---|
| Node + npx on PATH | The whole flow is `npx`-driven |
| Network | Downloads the `copilotkit` package, clones the template, talks to Intelligence |
| A signed-in CopilotKit CLI session | `create` reuses an existing session and only opens browser sign-in when there is none — and refuses outright in a shell with no terminal rather than opening a browser it cannot finish with. This is why the flow is local-only and not CI-able. Run `npm run capture -- --login` once first. |
| Working directory | The app folder is created *under the cwd* — `1-cli-testing/` — named at step 4 |

---

## The flow

### 1 · Launch 🔵

```
npx copilotkit@latest create --project 2
```

`--project` names the Intelligence project instead of showing the picker. In the
reference repo this was not a convenience: with a valid session already saved,
the interactive picker still sat on "Verifying authentication…" until the step
timed out, twice. Naming the project skips the step that hangs and leaves every
other prompt interactive and driven.

### 2 · npx package-install confirmation 🔵 *(conditional)*

```
Need to install the following packages:
  copilotkit@4.9.37
Ok to proceed? (y)
```

npx's own prompt, not CopilotKit's. It appears **only when the package is not
already cached**, which is why `cli.config.ts` marks this step `optional: true` —
so a second run does not fail waiting for a prompt that will not come, and so the
`y` is never typed into whatever prompt arrived instead.

### 3 · Banner 🔵 *(no input)*

### 4 · App name 🔵

```
App name
```

Answered `app`. Kept identical across every framework repo so the scaffold paths
(`1-cli-testing/app`, then `1-cli-testing/<pm>/app`) match everywhere.

### 5 · Agent framework picker 🟢 *(row confirmed; screen text 🔵)*

The row to land on, exactly as `framework list` prints it:

```
  mastra                            typescript  🌑 Mastra                              -i --mock --channel
```

Answered by name, never by count. See [above](#step-5-is-the-one-that-matters).

### 6 · CopilotKit Intelligence sign-in 🔵

Skipped entirely when a session is already cached — which is the point of running
`npm run capture -- --login` first. `cli.config.ts` keeps an `optional` step here
for the acknowledgement screen, because if it *is* waiting for a keypress nothing
else was ever going to send it.

### 7 · Intelligence project picker 🔵 *(normally skipped)*

```
Select a project
```

`--project 2` normally means this never appears. The step is kept `optional` so
that dropping the flag — or a CLI version that ignores it — still produces a
driven run rather than a hang. Project `2` is id `1621` on this account 🟢.

### 8 · Chat platform 🔵 *(prompt expected 🟢)*

```
Connect this project to a chat platform?
```

Mastra's row carries `--channel`, so its starter ships a managed Channel host and
this prompt **is** expected here 🟢 — unlike the five frameworks of 23 that do not
offer one. Answered `Not now`.

Still marked `optional: true` in config, deliberately: it costs nothing, and it
means the same file survives being re-pointed at a framework without a channel.

The timeout on this step is minutes, not seconds. In the reference run the
template is cloned between the account link and this prompt, and a 45s window
expired mid-clone — so the prompt arrived after the step had already given up,
then sat unanswered while the next step waited for something behind it.

### 9 · Install dependencies 🔵

```
Want me to install the dependencies for you? [Y/n]
```

Answered `n`, as a **single keypress with no Enter** — this prompt acts on the
character. Sending an Enter would leak into the key prompt below and answer it
before it had painted.

Declined because the whole point of this harness is to install four times, once
per package manager, from one identical scaffold.

### 10 · OpenAI API key 🟡

Wording unconfirmed anywhere — this is the weakest step in the file. Mastra reads
`OPENAI_API_KEY` 🟢, so a key prompt is expected, but its exact text is a guess and
`cli.config.ts` matches it loosely (`/API key/i`) and marks it `optional`.

Answered with `Enter` — left empty, so the CLI exits and no secret is ever on
camera.

---

## After the CLI exits

Not part of the CLI flow, but the rest of the pipeline, for orientation:

```
npm run capture -- --distribute     # one scaffold copied into npm/ pnpm/ yarn/ bun/,
                                    # model key seeded from the repo-root .env
npm run capture -- --install-npm    # then pnpm, yarn, bun
npm run render  -- --all            # videos 1 and 2 of every set
npm run record  -- --demo-npm       # video 3, per manager
```

The four trees under `1-cli-testing/` today were produced by hand, not by this
pipeline. They are kept as evidence of the real shape of a Mastra scaffold — and
they are what confirms the no-`agent/` finding above.

---

## Differences from the reference repo's flow

| | Reference (MsPy-react) | This repo (Mastra-react) | Status |
|---|---|---|---|
| Framework row | `Microsoft Agent Framework (Python)` — needed the long form, since the short form also matched the .NET row above it | `Mastra` — short form is already unique across all 23 rows | 🟢 |
| Starter language | Python agent | TypeScript / Node, agent runs in-process | 🟢 |
| `agent/` directory | Present; asserted in `expectFiles` | **Absent** — asserting it would fail a scaffold that worked | 🟢 |
| `.env` destinations | `.env` **and** `agent/.env` | `.env` only — there is no second process | 🟢 |
| Intelligence project | `myapp` | `2` (id 1621) | 🟢 |
| Chat-platform prompt | appears | expected to appear (`--channel`) | 🟢 |
| Recorded finding | bun install fails on Windows — a backslash in the Python starter's `install:agent` | **none yet**; that script does not exist in this starter | 🟢 |
| CLI version | 4.9.24 observed | 4.9.37 available | 🟢 |

---

## Open questions

Each of these should be resolved by watching the first real run:

1. Does the Mastra path ask **exactly** these prompts, in this order? Only the
   Python flow has ever been watched.
2. What is the real wording of the API-key prompt (step 10)?
3. Did anything change between CLI 4.9.24 (observed in the reference) and 4.9.37
   (what runs here)?
4. Does the chat-platform prompt offer the same `Not now` option label for a
   TypeScript starter?
5. Does `--project 2` actually suppress the project picker, or does a numeric
   slug behave differently from a named one like `myapp`?
