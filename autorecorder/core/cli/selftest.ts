/**
 * Proves the CLI driver works on this machine, without touching a real CLI.
 *
 * The driver depends on a native pseudo-terminal and on parsing a repainting
 * TUI. Both are environment-sensitive and both fail in ways that look like the
 * *target* CLI misbehaving — a wrong framework selected, a prompt that "never
 * appeared". Running this first separates "the recorder is broken here" from
 * "the CLI changed", which is otherwise an afternoon of guessing.
 *
 * The fixture imitates the four prompt shapes that matter: a conditional y/n
 * confirm, a text field, an arrow-navigated list that repaints in place and
 * wraps, and a single-keypress prompt that acts without Enter.
 *
 * Run it after copying this folder into a new repo, before adapting anything.
 */
import { join } from 'node:path';
import { runCliFlow, type CliRunResult } from './driver';
import { type CliFlowConfig } from './flow';
import { startService } from './service';

/** The row the self-test navigates to — deliberately not the first or last. */
const TARGET_ROW = 'Microsoft Agent Framework (Python)';

/**
 * Built by hand rather than through `defineCliFlows` so it carries no registry
 * position: it is machinery verification, not one of this repo's flows, and it
 * must not take a number in the cast sequence.
 */
export const SELFTEST_FLOW: CliFlowConfig = {
  id: 'selftest',
  name: 'CLI driver self-test',
  castName: 'Selftest',
  order: 0,
  castFile: 'selftest.cast',
  reportFile: 'selftest.report.json',
  cwd: 'autorecorder',
  command: 'node',
  args: ['core/cli/fixtures/fake-cli.cjs'],
  cols: 100,
  rows: 24,
  timeoutMs: 60_000,
  stepTimeoutMs: 15_000,
  steps: [
    {
      label: 'conditional confirm',
      waitFor: /Ok to proceed/i,
      optional: true,
      type: 'y',
      keys: ['Enter'],
    },
    {
      label: 'text field',
      waitFor: /App name/i,
      type: 'app',
      keys: ['Enter'],
      settleMs: 250,
    },
    {
      label: 'select row by label',
      waitFor: /Select agent framework/i,
      select: { label: TARGET_ROW, max: 20 },
      keys: ['Enter'],
      settleMs: 250,
      // The fixture echoes its choice, so this catches a selection that landed
      // on the wrong row even though the walk reported success.
      expect: new RegExp(`Selected: ${TARGET_ROW.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
    },
    {
      label: 'single keypress, no Enter',
      waitFor: /install the dependencies/i,
      type: 'n',
    },
  ],
};

export interface SelfTestOutcome {
  ok: boolean;
  result: CliRunResult;
  /** Human-readable reason when `ok` is false. */
  reason?: string;
}

/**
 * Proves the service runner: a process that prints progress, becomes ready
 * later, and never exits.
 *
 * Separate from the flow self-test because it fails differently. The flow driver
 * fails by mis-answering a prompt; this fails by hanging — waiting for an exit
 * that will never come, or calling a compiling server ready and filming the
 * wrong thing.
 */
async function checkServiceRunner(rootDir: string): Promise<string | null> {
  try {
    const service = await startService(
      {
        cwd: 'autorecorder',
        command: 'node',
        args: ['core/cli/fixtures/fake-server.cjs'],
        env: { PORT: '3999' },
        readyPattern: /Ready in/i,
        readyTimeoutMs: 20_000,
        settleMs: 200,
      },
      { rootDir, echo: false, title: 'fake dev server' },
    );

    await service.stop();

    if (service.cast.events.length === 0) {
      return 'The dev server produced a cast with no events — its boot was not captured.';
    }
    // The fixture compiles for ~750ms before printing its ready line, so a
    // runner that returned on the first byte would come back far too fast.
    if (service.bootSeconds < 0.5) {
      return `Reported ready in ${service.bootSeconds}s, before the fixture could have finished compiling — the ready check is matching too early.`;
    }
    return null;
  } catch (e) {
    return `Dev server runner failed: ${e instanceof Error ? e.message : String(e)}`;
  }
}

export async function runSelfTest(
  rootDir: string,
  outDir: string,
): Promise<SelfTestOutcome> {
  const result = await runCliFlow(SELFTEST_FLOW, {
    rootDir,
    outDir,
    echo: false,
  });

  if (!result.success) {
    return { ok: false, result, reason: result.error };
  }

  const select = result.steps.find((s) => s.label === 'select row by label');
  if (select?.landedOn !== TARGET_ROW) {
    return {
      ok: false,
      result,
      reason: `Selection landed on "${select?.landedOn ?? 'nothing'}", expected "${TARGET_ROW}".`,
    };
  }

  // The fixture's list wraps and the target sits five rows down, so a driver
  // that walked the wrong way round would still arrive — after far more
  // keypresses than the list is long. Catching that here keeps the wrap
  // handling honest.
  if ((select.keypresses ?? 0) > 10) {
    return {
      ok: false,
      result,
      reason: `Reached the row in ${select.keypresses} keypresses; the list is 7 long, so the walk is not stopping where it should.`,
    };
  }

  const serviceProblem = await checkServiceRunner(rootDir);
  if (serviceProblem) {
    return { ok: false, result, reason: serviceProblem };
  }

  return { ok: true, result };
}

/** Where the self-test writes, so callers do not duplicate the path. */
export function selfTestOutDir(autorecorderDir: string): string {
  return join(autorecorderDir, 'casts');
}
