import { type Page } from 'playwright';
import { beat, humanGlide, sleep } from '../core/overlays/cursor';
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';

/**
 * A document written into working memory and rendered as it streams.
 *
 * `streamingAgent` is instructed never to paste the document into a chat
 * message -- it calls `updateWorkingMemory` with the full text under
 * `document`, and the left pane renders `agent.state.document` live. The page
 * subscribes with `UseAgentUpdate.OnStateChanged` and `OnRunStatusChanged`
 * precisely so it re-renders on state rather than on messages.
 *
 * ── Why a handler at all ───────────────────────────────────────────────────
 * `runStandardAction` watches the CHAT for a reply, and on this page the chat
 * is the one surface that is meant to stay nearly empty. The agent can answer
 * "Sure, I've drafted that" -- satisfying the shared reply detector in full --
 * while the document pane never leaves its "Ask the agent to write something…"
 * placeholder, which is the exact failure this page exists to catch. The pane
 * has to be read directly or the take cannot tell working from broken.
 */

/** The document pane. Also renders the placeholder when state is empty. */
const DOCUMENT = 'pre.whitespace-pre-wrap';

/** Shown beside the heading only while `agent.isRunning`. */
const LIVE_BADGE = 'span:text-is("LIVE")';

const PLACEHOLDER = 'Ask the agent to write something';

export const runPredictiveStateAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  _rootPath: string,
  ctx: ActionContext,
) => {
  console.log(`   [Predictive State] Prompting the agent to write into working memory...`);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 12000 });

  // The LIVE badge is the "predictive" half of the page: state arriving while
  // the run is still going, rather than at the end. It is inherently racy --
  // a fast run can finish before a poll catches it -- so a miss is a note, not
  // a failure. The document check below is the one that decides the take.
  const sawLive = await page
    .locator(LIVE_BADGE)
    .first()
    .waitFor({ state: 'visible', timeout: 20000 })
    .then(() => true)
    .catch(() => false);
  console.log(`   LIVE badge observed while the run was in flight: ${sawLive}`);

  // Watch the pane fill rather than cutting straight to the finished text --
  // the streaming IS the demo, so the cursor sits on it while it grows.
  const pane = page.locator(DOCUMENT).first();
  const box = await pane.boundingBox().catch(() => null);
  if (box) {
    await humanGlide(page, box.x + Math.min(box.width / 2, 260), box.y + 40, 22);
  }

  const reply = await waitForAgentResponseCompletion(
    page,
    config.waitAfterPromptMs ?? 6000,
    msgCount,
    undefined,
    {
      startTimeoutMs: ctx.timeouts.replyStartMs,
      streamTimeoutMs: ctx.timeouts.replyStreamMs,
    },
  );
  if (reply.streamTimedOut) {
    ctx.warn('The chat reply was still streaming when the cap expired.');
  }

  // Working memory is reconciled at run end, so give the pane a beat past the
  // last token before reading it.
  await beat(1500);
  const document = ((await pane.textContent().catch(() => '')) ?? '').trim();
  console.log(`   Document pane holds ${document.length} characters.`);

  if (!document || document.includes(PLACEHOLDER)) {
    ctx.fail(
      'The document pane never left its placeholder: the agent replied in chat ' +
        'but nothing reached `agent.state.document`, so no predictive state ' +
        'update happened. Check that `updateWorkingMemory` was called rather ' +
        'than the text being pasted into the message.',
    );
    return;
  }

  if (!sawLive) {
    ctx.warn(
      'The document filled, but the LIVE badge was never caught on screen — the ' +
        'state may have arrived in one block at run end rather than streaming.',
    );
  }

  // Rest on the finished document; it is the shot the page is about.
  if (box) {
    await humanGlide(page, box.x + Math.min(box.width / 2, 260), box.y + 90, 20);
  }
  await beat(2500);
};
