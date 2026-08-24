# THREADS-AUTH.md — authenticating a pre-existing CopilotKit repo with the CLI

**Read this before changing anything. Follow it in order.**

You have a CopilotKit test harness that was hand-built rather than scaffolded by
the CLI — `agno`, `mastra`, `ms-agent-python`, an Angular variant, whatever. Its
Rich Threads pages cannot work, because threads are not stored by your agent or
your runtime: they live in CopilotKit's managed Enterprise Intelligence platform,
and reaching it needs credentials your repo does not have.

`copilotkit init` is not the answer — it *scaffolds a new app*, and pointing it
at an existing repo is how you overwrite work. The right commands are `login`,
`project select`, and `license`, which provision credentials into whatever
directory you run them from without generating a single line of app code.

---

## The one thing to get straight first

**The CLI gives you credentials. It does not wire your runtime.**

Those are two separate jobs and only the first is automated:

| | Who does it | Covered in |
|---|---|---|
| Obtain a license token + a project API key | the CLI | Steps 1–3 |
| Make your runtime *serve thread routes at all* | you, by hand | Steps 4–6 |

Skipping the second half is the usual failure. You end up with perfect
credentials, a `/info` that reports nothing, and a drawer that stays locked —
because the runtime helper every Quickstart shows **cannot serve threads**, and
no doc page says so. See [the three gates](#the-three-gates).

Second thing: **none of this is framework-specific.** Thread storage, the license
check, and the thread REST routes all live in the frontend and its runtime route.
Your agent backend — Python, Node, .NET — is not involved and does not change.

---

## TL;DR

From your frontend directory (see [Step 4](#step-4--put-the-values-where-your-framework-reads-them) for why it matters):

```bash
npx copilotkit@latest whoami          # already logged in? skip login
npx copilotkit@latest login
npx copilotkit@latest project select  # → .copilotkit/project.json + INTELLIGENCE_API_KEY in ./.env
npx copilotkit@latest license --write # → COPILOTKIT_LICENSE_TOKEN in ./.env
```

Then add the two files in [Step 5](#step-5--add-a-second-runtime-endpoint) and
[Step 6](#step-6--add-a-provider-for-the-threads-routes), and verify with
[Step 7](#step-7--verify).

Verified against CLI **4.8.3**, `@copilotkit/runtime` and
`@copilotkit/react-core` **1.68.2**.

---

## The three gates

Most of the time lost here goes to assuming it is only about credentials. It is
not. Three independent gates sit in front of Rich Threads, each failing
differently:

| # | Gate | Symptom when it fails | Fixed by |
|---|---|---|---|
| 1 | **Multi-route transport** | `GET /api/copilotkit/threads` → `404`. No thread route exists at all. | Steps 5 + 6 |
| 2 | **An Intelligence runtime** | Routes answer, but mutations → `422 Missing CopilotKitIntelligence configuration`, and `/info` has no `licenseStatus`. | Steps 3 + 5 |
| 3 | **A valid license token** | Everything answers, but `<CopilotThreadsDrawer>` renders a locked panel and never issues a network call. | Step 3 |

**Gate 1 is the one no doc page mentions.** In single-route mode or legacy
helpers, single-route dispatch hard-codes `threadEndpointsEnabled: false`.
Thread routes exist *only* in multi-route mode (`[[...slug]]` routes served via
`createCopilotRuntimeHandler` or `createCopilotEndpoint`).

Confirm it in your own repo rather than trusting this file:

```bash
grep -n "threadEndpointsEnabled" \
  frontend/node_modules/@copilotkit/runtime/dist/v2/runtime/core/fetch-handler.mjs
```

Two hits: `false` for single-route, `true` for multi-route. Identical in 1.65.0
and 1.68.2.

---

## Step 1 — Log in

```bash
npx copilotkit@latest whoami
```

If it prints an email, org name, and Clerk Org ID, you already have a session —
**the CLI session is per-machine, not per-repo**, so one login covers every
framework repo on that machine. Skip to Step 2.

Otherwise:

```bash
npx copilotkit@latest login
```

This opens a browser. `login --json` streams agent-readable JSON lines without
opening one, for CI or a headless box.

`logout` clears the session; there is no per-project login.

---

## Step 2 — Select a project (this is the one that provisions the API key)

```bash
cd frontend        # or wherever the .env your app reads lives — see Step 4
npx copilotkit@latest project select
```

Interactive: pick an existing hosted Intelligence project or create one. It then
does **two** things, and the second is the part the docs gloss over:

1. Writes `.copilotkit/project.json` — project id, slug, org id. Bookkeeping.
2. Provisions a **project-scoped API key** and upserts
   `INTELLIGENCE_API_KEY` into `./.env`.

That second write is why this command, not `init`, is the one you want. In the
CLI bundle it is `provisionApiKey(projectId)` → `writeHostedApiKey(process.cwd(), token)`.

Three things follow from `process.cwd()`:

- **It writes into the directory you run it from.** Run it from your repo root
  and the key lands in a `.env` your Next app may never read.
- **It upserts.** `upsertEnvVars` rewrites a matching key in place and appends
  a missing one, so your existing variables survive.
- **`.copilotkit/` should be gitignored.** It carries project and org ids.

If key provisioning fails the CLI says so explicitly and tells you to re-run
`project select` or set `INTELLIGENCE_API_KEY` by hand — it does not fail
silently.

---

## Step 3 — Issue a license token

```bash
npx copilotkit@latest license --write
```

Issues a fresh license and writes `COPILOTKIT_LICENSE_TOKEN=…` to `./.env`,
replacing an existing line if there is one. Other flags:

| Invocation | Behaviour |
|---|---|
| `license --write` | Write to `./.env` without asking. |
| `license --print` | Print the line to stdout, write nothing. |
| `license` (interactive terminal) | Offers to write; you confirm. |
| `license` (piped/redirected) | Prints only — so `copilotkit license >> .env` works. |
| `license list` | List existing licenses: id, tier, seats, created, **expires**. |

> **Gotcha:** if `./.env` does not exist but `./.env.example` does, the license
> writer copies the example over to `.env` first and then appends. You get a
> `.env` seeded with every placeholder from your example file. Create an empty
> `.env` first if that is not what you want.

Run `license list` before issuing a new one — free-tier licenses expire about a
month out, and it is easy to accumulate several and then wire up the oldest.

What the token actually is: an EdDSA-signed JWT, verified **offline** against a
public key bundled in `@copilotkit/license-verifier`. No login, no network call
at runtime. Its expiry is what eventually locks the drawer.

### Optional: check it before writing any code

Ten seconds, and it tells you whether the rest is worth doing. From your
frontend directory, so the package resolves:

```bash
cat > lic-check.mjs <<'EOF'
import fs from "node:fs";
import { createLicenseChecker } from "@copilotkit/license-verifier";
const src = fs.readFileSync(".env.local", "utf8");   // or .env
const tok = /^COPILOTKIT_LICENSE_TOKEN=(.*)$/m.exec(src)[1].trim();
const s = createLicenseChecker(tok).getStatus();
console.log("valid:", s.valid, "| error:", s.error, "| severity:", s.warningSeverity);
console.log("expires:", s.license?.expires_at, "| tier:", s.license?.tier);
console.log("features:", s.license?.features);
EOF
node lic-check.mjs && rm lic-check.mjs
```

Want `valid: true`, `error: null`, `severity: none`.

<a id="checkfeature"></a>
**Ignore `checkFeature("threads")` if you try it — it returns `false` on a
perfectly valid license.** There is no bare `threads` entry in
`LICENSED_FEATURES` (only `threads.retention_hours` and `threads.max_count`),
and nothing in the runtime calls it: `resolveLicenseStatus` uses `getStatus()`
alone. The browser-side `checkFeature` is a *different* function from
`@copilotkit/shared` that returns `true` unless the status is `expired` or
`invalid`. Chasing that `false` is a dead end.

---

## Step 4 — Put the values where your framework reads them

The CLI writes `./.env`. Whether your app reads that file is your problem, not
the CLI's.

| Frontend | Reads | So run the CLI from |
|---|---|---|
| Next.js | `.env`, `.env.local` (and `.env.development`) in the **Next project root** | `frontend/` |
| Angular / Vite | `.env` in the project root, via its own loader | `frontend/` |

For Next.js specifically: a repo-root `.env` is **not** read. If you ran the CLI
at the repo root, move the two lines into `frontend/.env.local`.

Only two variables are actually required:

```bash
COPILOTKIT_LICENSE_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkxJQyI...
INTELLIGENCE_API_KEY=cpk-<project>_<...>
```

`INTELLIGENCE_API_URL` and `INTELLIGENCE_GATEWAY_WS_URL` are **optional** —
`CopilotKitIntelligence` defaults to `https://api.intelligence.copilotkit.ai` and
`wss://realtime.intelligence.copilotkit.ai`. Set them only for a self-hosted
deployment, and set **both** if you set either: they are different hosts, and
overriding one points the REST and realtime planes at different deployments.

Two rules:

- **No `NEXT_PUBLIC_` prefix.** These are server-side. The runtime reads the
  license and reports only its *status* to the browser via `/info`.
- **Confirm the file is gitignored** before pasting a real key:
  `git check-ignore -v frontend/.env.local`.

---

## Step 5 — Add a second runtime endpoint

Credentials done; now Gate 1. **Do not convert your existing `/api/copilotkit`
route.** Keep it exactly as the docs write it — it is what your Quickstart and
Copilot Runtime pages display and diff against. Add a second endpoint.

Create `frontend/src/app/api/copilotkit-threads/[[...slug]]/route.ts`. The
`[[...slug]]` catch-all is required; that *is* Gate 1's server half.

```ts
import {
  CopilotRuntime,
  CopilotKitIntelligence,
  InMemoryAgentRunner,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { HttpAgent } from "@ag-ui/client";

const AGENT_URL = process.env.MY_AGENT_URL ?? "http://localhost:8000";
const LICENSE_TOKEN = process.env.COPILOTKIT_LICENSE_TOKEN;

const runtime = new CopilotRuntime({
  // `default` matters: <CopilotThreadsDrawer> and useThreads fall back to
  // DEFAULT_AGENT_ID ("default") when given no agentId, and threads are stored
  // per agent id. Register it even if your other route uses different names.
  agents: {
    default: new HttpAgent({ url: `${AGENT_URL}/` }),
    // ...plus whatever ids your framework's agents use
  },

  ...(LICENSE_TOKEN
    ? {
        // apiUrl/wsUrl omitted on purpose — they default to managed Intelligence.
        intelligence: new CopilotKitIntelligence({
          apiKey: process.env.INTELLIGENCE_API_KEY ?? "",
        }),
        generateThreadNames: true,
        // Threads are stored per user, so the runtime must name one. A static
        // value is demo-only — the docs say so explicitly. Reading a header
        // makes multi-user isolation testable without real auth.
        identifyUser: (request: Request) => {
          const id = request.headers.get("x-copilotkit-user-id") ?? "demo-user";
          return { id, name: id === "demo-user" ? "Demo User" : id };
        },
        licenseToken: LICENSE_TOKEN,
      }
    // No token? Degrade instead of crashing — see Step 8.
    : { runner: new InMemoryAgentRunner() }),
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit-threads",
});

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
```

Two portability notes:

- **`createCopilotRuntimeHandler` returns a plain `(Request) => Promise<Response>`,
  so no `hono` dependency is needed.** CLI starters use `createCopilotEndpoint` +
  `handle` from `hono/vercel` instead; both work and both exist since 1.65.0.
  Prefer the plain handler in a repo that does not already depend on hono.
- `licenseToken` falls back to `process.env.COPILOTKIT_LICENSE_TOKEN` on its own;
  passing it explicitly is only for readability.

---

## Step 6 — Add a provider for the threads routes

Gate 1's client half. Create `frontend/src/components/threads-provider.tsx` and
wrap **only** your threads pages. Nesting it inside an app-wide
`CopilotKitProvider` is fine — the inner one wins for its subtree.

```tsx
"use client";

import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import type { ReactNode } from "react";

const AUTH_TOKEN = process.env.NEXT_PUBLIC_AUTH_BEARER_TOKEN; // only if your backend needs one

export function ThreadsProvider({ children }: { children: ReactNode }) {
  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit-threads"
      // Thread routes are dispatched only in multi-route mode, and leaving this
      // on auto-detect races the lazily-compiled API route under `next dev`.
      useSingleEndpoint={false}
      {...(AUTH_TOKEN ? { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } } : {})}
      showDevConsole="auto"
      onError={(e) => console.error(`[CopilotKit ${e.code}]`, e.error)}
    >
      {children}
    </CopilotKitProvider>
  );
}
```

If your backend enforces a bearer token, **forward it here too** — this provider
does not inherit the outer one's `headers`. Forgetting it produces a thread list
that loads fine and an agent that 401s, which reads like a threads problem and is
not.

---

## Step 7 — Verify

Server first, browser second. Do not skip to the UI.

```bash
curl -s localhost:3000/api/copilotkit-threads/info \
  | jq '{mode, licenseStatus, threadEndpoints}'
```

Must print:

```json
{
  "mode": "intelligence",
  "licenseStatus": "valid",
  "threadEndpoints": { "list": true, "inspect": true, "mutations": true, "realtimeMetadata": true }
}
```

```bash
curl -s "localhost:3000/api/copilotkit-threads/threads?agentId=default" | jq '.threads | length'
```

Must return a number, not a 422.

Then in a browser:

1. Send a message on a threads page. A row appears, auto-named a second or two
   after the reply finishes.
2. **Reload the page.** The row is still there and selecting it replays the
   transcript. This is the only step that proves the platform rather than local
   state.
3. User scoping:
   ```bash
   curl -s -H "x-copilotkit-user-id: someone-else" \
     "localhost:3000/api/copilotkit-threads/threads?agentId=default" | jq '.threads | length'
   ```
   Should be `0` while your default user has rows.
4. Confirm you did not break the documented route:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/api/copilotkit/threads
   ```
   `404` is correct and expected. That route is not supposed to serve threads.

---

## Step 8 — What works with no license at all

Worth knowing before you decide you need credentials. With the
`InMemoryAgentRunner` fallback from Step 5 and no token, the runtime still serves
a documented local-dev fallback:

| Route | No license | With license |
|---|---|---|
| `GET /threads` | ✅ from memory | ✅ from platform |
| `GET /threads/:id/messages` | ✅ | ✅ |
| `GET /threads/:id/events` | ✅ | ✅ |
| `GET /threads/:id/state` | ✅ | ✅ |
| `DELETE /threads` (clear all) | ✅ | no-op by design |
| `PATCH /threads/:id` (rename) | ❌ 422 | ✅ |
| archive / unarchive / delete one | ❌ 422 | ✅ |
| `POST /threads/subscribe` (realtime) | ❌ 422 | ✅ |
| `<CopilotThreadsDrawer>` | ❌ locked panel | ✅ |
| `useThreads` (headless) | ✅ list/read only | ✅ full |

So a **Headless Threads** page is genuinely testable with zero credentials — list
and history replay both work. A **Threads Drawer** page is not: the drawer is
license-gated regardless of whether its routes answer. Nothing survives a process
restart in the in-memory case.

---

## Per-repo differences

Everything above is identical across repos. These are the only lines to adjust:

| What | Where | How to find the right value |
|---|---|---|
| Agent URL env var | `AGENT_URL` in the route | Copy what your existing route uses (`MS_AGENT_URL`, `AGNO_AGENT_URL`, …). |
| Agent ids and endpoints | `agents: {}` | Mirror your existing route, then **add `default`**. |
| Agent class | `new HttpAgent({ url })` | Frameworks speaking AG-UI natively use `HttpAgent`. If your existing route imports a framework-specific agent class, use that same one here. |
| Bearer header | `ThreadsProvider` | Only if your backend has auth middleware. |
| Backend | — | **Nothing.** Do not touch it. |

### Angular repos

Steps 1–5 and 7–8 apply unchanged: the CLI, the credentials, and the runtime
route are all frontend-framework-agnostic, and `@copilotkit/angular` 0.3.1 reads
the same server-reported `licenseStatus` from `/info` and gates its threads
drawer on it exactly like React does.

**Step 6 does not port as written.** `@copilotkit/angular` 0.3.1 has no
`useSingleEndpoint` — the string does not appear in its bundle. Before assuming
threads are broken there, check what its provider exposes and whether it defaults
to multi-route:

```bash
grep -c "useSingleEndpoint\|singleEndpoint" \
  frontend/node_modules/@copilotkit/angular/dist/fesm2022/copilotkit-angular.mjs
```

If it is `0`, the transport is not configurable that way and you need to find the
Angular equivalent — verify with `curl` on `/info` (Step 7) rather than guessing
from the UI. This is untested here; treat it as the open question for those repos.

> The free-tier license lists `sdk.angular: false` in its features. That flag is
> **not** enforced by anything in `@copilotkit/angular` 0.3.1 or the runtime — the
> runtime only ever calls `getStatus()`, never `checkFeature`. Do not let it send
> you down a blind alley, and see [the `checkFeature` note](#checkfeature).

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `404` on every `/api/copilotkit-threads/*` | Route file is not a `[[...slug]]` catch-all, or `basePath` does not match the URL. | Check the directory is literally named `[[...slug]]`. |
| `422 Missing CopilotKitIntelligence configuration` | No `intelligence` on the runtime — usually `COPILOTKIT_LICENSE_TOKEN` is unset, so the ternary took the in-memory branch. | Confirm the var is in the file your app reads (Step 4) and restart the dev server. |
| `/info` has no `licenseStatus` key | Same cause. It is only emitted for an Intelligence runtime. | As above. |
| Drawer locked, but `curl` on `/threads` returns rows | Gate 3. The client sees `licenseStatus` absent, `expired`, or `invalid`. | Check `/info`; if `valid`, check the provider's `runtimeUrl` points at the threads endpoint. |
| CLI wrote `.env` but nothing changed | You ran it from the repo root and Next.js only reads the frontend root. | Move the two lines to `frontend/.env.local` (Step 4). |
| `.env` suddenly full of placeholders | `license` copied `.env.example` over a missing `.env` before appending. | Delete the placeholder lines; create an empty `.env` before running it next time. |
| Thread list loads, agent replies 401 | Bearer token not forwarded by `ThreadsProvider`. | Add `headers` — it does not inherit from the outer provider. |
| Empty list on a runtime you know has threads | Wrong `agentId`. Threads are stored per agent id and the default is literally `"default"`. | Register a `default` agent, or pass `agentId` explicitly everywhere. |
| Works on first load, empty after HMR | Transport auto-detect raced the lazily-compiled API route. | `useSingleEndpoint={false}`. |
| `checkFeature("threads")` is `false` on a valid license | Expected, and inert. | See [the note](#checkfeature). |
| A test or recording fails "agent never responded" on first hit | The dev server was still compiling the route. | Warm the route once, then re-run. |

---

## Fallback: borrowing credentials from a scaffolded project

If the CLI cannot run where you need it — no browser, locked-down CI — the two
values are portable. Copy `COPILOTKIT_LICENSE_TOKEN` and `INTELLIGENCE_API_KEY`
out of any project `copilotkit init` has already scaffolded and into your
frontend env file. That is all Steps 1–3 produce.

One consequence worth accepting deliberately: repos sharing a key write threads
into the **same Intelligence project**. Threads are partitioned by `agentId` and
by whatever `identifyUser` returns, not by which repo made the call. Give each
repo a distinct `agentId` or user id if you want them separated.

---

## Things to write down for whoever reads your repo next

- **The license expiry date and tier.** A free-tier token expires ~30 days out.
  When it does the drawer flips to `expiring` through a grace period and then
  locks — and it will look like your code broke. `copilotkit license list` shows
  every license and its expiry.
- **That `identifyUser` is static.** Every browser shares one thread list. Fine
  for QA, wrong for anything else.
- **Which Intelligence project the threads land in**, especially if several repos
  share one key.
- **That threads accumulate.** Every test run and every recorded video leaves a
  real row on the platform, against the free tier's 200-thread cap.

---

## Version note

Verified against CLI **4.8.3**, `@copilotkit/runtime` and `@copilotkit/react-core`
**1.68.2**, `@copilotkit/angular` **0.3.1**, with a CLI starter on 1.65.0. The
gates behaved identically on 1.65.0 and 1.68.2. Before assuming they still hold
on a newer release, re-run the `grep` in [the gates section](#the-three-gates)
and check your repo's actual version rather than the newest published one:

```bash
node -p "require('./frontend/node_modules/@copilotkit/runtime/package.json').version"
npx copilotkit@latest version
```
