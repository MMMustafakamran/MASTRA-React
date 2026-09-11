import { type Page } from 'playwright';
import { beat, humanGlide, sleep } from '../core/overlays/cursor';
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { promptsFor, sendPrompt, waitForAgentResponseCompletion } from '../core/actions';

/**
 * Working memory accumulating across turns.
 *
 * `searchAgent` declares a `searches: { query, done }[]` schema and one tool,
 * `addSearch`, whose body does nothing at all -- its comment reads "working
 * memory is automatically updated". Calling it is what prompts the model to
 * write memory; the return value is irrelevant. So the only place the feature
 * can be observed is the left pane, never the chat.
 *
 * ── What this file used to be ──────────────────────────────────────────────
 * A handler for a *different repo's* version of this page: it hunted for a
 * banner reading "contains React code", explained that the doc's `agent.py`
 * block shipped React instead of Python, and declared the pass condition to be
 * "the list stayed empty without throwing". None of that is true here. This
 * repo has no `backend/`, no `search_agent.py`, and no such banner -- the agent
 * is `frontend/src/mastra/agents.ts` and it genuinely writes state. Kept
 * pointing at a page that had moved on, the handler asserted the OPPOSITE of
 * the working behaviour, which is why it was left unwired and the page fell
 * through to `runStandardAction` with a Shared State prompt attached.
 *
 * ── Two turns, not one ─────────────────────────────────────────────────────
 * One search only proves a list can render one item. The second is what
 * separates this page from Tool Rendering: state that PERSISTS across turns,
 * with the first entry still there after the second arrives. So the count is
 * read after each turn and both numbers are checked.
 */

/**
 * Rows in the left pane: one flex row per stored search.
 *
 * Scoped to the list's own container (`mt-3 flex flex-col gap-2`) rather than
 * matching `div.flex.flex-row.gap-2` anywhere on the page -- the chat pane
 * beside it is CopilotKit's own markup and is free to use the same utility
 * classes, which would inflate the count and turn an empty panel into a pass.
 */
const SEARCH_ROW = 'div.mt-3.flex.flex-col.gap-2 > div.flex.flex-row.gap-2';

/** The `Searches` heading, for resting the cursor somewhere meaningful. */
const PANEL = 'h2:text-is("Searches")';

async function countSearches(page: Page): Promise<number> {
  return page.locator(SEARCH_ROW).count().catch(() => 0);
}

async function restOnPanel(page: Page): Promise<void> {
  const panel = page.locator(PANEL).first();
  const box = await panel.boundingBox().catch(() => null);
  if (box) {
    await humanGlide(page, box.x + box.width / 2, box.y + box.height + 40, 22);
  } else {
    await humanGlide(page, 420, 260, 22);
  }
  await beat(2200);
}

export const runStateRenderingAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  _rootPath: string,
  ctx: ActionContext,
) => {
  const prompts = promptsFor(config);
  const counts: number[] = [];

  for (let i = 0; i < prompts.length; i++) {
    console.log(
      `   [State Rendering] ${i + 1}/${prompts.length}: "${prompts[i]}"`,
    );
    const msgCount = await sendPrompt(page, prompts[i], {
      timeoutMs: i === 0 ? 12000 : 8000,
    });
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
        `Turn ${i + 1} was still streaming when the cap expired; the clip may end mid-answer.`,
      );
    }

    // Working memory is reconciled at run end, so the pane can lag the last
    // token by a beat. Give it one before reading, then show it.
    await beat(1200);
    counts.push(await countSearches(page));
    console.log(`   Searches in the panel after turn ${i + 1}: ${counts[i]}`);
    await restOnPanel(page);
  }

  // ── What the page promises, checked ───────────────────────────────────────
  if (counts[0] === 0) {
    ctx.fail(
      'The searches panel is still empty after the first prompt: `addSearch` ' +
        'was called but nothing reached `agent.state`, so state rendering -- ' +
        'the only thing this page demonstrates -- did not happen.',
    );
    return;
  }

  const last = counts[counts.length - 1];
  if (prompts.length > 1 && last <= counts[0]) {
    ctx.warn(
      `The list did not grow on the second prompt (${counts[0]} -> ${last}). ` +
        'Working memory is being overwritten rather than accumulated, which is ' +
        'the distinction this page exists to show.',
    );
  }
};
