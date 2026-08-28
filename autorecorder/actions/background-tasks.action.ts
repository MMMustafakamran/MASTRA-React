import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { sendPrompt } from '../core/actions';

/**
 * Records the Background Tasks discrepancy, not a happy path.
 *
 * A tool marked `background: { enabled: true }` does not block the run: Mastra
 * queues it, the agent answers immediately, and progress arrives on the AG-UI
 * activity channel. `components/background-task-activity.tsx` renders those
 * events and flips its badge off "Working…" only when `content.status` becomes
 * `completed` or `failed`.
 *
 * What this recording documents is that the badge never flips. The run does
 * finish -- the Inspector's own view of the same stream says so -- but the
 * final activity event either never reaches the renderer or reaches it without
 * the terminal status, so the card is left claiming work is still in flight.
 *
 * The video therefore has to show both halves in one take, in this order:
 *
 *   1. the activity card on screen, badge reading "Working…"
 *   2. the Inspector's Threads -> Raw AG-UI Events tab, where the
 *      `mastra-background-task` event carrying the terminal status is listed
 *   3. back to the card, still reading "Working…"
 *
 * Step 3 is the finding. Without returning to the card a viewer can argue the
 * badge flipped while the Inspector was open.
 *
 * ── Why "Raw AG-UI Events" ─────────────────────────────────────────────────
 * The Inspector's thread view carries three tabs (`TAB_LIST` in
 * @copilotkit/web-inspector): Timeline, Raw AG-UI Events, State. Timeline is a
 * summarised run view -- it shows "Run finished", which proves the *run* ended
 * but not what the activity channel emitted. State holds agent state, which
 * this tool never writes. Only Raw AG-UI Events shows the untransformed event
 * the renderer was supposed to receive, so it is the one section that makes the
 * bug attributable rather than merely visible.
 *
 * The Inspector is a Lit web component (`cpk-web-inspector`) with open shadow
 * roots, so Playwright's own locators pierce it; the hand-rolled shadow walk in
 * `inspector.action.ts` is not needed here.
 */

/** Badge text the activity renderer shows while it believes work is running. */
const WORKING_BADGE = 'Working…';

/** The activity card marks itself with the status it rendered. */
const ACTIVITY_CARD = '[data-status]';

async function restOn(page: Page, selector: string, ms: number): Promise<boolean> {
  const el = page.locator(selector).first();
  if (!(await el.isVisible({ timeout: 5000 }).catch(() => false))) return false;
  const box = await el.boundingBox();
  if (!box) return false;
  await humanGlide(
    page,
    box.x + Math.min(box.width / 2, 260),
    box.y + box.height / 2,
    22,
  );
  await sleep(ms);
  return true;
}

/** Reads the status the activity card is currently advertising. */
async function readCardStatus(page: Page): Promise<string | null> {
  return page
    .locator(ACTIVITY_CARD)
    .first()
    .getAttribute('data-status')
    .catch(() => null);
}

export const runBackgroundTasksAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Background Tasks] Dispatching the background tool...`);
  await sendPrompt(page, config.prompt, { timeoutMs: 12000 });

  // The agent replies straight away -- the point is that the reply does NOT
  // mean the queued work is done -- so wait on the activity card, not on the
  // assistant message. waitForAgentResponseCompletion would return long before
  // there is anything to film.
  console.log(`   ⏳ Waiting for the activity card to render...`);
  const card = page.locator(ACTIVITY_CARD).first();
  await card.waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});

  const firstStatus = await readCardStatus(page);
  if (firstStatus === null) {
    throw new Error(
      'Background-task activity card never rendered. Either the agent did not ' +
        'dispatch the background tool, or backgroundTaskActivityRenderer is no ' +
        'longer registered on the provider (components/providers.tsx).',
    );
  }
  console.log(`   📌 Card rendered with data-status="${firstStatus}"`);

  // Half 1: rest on the badge so the "Working…" state is unmistakable on video.
  await restOn(page, ACTIVITY_CARD, 3500);

  // Give the queued work time to actually finish before we go looking for
  // evidence that it did. Held generously: a short wait here would leave the
  // recording unable to distinguish "still running" from "finished silently",
  // which is the exact confusion this video exists to remove.
  console.log(`   ⏳ Letting the background job run to completion...`);
  await sleep(20000);

  const statusBeforeInspector = await readCardStatus(page);
  const badgeText =
    (await page.locator(ACTIVITY_CARD).first().textContent().catch(() => '')) ?? '';
  console.log(
    `   📌 Card after the job should have finished: data-status="${statusBeforeInspector}"` +
      `${badgeText.includes(WORKING_BADGE) ? ' (still reading "Working…")' : ''}`,
  );

  // Half 2: the Inspector's own read of the same stream.
  console.log(`   Opening the CopilotKit Inspector...`);
  const trigger = page
    .locator('cpk-web-inspector button, button[aria-label*="Inspector" i]')
    .first();
  if (await trigger.isVisible({ timeout: 5000 }).catch(() => false)) {
    const tb = await trigger.boundingBox();
    if (tb) {
      await humanGlide(page, tb.x + tb.width / 2, tb.y + tb.height / 2, 22);
      await humanClick(page);
    } else {
      await trigger.click();
    }
    await sleep(2500);
  } else {
    console.warn(
      '   ⚠ Inspector trigger not found. showDevConsole="auto" only mounts it ' +
        'on localhost -- check components/providers.tsx and the host in ' +
        'config/project.config.ts.',
    );
  }

  // Sidebar: Agent / Frontend Tools / Context / Threads / Memory.
  console.log(`   Navigating to Threads...`);
  const threadsMenu = page
    .locator('button:has-text("Threads"), [role="button"]:has-text("Threads")')
    .first();
  if (await threadsMenu.isVisible({ timeout: 6000 }).catch(() => false)) {
    const mb = await threadsMenu.boundingBox();
    if (mb) {
      await humanGlide(page, mb.x + mb.width / 2, mb.y + mb.height / 2, 20);
      await humanClick(page);
    } else {
      await threadsMenu.click();
    }
    await sleep(2500);
  }

  // The thread list needs a selection before the Timeline/Raw/State tabs exist.
  const firstThread = page
    .locator('cpk-thread-list li, cpk-thread-list button')
    .first();
  if (await firstThread.isVisible({ timeout: 6000 }).catch(() => false)) {
    const fb = await firstThread.boundingBox();
    if (fb) {
      await humanGlide(page, fb.x + fb.width / 2, fb.y + fb.height / 2, 20);
      await humanClick(page);
    } else {
      await firstThread.click();
    }
    await sleep(2500);
  }

  console.log(`   Opening the "Raw AG-UI Events" tab...`);
  const rawTab = page.getByRole('tab', { name: 'Raw AG-UI Events' }).first();
  if (await rawTab.isVisible({ timeout: 6000 }).catch(() => false)) {
    const rb = await rawTab.boundingBox();
    if (rb) {
      await humanGlide(page, rb.x + rb.width / 2, rb.y + rb.height / 2, 20);
      await humanClick(page);
    } else {
      await rawTab.click();
    }
    await sleep(3000);
  } else {
    console.warn(
      '   ⚠ "Raw AG-UI Events" tab not found. The Inspector renames its tabs ' +
        'between releases -- check TAB_LIST in @copilotkit/web-inspector.',
    );
  }

  // Rest on the background-task event itself rather than the tab strip, so the
  // terminal status is legible in the frame.
  const completedEvent = page
    .locator(':text("mastra-background-task"), :text("completed")')
    .last();
  if (await completedEvent.isVisible({ timeout: 8000 }).catch(() => false)) {
    const eb = await completedEvent.boundingBox();
    if (eb) {
      console.log(`   ✓ Inspector lists the terminal background-task event.`);
      await humanGlide(
        page,
        eb.x + Math.min(eb.width / 2, 260),
        eb.y + eb.height / 2,
        20,
      );
      await sleep(4000);
    }
  } else {
    console.warn(
      '   ⚠ No terminal background-task event visible in Raw AG-UI Events. If ' +
        'this holds, the event never reached the client at all and the card is ' +
        'right to still be waiting -- a different bug from the one recorded here.',
    );
  }

  // Half 3: close the Inspector and go back to the card. This is the finding.
  console.log(`   Closing the Inspector to re-check the card...`);
  const closeBtn = page.locator('[aria-label="Close Web Inspector"]').first();
  if (await closeBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    const cb = await closeBtn.boundingBox();
    if (cb) {
      await humanGlide(page, cb.x + cb.width / 2, cb.y + cb.height / 2, 20);
      await humanClick(page);
    } else {
      await closeBtn.click();
    }
    await sleep(2000);
  }

  const finalStatus = await readCardStatus(page);
  const finalText =
    (await page.locator(ACTIVITY_CARD).first().textContent().catch(() => '')) ?? '';
  console.log(
    finalText.includes(WORKING_BADGE)
      ? `   🔴 FINDING: card still reads "${WORKING_BADGE}" (data-status="${finalStatus}") ` +
          `after the Inspector showed the task finished.`
      : `   🟢 Card resolved to data-status="${finalStatus}" -- the discrepancy did ` +
          `not reproduce on this run.`,
  );

  await restOn(page, ACTIVITY_CARD, config.waitAfterPromptMs ?? 4000);
};
