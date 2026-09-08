# `npx copilotkit@latest create` — interactive flow spec (Mastra)

Working map of every prompt the CLI is expected to show, in order, with the exact
keystroke that answers it. This is the input contract behind
`autorecorder/config/cli.config.ts`; it is not a doc summary.

The CLI is entirely keyboard-driven — no mouse anywhere in the flow.

---

## Status of this document: OBSERVED — 2026-09-07

The CLI has been run in this repo and recorded. Screen text below is read off
that recording.

**Evidence:** [`autorecorder/casts/MASTRA-react-cli-02-Scaffold.cast`](../autorecorder/casts/MASTRA-react-cli-02-Scaffold.cast)
— a driven run of `npx copilotkit@latest create --project 2`, 142s, all eight
steps answered, `🪁🤝🌑 App "app" created successfully!`.

The open question this file carried — *does a TypeScript/Node starter take the
same path as a Python one?* — is answered: **yes, prompt for prompt.** The Agno
(Python) run of the same day hit the same screens in the same order; the only
difference is the emoji in the success banner and that Mastra's starter has no
`agent/` directory.

### What the real run corrected

Two predictions were wrong, and both had been encoded into
[cli.config.ts](../autorecorder/config/cli.config.ts):

1. **Steps 9 and 10 were in the wrong order.** The key prompt comes *first*, then
   the install question. Caught on the Agno run, where a driver waiting for the
   install prompt hung behind an unanswered key prompt and failed the flow after
   300s. Mastra's own run was driven with the corrected order and passed first
   time.
2. **The key prompt does not contain the string "API key".** It reads
   `Set OPENAI_API_KEY now, or press Enter to skip and add it later.` — the old
   `/API key/i` pattern could never have matched it.

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
| 1 | *(shell)* | `npx copilotkit@latest create --project 2` | 🟢 |
| 2 | `Ok to proceed? (y)` | `y` `Enter` — only if not npx-cached | 🔵 |
| 3 | banner | — | 🟢 |
| 4 | `App name` | `app` `Enter` | 🟢 |
| 5 | `Select agent framework` | **name the row** → `🌑 Mastra` `Enter` | 🟢 |
| 6 | `A free CopilotKit account is required to link this app.` | nothing — the saved session carried it | 🟢 |
| 7 | `Select a project` | never shown — `--project 2` was passed | 🟢 |
| 8 | `Connect this project to a chat platform?` | → `3. Not now` `Enter` | 🟢 |
| 9 | `Set OPENAI_API_KEY now, or press Enter to skip and add it later.` | `Enter` — leave empty | 🟢 |
| 10 | `Want me to install the dependencies for you now? (npm install) [Y/n]` | `n` — **no Enter** | 🟢 |
| 11 | `🪁🤝🌑 App "app" created successfully!` | — the CLI holds the terminal open | 🟢 |

**9 before 10**, and the CLI does not exit after the last answer — the flow ends
on `doneWhen: /created successfully/i`.

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

### 9 · OpenAI API key 🟢

```
Set OPENAI_API_KEY now, or press Enter to skip and add it later.
Required by the agent runtime.
Create a key:  https://platform.openai.com/api-keys
>
```

Answered with `Enter` — left empty, so no secret is ever on camera. The key is
seeded into the four copies afterwards by `npm run capture -- --distribute`.

This was the weakest step in the file and it was wrong twice over: it comes
*before* the install question, and its text has no spaced "API key" in it. Match
`/_API_KEY now|press Enter to skip/i`.

### 10 · Install dependencies 🟢

```
Want me to install the dependencies for you now? (npm install) [Y/n]
```

Answered `n`, as a **single keypress with no Enter** — this prompt acts on the
character.

Declined because the whole point of this harness is to install four times, once
per package manager, from one identical scaffold.

Match the question form, not `/install the dependencies/i`: the success banner
that follows prints `Install the dependencies:  npm install` in its next-steps
list, and a loose pattern matches that instead.

### 11 · Success banner 🟢

```
🪁🤝🌑 App "app" created successfully!
```

No input, and **no exit** — the CLI holds the terminal. It also writes
`.copilotkit/project.json` at the repository root, not in the app folder, binding
every directory in Mastra-react to project `2`.

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

## `npm run dev` dies on a logger export — yarn and pnpm 🟢

**The documented command does not start this starter under yarn or pnpm.** On
film in `videos/cli/MASTRA-react-yarn-3-Demo.webm` (2026-09-08), during the
terminal replay:

```
[agent] import { LogLevel, MastraLogger, buildLogRecordData, exportTrackedException } from "@mastra/core/logger";
[agent] SyntaxError: The requested module '@mastra/core/logger' does not provide an export named 'buildLogRecordData'
[agent] npm run dev:agent exited with code 1
[ui]    npm run dev:ui exited with code 1
```

`dev` is `dev:infra && concurrently "npm run dev:ui" "npm run dev:agent"`, and
`dev:agent` is `mastra dev`. When it dies, `--kill-others` takes the UI with it,
so the browser then gets `ERR_CONNECTION_REFUSED` — the app is simply not there.

**Cause: a version mismatch, not a package manager bug.** `@mastra/loggers@1.3.1`
imports `buildLogRecordData` from `@mastra/core/logger`, and `@mastra/core@1.41.0`
does not export it — `node_modules/@mastra/core/dist/logger/index.js` contains
zero occurrences of the name. Which managers break is decided by which logger
version they resolve:

| Manager | `@mastra/loggers` | `@mastra/core` | `mastra dev` |
|---|---|---|---|
| yarn | **1.3.1** | 1.41.0 | dies at startup |
| pnpm | **1.3.1** | 1.41.0 | dies at startup |
| bun | 1.1.2 | 1.41.0 | starts |
| npm | not hoisted to the top level | 1.41.0 | starts |

**Do not record `dev:ui` to get around this.** It was tried for one day
(2026-09-07) and it is the wrong call: it hides a starter that does not run
behind a green recorder, while anyone typing the documented command gets a dead
app in seconds. The clip is supposed to show that.

---

## Demo: the scaffolded app cannot answer 🟢

**Blocks every demo clip in this repo, and it is not the recorder's fault.**
Observed 2026-09-07 on the npm copy, reproduced outside the recorder entirely —
headless Playwright, clean browser context, no overlays:

```
POST /api/copilotkit/agent/default/run   ->  200
     data: {"type":"RUN_STARTED","threadId":"899cebb0-...","runId":"5540879c-..."}
     then: Thread 899cebb0-... not found      (runtimeErrorCode: INCOMPLETE_STREAM)
```

The run starts, the stream breaks, and the UI prints `Thread <id> not found`. No
assistant message ever gets content, so `demo-npm` and `demo-bun` fail on
`replyStartMs` — correctly.

Ruled out, each by a separate run:

| Suspect | Verdict |
|---|---|
| Recorder overlays / driving | Reproduces in a bare Playwright script |
| Missing `OPENAI_API_KEY` | Present in the copy's `.env`; a wrong key gives a different error |
| Hosted Intelligence | With `CPK_INTELLIGENCE_API_KEY` set the failure only *changes*, to `502 Failed to start runner: Timed out joining channel` |
| Local runner | With the key removed (`InMemoryAgentRunner`), back to `Thread not found` |
| Missing `mastra dev` | Ran `next dev --port 3141` and `mastra dev` side by side, as `npm run dev` does when 3000 is free — identical failure |
| A slow first response | `replyStartMs` raised to 90s; no answer ever arrives, so it was reverted |
| `localhost:3000` CORS in the console | A red herring. A clean context makes every CopilotKit request to its own origin; this line comes from the doc tab the recorder warms first |

**Both runner paths are broken**, which is what makes this a starter bug rather
than a configuration mistake: hosted Intelligence times out joining its channel,
and the local in-memory runner loses the thread the client just opened.

### `npm run dev` cannot be used to record

`dev` is `dev:infra && concurrently "npm run dev:ui" "npm run dev:agent"`, and
`dev:agent` is `mastra dev`. The Mastra CLI takes its port from
**`process.env.PORT` and nothing else** — the same variable the recorder sets to
move Next off 3000. Both bind it, `mastra dev` loses with `EADDRINUSE`, and
`concurrently --kill-others` takes the UI down mid-demo.

Nobody meets this running the starter normally: with `PORT` unset Next takes 3000
and Mastra its own default. `pages.config.ts` therefore records `dev:ui`, whose
Next route hosts the agent in-process anyway (`createLocalAgents()` in
`src/agent.ts`); `mastra dev` only serves the playground, which no clip opens.

---

## Open questions

Answered by the 2026-09-07 run — kept with their answers rather than deleted, so
the next reader sees what was uncertain and what settled it:

1. ~~Does the Mastra path ask exactly these prompts, in this order?~~ Yes, and it
   is the same order the Agno (Python) run produced. Steps 9 and 10 were
   predicted the wrong way round.
2. ~~What is the real wording of the API-key prompt?~~
   `Set OPENAI_API_KEY now, or press Enter to skip and add it later.`
3. Did anything change between CLI 4.9.24 and what runs now? **Still open** — the
   version was not printed in the cast. The install prompt sits *after* the key
   prompt here, where 4.9.24's notes put it before, so something did move.
4. ~~Does the chat-platform prompt offer `Not now`?~~ Yes: `1. Slack`,
   `2. Microsoft Teams`, `3. Not now`.
5. ~~Does `--project 2` suppress the project picker?~~ Yes. The picker never
   appeared; the CLI printed `Selecting your Intelligence project…` and moved on.
