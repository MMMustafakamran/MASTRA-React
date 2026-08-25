import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { promptsFor, sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { waitForDomSettled } from './page-ready';

/**
 * The three slot customization levels, in the order the page tabs them.
 *
 * Level 3 replaces the message view entirely (`messageView={CustomMessageView}`),
 * so it renders none of CopilotKit's own message classes -- its assistant
 * bubbles are plain `div.text-left` inside the custom view's wrapper. Detection
 * has to be told that, or the run reports "agent never responded" on a level
 * that is in fact working.
 */
const SLOT_LEVELS: {
  tabLabel: string | null;
  messageSelector?: string;
}[] = [
  { tabLabel: null },
  { tabLabel: '2 · Props override' },
  { tabLabel: '3 · Custom component', messageSelector: '.space-y-4 > div.text-left' },
];

export const runSlotsAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  const prompts = promptsFor(config);

  for (let level = 0; level < SLOT_LEVELS.length; level++) {
    const { tabLabel, messageSelector } = SLOT_LEVELS[level];
    console.log(`   [Slots] ${level + 1}/${SLOT_LEVELS.length}: Level ${level + 1}...`);

    if (tabLabel) {
      const tab = page.locator(`button:has-text("${tabLabel}")`).first();
      const tBox = await tab.boundingBox();
      if (tBox) {
        await humanGlide(page, tBox.x + tBox.width / 2, tBox.y + tBox.height / 2, 20);
        await humanClick(page);
      }
      // Each tab mounts a different CopilotChat. On a cold route the chunk for
      // the newly shown level can still be compiling, so a fixed sleep is a
      // guess -- wait for the swap to actually finish instead.
      await sleep(400);
      await waitForDomSettled(page, { settleMs: 800 });
    }

    const prompt = prompts[level] ?? prompts[prompts.length - 1];
    const msgCount = await sendPrompt(page, prompt, {
      timeoutMs: level === 0 ? 8000 : 6000,
      messageSelector,
    });

    console.log(`   Waiting for Level ${level + 1} response...`);
    await waitForAgentResponseCompletion(
      page,
      config.waitAfterPromptMs ?? 1500,
      msgCount,
      messageSelector,
    );
  }
};
