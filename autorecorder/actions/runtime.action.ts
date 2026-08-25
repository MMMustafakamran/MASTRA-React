import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { promptsFor, sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { waitForDomSettled } from './page-ready';

/**
 * This app registers four agent ids -- `default`, `my_agent`, `weather_agent`
 * and `language_agent` -- and they are not interchangeable: `default` is an
 * alias for the tool-less quickstart agent, while `weather_agent` carries a
 * real `get_weather` tool (see `api/copilotkit/route.ts` and
 * `backend/agents/__init__.py`). The demo renders one button per id, labelled
 * with the id itself, and remounts the chat on switch so each carries its own
 * conversation.
 *
 * Two ids are driven rather than all four: the point is that routing actually
 * changes which agent answers, and `default` vs `weather_agent` shows that in
 * one question -- prose from the first, a tool call from the second. Recording
 * four near-identical turns would only make the video longer.
 */
const AGENT_IDS = ['default', 'weather_agent'] as const;

export const runRuntimeAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  const prompts = promptsFor(config);

  for (let i = 0; i < AGENT_IDS.length; i++) {
    const agentId = AGENT_IDS[i];
    console.log(
      `   [Copilot Runtime] ${i + 1}/${AGENT_IDS.length}: routing to "${agentId}"...`,
    );

    // The first id is already selected on load; only later ones need a click.
    if (i > 0) {
      const tab = page.locator(`button:text-is("${agentId}")`).first();
      if (await tab.isVisible({ timeout: 4000 }).catch(() => false)) {
        const box = await tab.boundingBox();
        if (box) {
          await humanGlide(page, box.x + box.width / 2, box.y + box.height / 2, 20);
          await humanClick(page);
        } else {
          await tab.click();
        }
        // The chat remounts on `key={agentId}`; wait for that to finish rather
        // than guessing at how long it takes.
        await sleep(400);
        await waitForDomSettled(page, { settleMs: 800 });
      }
    }

    const prompt = prompts[i] ?? prompts[prompts.length - 1];
    // A remount empties the message list, so the count restarts at 0 each time
    // -- read it fresh rather than carrying the previous id's total over.
    const msgCount = await sendPrompt(page, prompt, { timeoutMs: i === 0 ? 12000 : 8000 });
    await waitForAgentResponseCompletion(
      page,
      config.waitAfterPromptMs ?? 2000,
      msgCount,
    );
  }

  await humanGlide(page, 960, 300, 25);
  await sleep(1500);
};
