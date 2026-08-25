import { type Page } from 'playwright';
import { humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { waitForAgentResponseCompletion } from '../core/actions';

/**
 * Deliberately NOT routed through the shared sendPrompt() helper.
 *
 * This page hand-builds its input and Send button over useAgent/useCopilotKit,
 * and its submit path is timing-sensitive in a way the shared helper breaks:
 * switching it over made the run fail reproducibly with
 * `agent_run_error_event HTTP 405` from the Python backend and no response at
 * all, while this implementation streams reliably. The difference does not
 * reproduce headlessly, so the exact trigger is not pinned down yet.
 *
 * ── Why focus() and not a click ────────────────────────────────────────────
 * The input and the Send button share one flex row pinned to the bottom of a
 * `h-full` column, so at 1080p they sit at roughly y=1026..1064 -- underneath
 * the simulated taskbar, which occupies the bottom 48px and swallows clicks.
 * A real mouse click on the input therefore never lands, focus never moves, and
 * every typed character goes nowhere. The recording then shows an empty box and
 * no conversation.
 *
 * So: glide the virtual cursor there for the camera, but move focus
 * programmatically, which no overlay can intercept. Submitting goes through the
 * form's Enter handler for the same reason.
 */
const INPUT = 'input[placeholder="Type a message..."]';

/**
 * Assistant bubbles only. Both roles carry `.max-w-md`; the user's is the one
 * with `.ml-auto`, so excluding it leaves the agent's replies.
 */
const ASSISTANT_BUBBLE = '.max-w-md:not(.ml-auto)';

export const runHeadlessUiAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Headless UI] Waiting for the hand-built interface to settle...`);
  const inputLocator = page.locator(INPUT).first();
  await inputLocator.waitFor({ state: 'visible', timeout: 15000 });
  await sleep(800);

  // Cursor goes to the input for the camera; focus is set programmatically
  // because the taskbar overlay covers this row.
  const inputBox = await inputLocator.boundingBox();
  if (inputBox) {
    await humanGlide(page, inputBox.x + 80, inputBox.y + inputBox.height / 2, 20);
  }
  await inputLocator.focus();
  await sleep(400);

  console.log(`   [Headless UI] Typing prompt: "${config.prompt}"...`);
  const before = await page.locator(ASSISTANT_BUBBLE).count().catch(() => 0);
  await page.keyboard.type(config.prompt, { delay: 35 });
  await sleep(350);

  // A controlled input that never received the keystrokes reads back empty --
  // catch that here rather than discovering it on the finished video.
  let value = await inputLocator.inputValue().catch(() => '');
  if (!value) {
    await inputLocator.fill(config.prompt);
    await sleep(200);
    value = await inputLocator.inputValue().catch(() => '');
  }
  if (!value.trim()) {
    throw new Error(
      `Headless UI prompt was never entered: "${INPUT}" is still empty after typing. ` +
        'The input is at the bottom of the viewport, under the taskbar overlay -- ' +
        'check that focus is being set programmatically rather than by clicking.',
    );
  }

  // The form submits on Enter; the Send button is under the overlay.
  await page.keyboard.press('Enter');
  await sleep(600);

  const remaining = await inputLocator.inputValue().catch(() => '');
  if (remaining.trim().length > 0) {
    await page.keyboard.press('Enter');
  }

  // Shared detector, pointed at this page's own bubbles -- so a page that never
  // answers fails the run instead of quietly producing a video of an idle chat.
  await waitForAgentResponseCompletion(
    page,
    config.waitAfterPromptMs ?? 4000,
    before,
    ASSISTANT_BUBBLE,
  );
};
