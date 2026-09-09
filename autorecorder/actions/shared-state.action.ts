import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { promptsFor, sendPrompt, waitForAgentResponseCompletion } from '../core/actions';

/**
 * The two Shared State pages, which share one agent and one state model.
 *
 * `languageAgent` (frontend/src/mastra/agents.ts, #region language-agent)
 * carries a Mastra `Memory` with `workingMemory.schema = { language }` and
 * instructions that read "Always communicate in the preferred language of the
 * user as defined in your working memory."
 *
 * That sentence is what makes either direction observable: the state does not
 * just sit in a panel, it changes the language the agent answers in. So a take
 * on either page has two things to show -- the panel moving, and the next reply
 * proving the agent saw the same value.
 */

/** The `Language: <value>` readout in the left pane. */
const LANGUAGE_READOUT = 'p:has-text("Language:")';

async function restOnStatePanel(page: Page): Promise<void> {
  const readout = page.locator(LANGUAGE_READOUT).first();
  const box = await readout.boundingBox().catch(() => null);
  if (box) {
    await humanGlide(page, box.x + box.width / 2, box.y + box.height / 2, 22);
  } else {
    await humanGlide(page, 420, 220, 22);
  }
  await sleep(2000);
}

/**
 * Reading: ask the agent to switch language, watch `agent.state` follow, then
 * ask something neutral to prove the agent is now answering in that language.
 */
export const runSharedStateReadAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  const prompts = promptsFor(config);

  for (let i = 0; i < prompts.length; i++) {
    console.log(`   [Shared State read] ${i + 1}/${prompts.length}: "${prompts[i]}"`);
    const msgCount = await sendPrompt(page, prompts[i], {
      timeoutMs: i === 0 ? 12000 : 8000,
    });
    await waitForAgentResponseCompletion(
      page,
      config.waitAfterPromptMs ?? 4000,
      msgCount,
    );

    // After the first turn the panel should have flipped -- show it before the
    // follow-up, which is the turn that proves the agent read it back.
    if (i === 0) {
      console.log(`   Showing the updated agent.state panel...`);
      await restOnStatePanel(page);
    }
  }

  await restOnStatePanel(page);
};

/**
 * Writing: the app writes state, then the agent is observed reading it back.
 *
 * This is the direction the READ page does not cover, and the order is the
 * whole test. `Toggle Language` calls `agent.setState` and stops -- the agent
 * is not running and does not notice -- so a prompt has to follow it, and only
 * that next run picks the new value up. The doc puts it exactly this way: "Try
 * toggling the language button"
 * (doc-snapshot/pages/mastra__shared-state__in-app-agent-write.md:134).
 *
 * The prompt in `pages.config.ts` is deliberately neutral and never names a
 * language. That is what makes the reply evidence: if it comes back in Spanish,
 * the only thing that could have caused it is the state the button wrote.
 * Asking the chat to "switch to Spanish" -- which this page's config did until
 * 2026-09-09 -- would produce the same Spanish reply with the button deleted,
 * and tested the READ page's mechanism a second time instead of this one's.
 *
 * ── Why there is no second variant ─────────────────────────────────────────
 * This handler used to demand a `Toggle & re-run` button as well, and threw if
 * it was absent. That button belongs to a sibling repo's demo page; neither
 * this app nor the Mastra doc has it, so wiring this handler up as written
 * would have failed the page for missing something it never claimed. Removed
 * rather than kept as a warning: a check for a control the doc does not
 * document is noise, not a finding.
 */
export const runSharedStateWriteAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  _rootPath,
  ctx,
) => {
  // ── The app writes ────────────────────────────────────────────────────────
  console.log(`   [Shared State write] 1/2: agent.setState via "Toggle Language"...`);
  const toggle = page.locator('button:text-is("Toggle Language")').first();
  await toggle.waitFor({ state: 'visible', timeout: 15000 });
  const tBox = await toggle.boundingBox();
  if (tBox) {
    await humanGlide(page, tBox.x + tBox.width / 2, tBox.y + tBox.height / 2, 20);
    await humanClick(page);
  } else {
    await toggle.click();
  }
  await sleep(1200);

  // Read the panel before prompting. `setState` is synchronous on the client,
  // so if the readout has not flipped by now the write never landed -- and the
  // reply that follows would be answering about nothing.
  const readout = await page
    .locator(LANGUAGE_READOUT)
    .first()
    .textContent()
    .catch(() => null);
  console.log(`   Panel now reads: ${JSON.stringify((readout ?? '').trim())}`);
  if (!/spanish/i.test(readout ?? '')) {
    ctx.warn(
      `The "Language:" readout did not flip to spanish after the toggle (read ${JSON.stringify(
        (readout ?? '').trim(),
      )}). agent.setState did not reach the panel, so the reply below proves nothing.`,
    );
  }
  await restOnStatePanel(page);

  // ── The agent reads, on its next run and not before ───────────────────────
  console.log(`   [Shared State write] 2/2: prompting so the agent picks the new language up...`);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 12000 });
  await waitForAgentResponseCompletion(
    page,
    config.waitAfterPromptMs ?? 4000,
    msgCount,
    undefined,
    {
      startTimeoutMs: ctx.timeouts.replyStartMs,
      streamTimeoutMs: ctx.timeouts.replyStreamMs,
    },
  );

  await restOnStatePanel(page);
};
