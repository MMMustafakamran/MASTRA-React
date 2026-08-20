import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { promptsFor, sendPrompt, waitForAgentResponseCompletion } from '../core/actions';

/**
 * The two Shared State pages, which share one agent and one state model.
 *
 * `language_agent` is built with `deps_type=StateDeps[AgentState]`, and its
 * `@agent.instructions()` interpolates `ctx.deps.state.language` on every run.
 * That is what makes either direction observable: the state does not just sit
 * in a panel, it changes the language the agent answers in.
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
 * Writing: both doc variants, in the order that makes the difference legible.
 *
 * `Toggle Language` writes state and stops -- the agent only notices on its
 * next turn, so a prompt has to follow it. `Toggle & re-run` writes, appends a
 * hint message and calls `runAgent` itself, so a reply arrives with nothing
 * typed at all. Recording only one of them would not show what separates them.
 */
export const runSharedStateWriteAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  // ── Variant 1: setState alone, then a prompt to observe it ────────────────
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
  await restOnStatePanel(page);

  console.log(`   Prompting so the agent picks the new language up...`);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 12000 });
  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000, msgCount);

  // ── Variant 2: setState + hint message + explicit re-run ──────────────────
  console.log(`   [Shared State write] 2/2: "Toggle & re-run" -- no typing at all...`);
  const toggleAndRun = page.locator('button:has-text("re-run")').first();
  if (!(await toggleAndRun.isVisible({ timeout: 5000 }).catch(() => false))) {
    throw new Error(
      'The "Toggle & re-run" button is missing: the advanced variant from the ' +
        'doc page is not rendered, so only half of this page was recorded.',
    );
  }

  // Count before clicking -- the button drives the run itself, so there is no
  // sendPrompt to hand a baseline back.
  const before = await page
    .locator('.copilotKitAssistantMessage, [data-message-role="assistant"]')
    .count()
    .catch(() => 0);

  const rBox = await toggleAndRun.boundingBox();
  if (rBox) {
    await humanGlide(page, rBox.x + rBox.width / 2, rBox.y + rBox.height / 2, 20);
    await humanClick(page);
  } else {
    await toggleAndRun.click();
  }

  await restOnStatePanel(page);
  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000, before);
};
