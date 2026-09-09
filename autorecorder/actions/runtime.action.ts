import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { promptsFor, sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { waitForDomSettled } from './page-ready';

/**
 * Agent routing, which is the only thing the Copilot Runtime page demonstrates.
 *
 * `getLocalAgents` registers every agent on the Mastra instance at once, keyed
 * by its name in the instance's `agents: { … }` object, and the demo renders
 * one button per key. `<CopilotChat key={agentId}>` remounts on each switch, so
 * every id also carries its own conversation.
 *
 * ── Why the page was recorded wrong until 2026-09-09 ───────────────────────
 * Two faults, and they compounded.
 *
 * First, this handler was never wired: the page fell through to
 * `runStandardAction`, which types one prompt and waits. One turn on the
 * already-selected id touches no button at all, so the clip was a plain chat
 * recording -- indistinguishable from Quickstart, and it would have passed just
 * as green with the entire routing UI deleted.
 *
 * Second, the ids below were another repo's. They read `default` and
 * `weather_agent`, which are the Python harness's snake_case keys. This app
 * registers neither; its keys are camelCase and there is no `default` (see the
 * AGENTS array in `copilot-runtime/demo-chat/page.tsx`). Had the handler been
 * wired as written, every `button:text-is("weather_agent")` would have missed,
 * the switch would have been skipped silently, and both turns would have gone
 * to whichever agent happened to be selected.
 *
 * ── Why these two ids ──────────────────────────────────────────────────────
 * Seven are registered; driving all seven would be six near-identical turns.
 * `myAgent` and `weatherAgent` are the pair that makes routing legible in ONE
 * question: `myAgent` has no tools and can only answer in prose, `weatherAgent`
 * carries `weatherInfo` and calls it. The same question is asked both times on
 * purpose -- two different questions would prove nothing about which agent
 * answered.
 */
const AGENT_IDS = ['myAgent', 'weatherAgent'] as const;

export const runRuntimeAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  _rootPath: string,
  ctx: ActionContext,
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
      if (!(await tab.isVisible({ timeout: 5000 }).catch(() => false))) {
        // Silently skipping the switch is what made the old ids harmless-looking
        // and useless: both turns went to the same agent and the take passed.
        ctx.fail(
          `No routing button labelled "${agentId}" on the page. The ids in this ` +
            'handler no longer match the AGENTS array in ' +
            'copilot-runtime/demo-chat/page.tsx, so no agent switch was recorded.',
        );
        return;
      }
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

      // The DemoFrame subtitle reads `routing to "<id>"`, so it is the cheapest
      // proof the click actually changed the mounted agent rather than just
      // restyling a button. Read the element's text and test it here: a
      // Playwright `text=` selector carrying the embedded double quotes is
      // needlessly fragile for what is a plain substring check.
      const subtitle =
        (await page
          .locator('span.truncate.text-xs')
          .first()
          .textContent()
          .catch(() => null)) ?? '';
      const routed = subtitle.includes(agentId);
      if (!routed) {
        ctx.warn(
          `Clicked "${agentId}" but the header never reported routing to it; ` +
            'the reply below may have come from the previous agent.',
        );
      }
    }

    const prompt = prompts[i] ?? prompts[prompts.length - 1];
    // A remount empties the message list, so the count restarts at 0 each time
    // -- read it fresh rather than carrying the previous id's total over.
    const msgCount = await sendPrompt(page, prompt, { timeoutMs: i === 0 ? 12000 : 8000 });
    const reply = await waitForAgentResponseCompletion(
      page,
      config.waitAfterPromptMs ?? 2000,
      msgCount,
      undefined,
      {
        startTimeoutMs: ctx.timeouts.replyStartMs,
        streamTimeoutMs: ctx.timeouts.replyStreamMs,
      },
    );
    if (reply.streamTimedOut) {
      ctx.warn(`The "${agentId}" turn was still streaming when the cap expired.`);
    }

    // Each id starts a fresh conversation. After the switch the transcript
    // should hold this turn only -- if the previous agent's messages are still
    // there, `key={agentId}` is not remounting and the page's central claim is
    // wrong.
    if (i > 0 && msgCount > 0) {
      ctx.warn(
        `Switching to "${agentId}" left ${msgCount} assistant message(s) on screen; ` +
          'the chat did not remount, so the ids are sharing one conversation.',
      );
    }
  }

  await humanGlide(page, 960, 300, 25);
  await sleep(1500);
};
