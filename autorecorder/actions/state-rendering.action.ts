import { type Page } from 'playwright';
import { humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';

/**
 * PARTIAL page, and the recording is meant to show why.
 *
 * The doc page's `agent.py` block contains React code rather than Python, so it
 * never defines the state model or the tool that writes `searches`. The React
 * half is implemented exactly as documented and is genuinely reactive -- but it
 * is pointed at `my_agent`, which has no state at all, so the list stays empty.
 *
 * That means the pass condition is deliberately *not* "the list filled". It is
 * "the agent replied and the panel rendered its empty state without throwing".
 * The cursor rests on the warning banner and the raw `agent.state` pane so the
 * video shows the gap rather than looking like a broken demo.
 *
 * See `backend/agents/search_agent.py` and README §9.1.
 */
const WARNING = 'div:has-text("contains React code")';

export const runStateRenderingAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [State Rendering] Showing the documented gap before prompting...`);
  const warning = page.locator(WARNING).last();
  if (await warning.isVisible({ timeout: 5000 }).catch(() => false)) {
    const box = await warning.boundingBox();
    if (box) {
      await humanGlide(page, box.x + box.width / 2, box.y + box.height / 2, 22);
      await sleep(2500);
    }
  }

  console.log(`   [State Rendering] Prompting -- the reply arrives, the list does not fill...`);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 12000 });

  // The chat is an ordinary CopilotChat, so the shared detector applies: a page
  // that never answers still fails, which is the part that can actually break.
  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000, msgCount);

  // Rest on the raw state pane -- empty `{}` is the evidence, not a glitch.
  console.log(`   [State Rendering] Resting on the raw agent.state pane...`);
  await humanGlide(page, 420, 620, 22);
  await sleep(2500);
};
