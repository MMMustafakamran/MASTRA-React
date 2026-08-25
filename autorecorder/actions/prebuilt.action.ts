import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { promptsFor, sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { waitForDomSettled } from './page-ready';

export const runPrebuiltAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  // 1/3: CopilotChat tab
  console.log(`   [Prebuilt] 1/3: Demonstrating CopilotChat...`);
  const msgCount = await sendPrompt(page, promptsFor(config)[0], { timeoutMs: 8000 });
  console.log(`   Waiting for CopilotChat response...`);
  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 1500, msgCount);

  // 2/3: CopilotSidebar tab
  console.log(`   [Prebuilt] 2/3: Switching to CopilotSidebar tab...`);
  const sidebarTab = page.locator('button:has-text("CopilotSidebar")');
  const sBox = await sidebarTab.boundingBox();
  if (sBox) {
    await humanGlide(page, sBox.x + sBox.width / 2, sBox.y + sBox.height / 2, 20);
    await humanClick(page);
  }
  await sleep(400);
  await waitForDomSettled(page, { settleMs: 800 });

  // Focus the sidebar input if visible
  const sidebarInput = page
    .locator('textarea, input[type="text"], [contenteditable="true"]')
    .first();
  if (await sidebarInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    const siBox = await sidebarInput.boundingBox();
    if (siBox) {
      await humanGlide(page, siBox.x + 80, siBox.y + siBox.height / 2, 18);
      await humanClick(page);
    }
  }
  await humanGlide(page, 1650, 450, 25);
  console.log(`   Docked CopilotSidebar showcase...`);
  await sleep(1500);

  // 3/3: CopilotPopup tab
  console.log(`   [Prebuilt] 3/3: Switching to CopilotPopup tab...`);
  const popupTab = page.locator('button:has-text("CopilotPopup")');
  const pBox = await popupTab.boundingBox();
  if (pBox) {
    await humanGlide(page, pBox.x + pBox.width / 2, pBox.y + pBox.height / 2, 20);
    await humanClick(page);
  }
  await sleep(400);
  await waitForDomSettled(page, { settleMs: 800 });

  // Click floating launcher in bottom corner if present
  const popupLauncher = page
    .locator('button[aria-label*="open"], button[aria-label*="chat"], .copilotKitPopup, [class*="fixed bottom"]')
    .first();
  if (await popupLauncher.isVisible({ timeout: 2000 }).catch(() => false)) {
    const plBox = await popupLauncher.boundingBox();
    if (plBox) {
      await humanGlide(page, plBox.x + plBox.width / 2, plBox.y + plBox.height / 2, 20);
      await humanClick(page);
      await sleep(1500);
    }
  }
  await humanGlide(page, 960, 540, 20);
  await sleep(1500);
};
