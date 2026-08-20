import { type Page } from 'playwright';
import { humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';

/**
 * `useComponent` renders a React component from a tool call -- here a weather
 * card, with no handler and nothing to interact with.
 *
 * The card is generative UI, so it can appear while the reply is still
 * streaming. Waiting only for the card and then sleeping a fixed interval let
 * the recording end mid-answer, or end with no answer at all and still report
 * PASS -- so the card wait is a cue for the camera, and the shared detector is
 * what decides whether the page actually worked.
 */
export const runDisplayOnlyAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Display Only Component] Prompting the agent to render WeatherCard...`);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 12000 });

  console.log(`   Waiting for the generative WeatherCard to render inline...`);
  const weatherCard = page.locator('div:has-text("Tokyo"), div:has-text("77°F")').last();
  await weatherCard.waitFor({ state: 'visible', timeout: 25000 }).catch(() => {});

  if (await weatherCard.isVisible({ timeout: 3000 }).catch(() => false)) {
    const box = await weatherCard.boundingBox();
    if (box) {
      console.log(
        `   🎯 Card rendered at (${Math.round(box.x)}, ${Math.round(box.y)})`,
      );
      await humanGlide(page, box.x + box.width / 2, box.y + box.height / 2, 22);
      await sleep(1500);
    }
  } else {
    console.warn(`   ⚠️ No weather card found -- the reply may be plain text.`);
  }

  // The part that can fail: the reply itself has to arrive and finish.
  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000, msgCount);
};
