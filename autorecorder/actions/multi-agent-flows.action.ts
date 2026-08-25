import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { promptsFor, sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { waitForDomSettled } from './page-ready';

/**
 * Router mode versus agent lock mode -- the doc page's two answers to "which
 * agent does this run go to".
 *
 * The same question is asked both ways on purpose. In router mode no `agentId`
 * is passed, so the runtime resolves to `default`, which is the tool-less
 * quickstart agent and can only answer in prose. Locked to `weather_agent` the
 * identical question triggers a real `get_weather` call. Asking two *different*
 * questions would prove nothing about routing.
 *
 * The doc frames the choice on the `<CopilotKit>` provider. Two providers cannot
 * coexist on one page, so the demo expresses it one level down -- `<CopilotChat>`
 * with or without `agentId`, under a provider that names no agent.
 */
const LOCK_ID = 'weather_agent';

export const runMultiAgentFlowsAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  const prompts = promptsFor(config);

  // ── Router mode (already selected on load) ────────────────────────────────
  console.log(`   [Multi-Agent Flows] 1/2: router mode -- no agent named...`);
  const routerCount = await sendPrompt(page, prompts[0], { timeoutMs: 12000 });
  await waitForAgentResponseCompletion(
    page,
    config.waitAfterPromptMs ?? 3000,
    routerCount,
  );
  await sleep(1200);

  // ── Agent lock mode ───────────────────────────────────────────────────────
  console.log(`   [Multi-Agent Flows] 2/2: switching to agent lock mode...`);
  const lockTab = page.locator('button:text-is("Agent lock mode")').first();
  await lockTab.waitFor({ state: 'visible', timeout: 10000 });
  const lBox = await lockTab.boundingBox();
  if (lBox) {
    await humanGlide(page, lBox.x + lBox.width / 2, lBox.y + lBox.height / 2, 20);
    await humanClick(page);
  } else {
    await lockTab.click();
  }
  await sleep(400);
  await waitForDomSettled(page, { settleMs: 800 });

  // Pick the agent that actually has a tool, so the contrast is visible.
  console.log(`   Locking to "${LOCK_ID}"...`);
  const idButton = page.locator(`button:text-is("${LOCK_ID}")`).first();
  if (await idButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    const iBox = await idButton.boundingBox();
    if (iBox) {
      await humanGlide(page, iBox.x + iBox.width / 2, iBox.y + iBox.height / 2, 20);
      await humanClick(page);
    } else {
      await idButton.click();
    }
    // The chat remounts on `key={lockId}`; wait for the swap rather than guess.
    await sleep(400);
    await waitForDomSettled(page, { settleMs: 800 });
  }

  // A remount empties the message list, so read the baseline fresh rather than
  // carrying router mode's total over.
  const lockedPrompt = prompts[1] ?? prompts[0];
  const lockedCount = await sendPrompt(page, lockedPrompt, { timeoutMs: 12000 });
  await waitForAgentResponseCompletion(
    page,
    config.waitAfterPromptMs ?? 3000,
    lockedCount,
  );

  await humanGlide(page, 960, 300, 25);
  await sleep(1500);
};
