import { type Page } from 'playwright';
import {
  AgentSilentError,
  DEFAULT_ASSISTANT_MESSAGE_SELECTOR,
  promptsFor,
  sendPrompt,
  waitForAgentResponseCompletion,
} from '../core/actions';
import { beat, humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';

/**
 * Governed Action Approval UI -- both verdicts, one take.
 *
 * The standard action would type the prompt and wait, which here means filming
 * an approval card that nobody ever answers: the run stays suspended on the
 * tool call until someone clicks, so the clip would end on a spinner.
 *
 * So the take drives the card the way a reviewer would, twice. The first turn
 * asks for something harmless and clicks "Approve and run"; the second asks for
 * something destructive and clicks "Reject". Both buttons call the same
 * `respond()`, so either verdict resumes the run -- filming only the approval
 * left the denial path, the half the page is actually about, unrecorded.
 *
 * Each pass reads the arguments block before deciding, because showing the
 * exact arguments before a verdict is the thing the page insists on.
 */

/** The card is the only `<section>` the demo route renders. */
const CARD = 'section:has-text("User approval required")';

/**
 * Fallback for the denial turn when `pages.config` declares a single prompt.
 * Deliberately destructive: rejecting a reminder email reads as indecision,
 * rejecting a deletion reads as the policy doing its job.
 */
const FALLBACK_REJECT_PROMPT =
  'Now permanently delete the acme@example.com customer record, but check with me before it goes through.';

type Verdict = 'Approve and run' | 'Reject';

/**
 * Waits out the turn the verdict resumed.
 *
 * `AgentSilentError` is caught rather than allowed to propagate: an escaping
 * exception would fail the take and lose the footage, and a run that goes quiet
 * after a verdict is a finding worth seeing, not a recorder fault.
 */
async function settle(
  page: Page,
  config: PageRecordConfig,
  ctx: ActionContext,
  msgCount: number,
  verdict: Verdict,
): Promise<void> {
  try {
    const reply = await waitForAgentResponseCompletion(
      page,
      config.waitAfterPromptMs ?? 5000,
      msgCount,
      DEFAULT_ASSISTANT_MESSAGE_SELECTOR,
      { startTimeoutMs: ctx.timeouts.replyStartMs, streamTimeoutMs: ctx.timeouts.replyStreamMs },
    );
    if (reply.streamTimedOut) {
      ctx.warn(
        `Reply after "${verdict}" still streaming after ` +
          `${Math.round(ctx.timeouts.replyStreamMs / 1000)}s; the clip may end mid-answer.`,
      );
    }
  } catch (e) {
    if (!(e instanceof AgentSilentError)) throw e;
    ctx.warn(`The agent never answered after the "${verdict}" turn.`);
  }
}

/**
 * One turn: prompt, read the arguments, click `verdict`, let the run resume.
 *
 * Nothing here throws. A missing card or a missing button is reported through
 * `ctx` and the take carries on to the next verdict -- the clip is the evidence,
 * so it is always filmed to the end.
 */
async function runVerdict(
  page: Page,
  config: PageRecordConfig,
  ctx: ActionContext,
  prompt: string,
  verdict: Verdict,
): Promise<void> {
  console.log(`   [Governed Actions] Prompting for a verdict of "${verdict}"...`);
  const msgCount = await sendPrompt(page, prompt, { timeoutMs: 15000 });

  const card = page.locator(CARD).first();

  // `waitFor`, not `isVisible({ timeout })`. Playwright's isVisible is a
  // non-retrying snapshot -- its `timeout` bounds the call, it does not poll --
  // so it answers "no card" the instant the prompt is sent, before the agent
  // has even started. The card is a tool-call render, so it lands a beat after
  // the assistant begins responding.
  const appeared = await card
    .waitFor({ state: 'visible', timeout: 30000 })
    .then(() => true)
    .catch(() => false);

  if (!appeared) {
    // Not a hard failure: the model can answer in prose instead of calling the
    // tool, which is itself worth having on film.
    ctx.warn(`No approval card on the "${verdict}" turn -- the model did not call the tool.`);
    await settle(page, config, ctx, msgCount, verdict);
    return;
  }

  // Glide over the arguments the page insists you show before deciding.
  const args = card.locator('pre').first();
  if (await args.isVisible().catch(() => false)) {
    const box = await args.boundingBox();
    if (box) {
      await humanGlide(page, box.x + box.width / 2, box.y + box.height / 2, 22);
      await beat(1800);
    }
  }

  const button = card.locator(`button:has-text("${verdict}")`).first();
  if (!(await button.isVisible().catch(() => false))) {
    ctx.warn(`The card rendered without a "${verdict}" button.`);
    await settle(page, config, ctx, msgCount, verdict);
    return;
  }

  const box = await button.boundingBox();
  if (box) {
    await humanGlide(page, box.x + box.width / 2, box.y + box.height / 2, 20);
    await sleep(400);
    await humanClick(page);
  }

  // The card unmounts as soon as `respond()` lands -- the render bails once the
  // tool call stops executing -- so its disappearance is the proof the verdict
  // was delivered rather than merely clicked at.
  let resolved = await card
    .waitFor({ state: 'hidden', timeout: 10000 })
    .then(() => true)
    .catch(() => false);

  if (!resolved) {
    // A click at the cursor can miss if the card shifted as the chat grew.
    await button.click({ timeout: 4000 }).catch(() => {});
    resolved = await card
      .waitFor({ state: 'hidden', timeout: 8000 })
      .then(() => true)
      .catch(() => false);
  }

  if (resolved) {
    console.log(`   ✓ Answered "${verdict}" -- the run should now continue.`);
  } else {
    ctx.warn(`"${verdict}" did not dismiss the card -- the verdict may never have reached respond().`);
  }

  await settle(page, config, ctx, msgCount, verdict);
}

export const runGovernedActionsAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  _rootPath,
  ctx,
) => {
  const [approvePrompt, rejectPrompt] = promptsFor(config);

  await runVerdict(page, config, ctx, approvePrompt, 'Approve and run');

  // A beat between the turns so the approved run visibly finishes before the
  // next request goes in, rather than the two answers running together.
  await beat(1500);

  await runVerdict(page, config, ctx, rejectPrompt ?? FALLBACK_REJECT_PROMPT, 'Reject');
};
