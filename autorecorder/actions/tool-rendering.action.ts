import { type Page } from 'playwright';
import { humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';

export const runToolRenderingAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Tool Rendering] Prompting for weather to trigger custom renderer...`);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 12000 });

  console.log(`   ⏳ Actively detecting AI agent response & custom tool rendering...`);
  // Look for custom weather tool rendered element and glide cursor over it
  const weatherElement = page
    .locator('p:has-text("weather API"), div:has-text("Tokyo"), .copilotKitAssistantMessage')
    .first();
  await weatherElement.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
  await sleep(1500);

  if (await weatherElement.isVisible({ timeout: 5000 }).catch(() => false)) {
    const weBox = await weatherElement.boundingBox();
    if (weBox) {
      console.log(`   🎯 Detected rendered weather tool call at (${Math.round(weBox.x)}, ${Math.round(weBox.y)})`);
      await humanGlide(page, weBox.x + Math.min(weBox.width / 2, 250), weBox.y + weBox.height / 2, 22);
      await sleep(2500);
    }
  }

  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000, msgCount);
};
