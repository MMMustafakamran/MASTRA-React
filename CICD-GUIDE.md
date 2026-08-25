# Agent CI/CD Transformation & Troubleshooting Guide (Mastra)

> **Target Audience:** AI Agents & Engineers porting or maintaining the Mastra CopilotKit repository with an automated, sharded CI/CD daily recording pipeline.
> **Design Goal:** Token-efficient, dense, high-signal actionable blueprint and pitfall reference.

---

## 1. Target Architecture & Components

```
                        GitHub Actions Matrix (3 Parallel Workers)
 ┌─────────────────────────────────┬─────────────────────────────────┬─────────────────────────────────┐
 │ Worker 1/3 (Pages 1-8)          │ Worker 2/3 (Pages 9-16)         │ Worker 3/3 (Pages 17-22)        │
 │ [xvfb-run 1920x1080 display]    │ [xvfb-run 1920x1080 display]    │ [xvfb-run 1920x1080 display]    │
 │  ├── Next.js + Mastra (:3000)   │  ├── Next.js + Mastra (:3000)   │  ├── Next.js + Mastra (:3000)   │
 │  ├── Pre-warmed /api/copilotkit │  ├── Pre-warmed /api/copilotkit │  ├── Pre-warmed /api/copilotkit │
 │  └── Playwright Recorder        │  └── Playwright Recorder        │  └── Playwright Recorder        │
 └────────────────┬────────────────┴────────────────┬────────────────┴────────────────┬────────────────┘
                  │                                 │                                 │
                  └─────────────────────────────────┼─────────────────────────────────┘
                                                    ▼
                             Downstream Merge Job: `consolidate-recordings`
                             Combines all *.webm + RUN_REPORT into 1 unified ZIP
```

---

## 2. Porting Checklist (Files Implemented)

1. **`scripts/check-doc-drift.mjs`**: Standalone live doc hash verifier against `doc-snapshot/manifest.json`.
2. **`scripts/automate.mjs`**: Single-process Node orchestrator (starts Next.js server, pre-warms `/api/copilotkit`, polls health, drives recorder, cleans up processes, outputs `RUN_REPORT.md`/`json`).
3. **`autorecorder/cli.ts`**: Supports `--shard=K/N`, `--only=...`, `--pages=...`, and `--limit=...` CLI flags with empty shard guards.
4. **`.github/workflows/daily-recorder.yml`**: Matrix workflow (3 workers) with `xvfb-run`, interactive 22-page selection checkboxes, and artifact consolidation.
5. **`package.json`**: Root workspace scripts (`npm run automate`, `npm run record`, `npm run dev`, etc.).
6. **`automate.bat`**: Windows one-click local runner.

---

## 3. Core Implementation Blueprints

### Blueprint A: Single-Process Orchestrator (`scripts/automate.mjs`)
* **Why:** In GitHub Actions, each YAML `run:` step runs in a distinct subshell. Running `next dev &` in Step 1 causes background processes to be killed by the runner's process reaper when the subshell terminates.
* **Solution:** Spawn Next.js (which hosts Mastra agents via `getLocalAgents`) within a single persistent Node process:
```javascript
// Spawn with process group isolation and ignored stdio
const frontendProc = spawn('npm run dev', {
  cwd: path.join(ROOT, 'frontend'),
  stdio: 'ignore',
  shell: true,
  detached: process.platform !== 'win32',
});

// Teardown hook: Taskkill on Win32, process group kill on POSIX
function killTree(proc) {
  if (!proc?.pid) return;
  try {
    process.platform === 'win32'
      ? execSync(`taskkill /pid ${proc.pid} /T /F 2>nul || exit 0`, { stdio: 'ignore' })
      : process.kill(-proc.pid, 'SIGTERM');
  } catch {
    proc.kill('SIGTERM');
  }
}
```

### Blueprint B: Lazy API Route Pre-Warming
* **Why:** Next.js dev server compiles API routes (`/api/copilotkit`) on demand upon first request. If the recorder hits the UI before the route is compiled, the first LLM prompt incurs a 45–60s cold-start compilation overhead, causing Playwright to time out.
* **Solution:** Pre-warm `/api/copilotkit` during health checks:
```javascript
await fetch('http://127.0.0.1:3000/api/copilotkit', { signal: AbortSignal.timeout(15000) });
```

### Blueprint C: CLI Matrix Sharding (`autorecorder/cli.ts`)
```typescript
const shardMatch = rawArgs.find((a) => a.startsWith('--shard='));
if (shardMatch) {
  const [curr, total] = shardMatch.split('=')[1].split('/').map((n) => parseInt(n, 10));
  if (total > 0 && curr > 0 && curr <= total) {
    const chunkSize = Math.ceil(targetPages.length / total);
    const start = (curr - 1) * chunkSize;
    targetPages = targetPages.slice(start, Math.min(start + chunkSize, targetPages.length));
  }
}

// CRITICAL: Exit 0 if shard gets 0 pages (e.g. 1 page selected across 3 workers)
if (targetPages.length === 0) {
  if (shardMatch) {
    console.log('ℹ️ No pages assigned to this shard. Exiting cleanly.');
    process.exit(0);
  }
  process.exit(1);
}
```

### Blueprint D: GitHub Actions Matrix & Merge Strategy
```yaml
jobs:
  record-workers:
    name: Worker ${{ matrix.shard }}/3
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix: { shard: [1, 2, 3] }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: cd autorecorder && npm install && npx playwright install --with-deps chromium
      - run: xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24" node scripts/automate.mjs --shard=${{ matrix.shard }}/3
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: demo-recordings-shard-${{ matrix.shard }}
          path: autorecorder/videos/*

  consolidate-recordings:
    name: Consolidate & Merge All Video Artifacts
    needs: record-workers
    if: always()
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with: { path: all-recordings, pattern: demo-recordings-shard-*, merge-multiple: true }
      - uses: actions/upload-artifact@v4
        with: { name: demo-recordings-all-${{ github.sha }}, path: all-recordings/ }
```

---

## 4. Post-Mortem Pitfalls & Lessons Learned

| # | Pitfall Encountered | Root Cause | Permanent Rule / Fix |
|---|---|---|---|
| **1** | **Headless Linux Display Crash** | `browserType.launch({ headless: false })` crashes on Ubuntu CI with `Missing X server or $DISPLAY`. | **Always** wrap CLI execution in CI with `xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24"`. |
| **2** | **Child Process Pipe Buffer Freeze** | Spawning Next.js dev server via Node with `stdio: 'pipe'` freezes on Windows/Linux when the 64KB OS buffer fills up. | Set `stdio: 'ignore'` on spawned server daemons unless actively draining output streams. |
| **3** | **Playwright vs DOM CSS Selectors** | Non-standard selectors like `button:has-text("Send")` fail inside `document.querySelector` / `waitForFunction` browser contexts. | Use standard CSS in selectors (e.g. `[data-testid="..."], button[type="submit"]`) and wrap `querySelector` in `try / catch`. |
| **4** | **CRLF vs LF Hash Drift** | Windows checkout converts git line endings to CRLF (`\r\n`), causing false-positive doc drift against Linux baselines. | Strip BOM (`/^\uFEFF/`) and normalize `\r\n` $\rightarrow$ `\n` before computing SHA256 hashes. |
| **5** | **Empty Shard Failure** | When running with fewer pages than workers (e.g. 1 page with 3 workers), Shards 2 and 3 receive 0 pages and error out. | Add guard: `if (targetPages.length === 0 && isShard) process.exit(0)`. |
| **6** | **Next.js Route Cold-Start Timeout** | Next.js compiles API routes lazily on first hit, leading to first LLM prompt timeout. | Issue a pre-flight GET request to `/api/copilotkit` during pipeline initialization to warm the route. |
| **7** | **Doctor Range Drift** | Updating frontend files changes line numbers, failing static adaptation checks in `pages.config.ts`. | Run `npm run doctor` to verify highlighted line numbers match actual file content boundaries. |
