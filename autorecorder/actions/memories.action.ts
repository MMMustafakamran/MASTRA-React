import { type Page } from 'playwright';
import { promptsFor, sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { sleep } from '../core/overlays/cursor';
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { waitForDomSettled } from './page-ready';
import { copilotkitVersionLine, markServerLogs, showEvidence } from './error-evidence';
import { glideClick, glideTo, visibleWithin, waitForText } from './glide-click';

/**
 * Memories & Recall -- the documented runtime, then the undocumented option.
 *
 * Pass one is the page as written, on the Intelligence Quickstart's runtime
 * (`/api/copilotkit-threads`): its memory routes 404 at the runtime, and the
 * agent cheerfully says it will remember. What the save button shows depends
 * on whether that runtime is in Intelligence mode -- with
 * COPILOTKIT_LICENSE_TOKEN set (CI) the client reaches the 404; without it
 * (local) the client never sends the request and reports "Runtime URL is not
 * configured". The warning carries whichever it was. Pass two switches to the same runtime with
 * `memory: { access }` added -- the option the page never mentions -- and saves
 * again, so the clip ends on what the platform itself says about this project.
 *
 * Nothing here fails the take on a 404 or 403: those are the finding, and the
 * take reports them as a warning (`[PASS*]`). The handler only fails
 * when the surface it needs to film is missing.
 */

/** The fixed part of the note; what the saves returned is appended per take. */
const NOTE = [
  'memories - never works the way the page says',
  '',
  'page imports useMemories from @copilotkit/react-core. not exported there, only /v2',
  'as documented (intelligence quickstart runtime): /memories is a 404 from our own runtime.',
  'the runtime hides those routes unless it gets memory: { access } - page never says',
  'no license token locally -> that runtime is not in intelligence mode,',
  'so the hook never even asks and save says "runtime url is not configured"',
  '',
  'with memory.access the platform answers 403 MEMORY_NOT_ENTITLED,',
  'but the hook still says isAvailable true and the list renders empty.',
  'page says unentitled shows as isAvailable false. it does not',
];

async function save(page: Page, ctx: ActionContext, label: string): Promise<string> {
  const button = page.locator('[data-testid=memory-save]');
  if (!(await visibleWithin(button, 8000))) {
    ctx.fail(`${label}: the save button never rendered`);
    return '';
  }
  await glideClick(page, button);
  const result = await waitForText(
    page.locator('[data-testid=memory-save-result]'),
    (t) => t.length > 0 && !t.startsWith('saving'),
    20_000,
  );
  await glideTo(page, page.locator('[data-testid=memory-probe]'), 2500);
  return result;
}

/**
 * Waits until the hook has heard back from the runtime: `isAvailable` flips to
 * false (a 404) or an error shows up. `isLoading` is no signal -- it reads
 * false before the memory store has even started, and a save clicked then
 * fails client-side with "Runtime URL is not configured", which says nothing
 * about the runtime under test. Times out quietly: a runtime that never gets
 * asked (no Intelligence connection -- the documented runtime in a local run
 * without COPILOTKIT_LICENSE_TOKEN) is itself what the take shows.
 */
async function settledMemory(page: Page): Promise<void> {
  const deadline = Date.now() + 25_000;
  while (Date.now() < deadline) {
    const available = (await page.locator('[data-testid=memory-isAvailable]').textContent().catch(() => '')) ?? '';
    const error = (await page.locator('[data-testid=memory-error]').textContent().catch(() => '')) ?? '';
    if (available.trim() === 'false' || (error.trim() && error.trim() !== 'null')) return;
    await sleep(500);
  }
}

export const runMemoriesAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  rootPath: string,
  ctx: ActionContext,
) => {
  const logs = markServerLogs(rootPath);
  const prompts = promptsFor(config);

  // Pass 1 -- as documented.
  console.log('   [Memories] 1/2: the runtime the page describes...');
  await settledMemory(page);
  await glideTo(page, page.locator('[data-testid=memory-list]'), 1500);
  const documented = await save(page, ctx, 'documented runtime');
  console.log(`   [Memories] save on the documented runtime: ${documented}`);

  const msgCount = await sendPrompt(page, prompts[0]);
  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 3000, msgCount);

  // Pass 2 -- with the option the page leaves out.
  console.log('   [Memories] 2/2: the same runtime with memory.access...');
  await glideClick(page, page.locator('[data-testid=memory-runtime-memory-access]'));
  await sleep(500);
  await waitForDomSettled(page, { settleMs: 1500 });
  await settledMemory(page);
  await glideTo(page, page.locator('[data-testid=memory-list]'), 1500);
  const opened = await save(page, ctx, 'memory.access runtime');
  console.log(`   [Memories] save with memory.access: ${opened}`);

  // This repo's recorder has no `knownIssue`, so the finding rides on the
  // result as a warning: the take is usable, and what it shows is a defect.
  ctx.warn(
    `Memory unusable as documented -- documented runtime save: "${documented}"; ` +
      `with the undocumented memory.access option: "${opened}"`,
  );

  await showEvidence(page, logs, {
    fileName: 'memories.txt',
    // What the saves returned, as observed -- the documented-runtime save
    // depends on whether that runtime is in Intelligence mode, so the note
    // quotes this take rather than asserting one.
    text: [
      ...NOTE,
      '',
      `save, as documented: ${documented}`,
      `save, with memory.access: ${opened}`,
      '',
      copilotkitVersionLine(rootPath),
    ].join('\n'),
  }, { relevant: /memor|MEMORY_/i });
};
