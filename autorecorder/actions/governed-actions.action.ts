import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';

/**
 * Governed Action Approval UI.
 *
 * The standard action would type the prompt and wait, which on this page means
 * filming an approval card that never gets approved -- the run stays suspended
 * on the tool call until someone clicks, so the clip would end on a spinner.
 *
 * So: prompt, let the card render, read it the way a reviewer would (the
 * arguments block is the part the page says you must show before approving),
 * then click "Approve and run" and wait for the agent to continue.
 */
export const runGovernedActionsAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Governed Actions] Prompting for a side-effecting action...`);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 15000 });

  // The card is a tool-call render inside the chat, so it arrives a beat after
  // the assistant starts responding.
  const card = page.locator('section:has-text("User approval required")').first();
  const appeared = await card.isVisible({ timeout: 20000 }).catch(() => false);

  if (!appeared) {
    // Not a hard failure: the model can answer in prose instead of calling the
    // tool, which is itself worth having on film. Fall through to the wait so
    // the clip ends on whatever it did do.
    console.log(`   ⚠️  No approval card -- the model did not call the tool.`);
    await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000, msgCount);
    return;
  }

  // Glide over the arguments the page insists you show before approving.
  const args = card.locator('pre').first();
  if (await args.isVisible({ timeout: 3000 }).catch(() => false)) {
    const box = await args.boundingBox();
    if (box) {
      await humanGlide(page, box.x + box.width / 2, box.y + box.height / 2, 22);
      await sleep(1800);
    }
  }

  const approve = card.locator('button:has-text("Approve and run")').first();
  if (await approve.isVisible({ timeout: 4000 }).catch(() => false)) {
    const box = await approve.boundingBox();
    if (box) {
      await humanGlide(page, box.x + box.width / 2, box.y + box.height / 2, 20);
      await sleep(400);
      await humanClick(page);
      console.log(`   ✓ Approved the action -- the run should now continue.`);
    }
  }

  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 6000, msgCount);
};
