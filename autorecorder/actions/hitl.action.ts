import { type Page } from 'playwright';
import { beat, humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';

/**
 * The doc's `offerOptions` chooser -- Human in the Loop, tool-based.
 *
 * `useHumanInTheLoop` registers a tool with a `render` and NO handler, so the
 * run suspends the moment the model calls it and stays suspended until
 * `respond` fires. The string the clicked button sends becomes the tool result
 * the model reads next.
 *
 * That makes the click load-bearing rather than decorative, and it is why this
 * page cannot be recorded by `runStandardAction`: with nobody clicking, the run
 * hangs on the interrupt and the take shows a half-finished turn on the page
 * whose entire subject is the interrupt resolving.
 *
 * ── Why this is not `interactive.action.ts` ────────────────────────────────
 * That handler drives the Interactive page's `humanApprovedCommand`, whose two
 * buttons are hard-coded strings ("Approve" / "Reject") it can match exactly.
 * Here the labels are `args.option_1` and `args.option_2` -- INVENTED by the
 * model for each run, so there is no text to match on. The buttons have to be
 * found structurally instead, which is a different enough job to keep separate.
 */

/** The chooser card: the page's own wrapper around the two option buttons. */
const CHOOSER = 'div.my-2.flex.flex-wrap.gap-2 button';

export const runHitlAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  _rootPath: string,
  ctx: ActionContext,
) => {
  console.log(`   [Human in the Loop] Prompting to trigger the offerOptions interrupt...`);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 12000 });

  console.log(`   Waiting for the two options to render in the message stream...`);
  const options = page.locator(CHOOSER);
  await page
    .waitForFunction(
      (sel) => document.querySelectorAll(sel).length >= 2,
      CHOOSER,
      { timeout: 30000 },
    )
    .catch(() => {});

  const count = await options.count().catch(() => 0);
  if (count < 2) {
    // Nothing further will ever stream -- the run is parked on `respond`.
    // Failing here is honest: the interrupt IS the page.
    ctx.fail(
      `The offerOptions card never rendered: expected two option buttons, found ${count}. ` +
        'The agent answered in prose instead of calling the tool, or the ' +
        'frontend tool was not forwarded in the AG-UI run input.',
    );
    return;
  }

  // Both labels are model-authored, so log what was actually offered. It is
  // the only record of what the run suspended on.
  const labels = await options.allTextContents().catch(() => []);
  console.log(`   🔀 Options offered: ${labels.map((l) => `"${l.trim()}"`).join(' | ')}`);

  // Let both choices sit on screen long enough to read before deciding --
  // a chooser nobody looks at is not a human in the loop.
  await beat(2500);

  const chosen = options.first();
  const box = await chosen.boundingBox();
  if (box) {
    console.log(`   🎯 Selecting "${(labels[0] ?? '').trim()}"`);
    await humanGlide(page, box.x + box.width / 2, box.y + box.height / 2, 20);
    await sleep(600);
    await humanClick(page);
  } else {
    await chosen.click();
  }

  // Only now does the run resume, so this is the reply that matters -- and it
  // should refer back to the option that was picked.
  const reply = await waitForAgentResponseCompletion(
    page,
    config.waitAfterPromptMs ?? 4000,
    msgCount,
    undefined,
    {
      startTimeoutMs: ctx.timeouts.replyStartMs,
      streamTimeoutMs: ctx.timeouts.replyStreamMs,
    },
  );
  if (reply.streamTimedOut) {
    ctx.warn(
      `Reply was still streaming after the cap; the clip may end before the agent acknowledges the choice.`,
    );
  }
};
