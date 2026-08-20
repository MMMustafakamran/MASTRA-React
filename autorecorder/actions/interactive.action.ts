import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';

/**
 * The approval gate from the Interactive doc page.
 *
 * `useHumanInTheLoop` registers `humanApprovedCommand` with a `render` and no
 * handler. The run suspends on the tool call and stays suspended until
 * `respond` fires, so the click is not decoration -- nothing further streams
 * until it happens, and the string the button sends becomes the tool result the
 * model reads next.
 *
 * Unlike a chooser whose options the agent invents, both buttons here are fixed
 * strings the page hard-codes, so they can be matched exactly.
 */
const CARD = 'p:text-is("Approval required")';
const APPROVE = 'button:text-is("Approve")';

export const runInteractiveAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Interactive] Prompting to trigger the approval interrupt...`);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 12000 });

  console.log(`   Waiting for the approval card to render in the message stream...`);
  const card = page.locator(CARD).last();
  await card.waitFor({ state: 'visible', timeout: 25000 }).catch(() => {});

  const approve = page.locator(APPROVE).last();
  if (!(await approve.isVisible({ timeout: 3000 }).catch(() => false))) {
    // The run is paused waiting for `respond`, so nothing further will ever
    // stream. Failing here is the honest outcome -- the interrupt is the page.
    throw new Error(
      'Approval card never rendered: no "Approve" button appeared within 25s. ' +
        'Either the agent answered in plain text instead of calling ' +
        'humanApprovedCommand, or the `status !== "executing"` guard is hiding ' +
        'the card.',
    );
  }

  // Let the proposed command sit on screen long enough to read before deciding.
  await sleep(2500);

  const box = await approve.boundingBox();
  if (box) {
    console.log(`   🎯 Approving the command`);
    await humanGlide(page, box.x + box.width / 2, box.y + box.height / 2, 20);
    await sleep(600);
    await humanClick(page);
  } else {
    await approve.click();
  }

  // Only now does the run resume, so this is the reply that matters.
  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000, msgCount);
};
