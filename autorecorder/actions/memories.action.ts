import { type Page } from 'playwright';
import { promptsFor, sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { sleep } from '../core/overlays/cursor';
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { waitForDomSettled } from './page-ready';
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

export const runMemoriesAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  _rootPath: string,
  ctx: ActionContext,
) => {
  const prompts = promptsFor(config);

  // Pass 1 -- as documented.
  console.log('   [Memories] 1/2: the runtime the page describes...');
  await waitForText(page.locator('[data-testid=memory-isLoading]'), (t) => t === 'false', 20_000);
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
  await waitForText(page.locator('[data-testid=memory-isLoading]'), (t) => t === 'false', 20_000);
  await glideTo(page, page.locator('[data-testid=memory-list]'), 1500);
  const opened = await save(page, ctx, 'memory.access runtime');
  console.log(`   [Memories] save with memory.access: ${opened}`);

  // This repo's recorder has no `knownIssue`, so the finding rides on the
  // result as a warning: the take is usable, and what it shows is a defect.
  ctx.warn(
    `Memory unusable as documented -- documented runtime save: "${documented}"; ` +
      `with the undocumented memory.access option: "${opened}"`,
  );
};
