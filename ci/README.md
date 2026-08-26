# `ci/` — the recording pipeline

Everything that builds, starts, checks and records this repo lives here. The
only piece outside this folder is `.github/workflows/daily-recorder.yml`, because
GitHub requires that path.

## Layout

```
ci/
├── automate.mjs          entry point — one process, start to finish
├── check-doc-drift.mjs   compares doc-snapshot/ against the live docs
├── list-pages.mjs        prints the recorder's page ids
├── validate-pages.mjs    rejects unknown ids before a run starts
├── resolve-selection.mjs expands dispatch checkboxes + ids into a page list
├── run-name.mjs          names the run's artifacts (Mastra-react-18Aug2026-0612UTC)
└── lib/
    ├── config.mjs        paths, ports, URLs
    ├── env.mjs           loads .env files the way Next does
    ├── pages.mjs         reads page ids from the recorder's config
    ├── preflight.mjs     port, credential and warmup checks
    ├── mux.mjs           voiceover muxing (the only implementation)
    └── report.mjs        RUN_REPORT.md / .json
```

## One service, not two

Mastra is TypeScript and its agents run inside the Next.js process
(`getLocalAgents`), so there is no separate agent server to install, start,
health-check or shut down. That is why this pipeline has no backend step and
`lib/config.mjs` has no `BACKEND_DIR` — the Next app on `:3000` is the whole
stack, and `/api/copilotkit` is where Mastra actually lives.

## Commands

| Command | What it does |
|---|---|
| `npm run automate` | Full pipeline: drift → preflight → deps → server → record |
| `npm run automate:pull` | Same, after `git pull` |
| `npm run automate:upgrade` | Same, upgrading dependencies first |
| `npm run drift` | Doc drift check on its own |
| `npm run drift:sync` | Update `doc-snapshot/` to match live docs |
| `npm run ci:pages` | List valid page ids |

Anything not consumed by `automate.mjs` is forwarded to the recorder:

```bash
node ci/automate.mjs --pages=quickstart,threads
node ci/automate.mjs --shard=1/3
node ci/automate.mjs --limit=3 --ignore-doc-drift
```

## Flags

| Flag | Effect |
|---|---|
| `--pull` | `git pull` first |
| `--upgrade` | Upgrade deps instead of installing the lockfile |
| `--skip-install` | Skip dependency installation |
| `--ignore-doc-drift` / `--force` | Record even if the live docs moved |
| `--allow-port-reuse` | Record against a server that is already running |
| `--skip-credential-check` | Skip the model-credential preflight |

## What runs, in order

1. **Doc drift** — compares each `doc-snapshot/pages/*.md` hash against the live
   page. Drift halts the run with exit code 2 unless `--ignore-doc-drift`.
2. **Preflight** — loads `.env`, then refuses to continue if the port is already
   held or the model credential is missing/rejected. Both checks are cheap and
   both have cost a full run before.
3. **Dependencies** — `npm install` for the frontend and the recorder.
4. **Server** — the Next app, spawned from this process, logging to
   `autorecorder/videos/logs/frontend.log`.
5. **Health + warmup** — poll until it answers, then compile the heaviest routes
   and `/api/copilotkit` so the recorder is not racing a cold Turbopack build.
6. **Record** — hand off to the recorder with the forwarded flags.
7. **Mux + report** — always runs, success or failure.

## Why one process

Each `run:` step in a GitHub Actions job is a separate subshell. A server
started with `&` in one step is reaped before the next step begins. Spawning the
server from inside `automate.mjs` keeps it alive for the whole run, which is why
the pipeline is a Node program and not a sequence of YAML steps.

## Page selection

`autorecorder/config/pages.config.ts` is the single source of truth for which
demos exist. `lib/pages.mjs` reads the ids from it, `list-pages.mjs` prints
them, and `validate-pages.mjs` checks a selection against them.

The workflow does **not** restate the list. It used to, in two more places, and
they drifted whenever a page was renamed.

### Choosing pages on a manual run

The dispatch form has a checkbox per **doc section** plus a free-text field for
exact ids. Tick sections, type ids, or both — the two are combined.

| Checkbox | Pages |
|---|---|
| Getting Started | quickstart, prebuilt-components |
| Custom Look & Feel | custom-look-and-feel-slots, custom-look-and-feel-headless-ui, programmatic-control, inspector |
| Generative UI | generative-ui-your-components-display-only, generative-ui-your-components-interactive, generative-ui-tool-rendering, generative-ui-state-rendering |
| App Control | frontend-tools, human-in-the-loop-tool-based, background-tasks, shared-state-in-app-agent-read, shared-state-in-app-agent-write, shared-state-predictive-state-updates, agent-app-context |
| Rich Threads | prebuilt-components-copilot-threads-drawer, threads, headless-threads |
| Backend | copilot-runtime, ag-ui |

Nothing ticked and nothing typed means **all pages** — what the nightly schedule
does.

**Why sections rather than one checkbox per page:** GitHub allows a
`workflow_dispatch` at most **10 inputs**. Twenty-two page checkboxes plus the
options came to 25, which made the workflow invalid — every manual run failed
before a job started. Six section checkboxes plus four options is exactly 10, so
the form is now at the cap: adding an input means removing one.

The section map lives in `PAGE_GROUPS` in `lib/pages.mjs`, and a run fails if any
page belongs to no section, so nothing can quietly become unreachable.

## Adding a page

1. Add it to `autorecorder/config/pages.config.ts`.
2. Add its id to a section in `PAGE_GROUPS` (`ci/lib/pages.mjs`).

Skipping step 2 fails the run with the page named, rather than silently dropping
it from the form.

## CI shape

`prepare` resolves the run name and page list once. Three workers each record a
third of the pages under `xvfb-run`, then `consolidate-recordings` merges the
artifacts.

```
            ┌─ Worker 1/3 ─┐
prepare ────┼─ Worker 2/3 ─┼─→ consolidate-recordings
            └─ Worker 3/3 ─┘
```

## Artifact names

Every artifact is named for the project and the moment the run started:

```
Mastra-react-18Aug2026-0612UTC             ← consolidated, all clips
Mastra-react-18Aug2026-0612UTC-shard-1     ← one worker's output
```

`prepare` computes the stamp once (`ci/run-name.mjs`) and passes it to the other
jobs, so all four names agree. Change the prefix via `PROJECT_SLUG` in
`lib/config.mjs`.

## Secrets and variables

| Name | Kind | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | secret | Model provider key, read server-side by the Mastra agents |
| `COPILOTKIT_LICENSE_TOKEN` / `NEXT_PUBLIC_COPILOTKIT_LICENSE_KEY` | secret | CopilotKit Enterprise features |
| `OPENAI_MODEL` | variable | Model override (default `gpt-4o`) |

## Troubleshooting

**"Port already in use"** — a previous run's server survived. Stop the listed
PIDs, or pass `--allow-port-reuse` to record against it. Do not ignore this:
Windows lets a second process bind a port another is already listening on, and
requests then land on whichever accepts first, so a stale server holding old
environment variables can answer instead of the new one.

**"OPENAI_API_KEY is missing or still the placeholder"** — set a real key in
`frontend/.env.local` or the repo-root `.env`. Note the precedence:
`frontend/.env.local` is read first, so an uncommented placeholder there shadows
a real key at the root.

**Server died mid-run** — read `autorecorder/videos/logs/frontend.log`. It is
uploaded with the CI artifacts.

**Recorder aborts on preflight** — the app was still compiling. The warmup step
covers the usual routes plus `/api/copilotkit`; a page added to `WARMUP_ROUTES`
in `lib/config.mjs` gets the same treatment.
