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
 * The video shows both halves in one take, in this order:
 *
 *   1. the activity card on screen, badge reading "Working…"
 *   2. the Inspector's Threads -> Raw AG-UI Events tab, where the
 *      ACTIVITY_SNAPSHOT / ACTIVITY_DELTA event carrying the terminal
 *      background-task status is listed
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
 * ── Driving the Inspector ──────────────────────────────────────────────────
 * It is a Lit web component (`cpk-web-inspector`) with open shadow roots, so
 * Playwright's locators pierce it and no hand-rolled shadow walk is needed. The
 * selectors below are the Inspector's own class names, read off its compiled
 * bundle rather than guessed:
 *
 *   .cpk-tl__item              a row in the thread list (a div, not a button)
 *   button[role=tab]           Timeline / Raw AG-UI Events / State
 *   .cpk-td__tab--active       marks which of those is showing
 *   .cpk-td__event             one raw event; .cpk-td__event-type is its label
 *
 * Match tab LABELS loosely and tab IDS exactly. CI re-resolves dependencies
 * with no lockfile, so it routinely runs a newer Inspector than the one in
 * local node_modules -- which is exactly how "Raw AG-UI Events" became
 * "AG-UI Events" between two runs of this handler.
 *
 * An earlier revision guessed `cpk-thread-list li, cpk-thread-list button` and
 * matched nothing, so the tab strip was never reached and the run still claimed
 * success. Every navigation step below therefore VERIFIES it landed and the
 * handler reports honestly when it did not -- a recording that silently skips
 * the evidence half is worse than one that says it failed.
 */

/** Badge text the activity renderer shows while it believes work is running. */
const WORKING_BADGE = 'Working…';

/** The activity card marks itself with the status it rendered. */
const ACTIVITY_CARD = '[data-status]';

/**
 * How the Inspector LABELS the AG-UI events that carry background-task
 * activity. It prints a friendly label -- "Activity snapshot" -- not the
 * protocol constant `ACTIVITY_SNAPSHOT` that `@ag-ui/mastra` emits. Matching
 * the constant found nothing on a thread that plainly contained the event,
 * and the handler then blamed the product for the mismatch.
 */
const ACTIVITY_EVENT_LABEL = /activity/i;

/** Mastra's activity type, as `@ag-ui/mastra` emits it. */
const BACKGROUND_ACTIVITY_TYPE = 'mastra-background-task';

/**
 * The raw-events tab, matched on the part of its label that has held across
 * releases. The Inspector has shipped it as both "Raw AG-UI Events" and
 * "AG-UI Events"; an exact-match check passed locally and then silently
 * skipped the whole evidence half in CI, which re-resolves to whatever is
 * newest. Its tab *id* -- `raw-events` -- is the stable handle, and that is
 * what `selectTab` below takes.
 */
const RAW_EVENTS_LABEL = /AG-UI Events/i;
const RAW_EVENTS_TAB_ID = 'raw-events';

async function glideTo(page: Page, box: { x: number; y: number; width: number; height: number }) {
  await humanGlide(
    page,
    box.x + Math.min(box.width / 2, 260),
    box.y + box.height / 2,
    20,
  );
}

/** Glides to an element and clicks it. Returns false when it is not on screen. */
async function clickIfVisible(
  page: Page,
  selector: string,
  timeoutMs = 6000,
): Promise<boolean> {
  const el = page.locator(selector).first();
  if (!(await el.isVisible({ timeout: timeoutMs }).catch(() => false))) return false;
  const box = await el.boundingBox();
  if (box) {
    await glideTo(page, box);
    await humanClick(page);
  } else {
    await el.click().catch(() => {});
  }
  return true;
}

async function restOn(page: Page, selector: string, ms: number): Promise<boolean> {
  const el = page.locator(selector).first();
  if (!(await el.isVisible({ timeout: 5000 }).catch(() => false))) return false;
  const box = await el.boundingBox();
  if (!box) return false;
  await glideTo(page, box);
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

/** Which thread tab the Inspector is actually showing, by its label. */
async function activeTabLabel(page: Page): Promise<string | null> {
  return page
    .locator('.cpk-td__tab--active')
    .first()
    .textContent()
    .then((t) => (t ?? '').trim() || null)
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

  // ── Half 2: the Inspector's own read of the same stream ──────────────────
  console.log(`   Opening the CopilotKit Inspector...`);
  const opened = await clickIfVisible(
    page,
    'cpk-web-inspector button, button[aria-label*="Inspector" i]',
    5000,
  );
  if (!opened) {
    console.warn(
      '   ⚠ Inspector trigger not found. showDevConsole="auto" only mounts it ' +
        'on localhost -- check components/providers.tsx and the host in ' +
        'config/project.config.ts.',
    );
  }
  await sleep(2500);

  // Sidebar: Agent / Frontend Tools / Context / Threads / Memory. Opening
  // Threads calls the Inspector's own autoSelectLatestThread(), so the details
  // pane usually arrives already populated -- the explicit row click below is
  // the fallback for when it does not.
  console.log(`   Navigating to Threads...`);
  await clickIfVisible(page, ':is(button, [role="button"]):has-text("Threads")', 6000);
  await sleep(2500);

  const tabStrip = page.locator('button[role="tab"]').first();
  if (!(await tabStrip.isVisible({ timeout: 4000 }).catch(() => false))) {
    console.log(`   No thread auto-selected; picking the first row...`);
    if (await clickIfVisible(page, '.cpk-tl__item', 6000)) {
      await sleep(2500);
    }
  }

  // The tab strip only exists once a thread is selected. Its panels also fetch
  // events lazily, so wait for the strip rather than assuming it is instant.
  const haveTabs = await tabStrip
    .waitFor({ state: 'visible', timeout: 10000 })
    .then(() => true)
    .catch(() => false);

  let onRawEvents = false;
  if (!haveTabs) {
    console.warn(
      '   ⚠ Thread tab strip never appeared -- no thread is selected, so the ' +
        'Inspector half of this recording is missing. Check that the Threads ' +
        'view lists this run\'s thread.',
    );
  } else {
    console.log(`   Opening the AG-UI Events tab...`);
    await clickIfVisible(page, 'button[role="tab"]:has-text("AG-UI Events")', 6000);
    await sleep(2000);

    // The tab label is the contract with a specific Inspector release. If it
    // was renamed, drive the component's own API instead of failing the shot --
    // `cpk-thread-details.selectTab(id)` takes the stable tab ids.
    if (!RAW_EVENTS_LABEL.test((await activeTabLabel(page)) ?? '')) {
      console.log(`   Tab label did not match; calling selectTab('${RAW_EVENTS_TAB_ID}')...`);
      await page
        .evaluate((tabId) => {
          const inspector = document.querySelector('cpk-web-inspector');
          const details = inspector?.shadowRoot?.querySelector('cpk-thread-details') as
            | (HTMLElement & { selectTab?: (id: string) => void })
            | null;
          details?.selectTab?.(tabId);
        }, RAW_EVENTS_TAB_ID)
        .catch(() => {});
      await sleep(2000);
    }

    const active = await activeTabLabel(page);
    onRawEvents = RAW_EVENTS_LABEL.test(active ?? '');
    console.log(
      onRawEvents
        ? `   ✓ AG-UI Events tab is active (label: "${active}").`
        : `   ⚠ Could not reach the AG-UI Events tab (active tab: "${active ?? 'none'}").`,
    );
  }

  // Payloads are collapsed by default, and the terminal status lives inside the
  // payload -- not in the event-type header. Expanding is what puts the
  // evidence on screen.
  if (onRawEvents) {
    await clickIfVisible(page, 'button:has-text("Expand all")', 4000);
    await sleep(2000);
  }

  // Diagnostics, kept rather than deleted after the bug was chased.
  //
  // A run that finds no background-task event needs to distinguish three very
  // different situations, and "not found" alone distinguishes none of them:
  //   - the panel is empty (events never fetched for this thread)
  //   - the panel is full but carries no ACTIVITY_* events (the terminal event
  //     never reached the client -- a real, separate finding)
  //   - ACTIVITY_* events are there under names this handler does not know
  //     (the constants below have drifted with @ag-ui/mastra)
  // Logging the event types present answers that from the CI log alone,
  // without a local repro against a backend this machine may not be able to run.
  if (onRawEvents) {
    const seen = await page
      .locator('.cpk-td__event-type')
      .allTextContents()
      .catch(() => [] as string[]);
    const tally = new Map<string, number>();
    for (const raw of seen) {
      const t = raw.trim();
      if (t) tally.set(t, (tally.get(t) ?? 0) + 1);
    }
    console.log(
      `   🔬 AG-UI events listed (${seen.length}): ` +
        (tally.size
          ? [...tally].map(([t, n]) => `${t}×${n}`).join(', ')
          : '(none -- the panel is empty)'),
    );
    const mentionsBackground = await page
      .locator('.cpk-td__event')
      .filter({ hasText: 'background' })
      .count()
      .catch(() => 0);
    console.log(
      `   🔬 Events whose payload mentions "background": ${mentionsBackground}`,
    );
  }

  // Only claim the evidence is there if the tab is actually active AND an
  // activity event actually carries the background-task type. The previous
  // revision matched a bare `:text("completed")` anywhere on the page, which
  // reported success on a run where the tab had never opened.
  let evidenceShown = false;
  if (onRawEvents) {
    const activityEvent = page
      .locator('.cpk-td__event')
      .filter({ has: page.locator('.cpk-td__event-type', { hasText: ACTIVITY_EVENT_LABEL }) })
      .last();

    if (await activityEvent.isVisible({ timeout: 8000 }).catch(() => false)) {
      await activityEvent.scrollIntoViewIfNeeded().catch(() => {});
      await sleep(600);

      // The status lives in the JSON payload, which is not rendered at all
      // until this event's own toggle is pressed -- the bulk "Expand all"
      // control is not always present. Reading textContent while collapsed
      // reports no status on an event that carries one.
      const toggle = activityEvent.locator('button[aria-expanded="false"]').first();
      if (await toggle.isVisible({ timeout: 2000 }).catch(() => false)) {
        const tb = await toggle.boundingBox();
        if (tb) {
          await glideTo(page, tb);
          await humanClick(page);
        } else {
          await toggle.click().catch(() => {});
        }
        await sleep(1500);
      }

      const payload =
        (await activityEvent
          .locator('.cpk-td__event-payload')
          .first()
          .textContent()
          .catch(() => '')) ?? '';
      const isBackgroundTask = payload.includes(BACKGROUND_ACTIVITY_TYPE);
      evidenceShown = isBackgroundTask && /"?status"?\s*:?\s*"?(completed|failed)/i.test(payload);

      const box = await activityEvent.boundingBox();
      if (box) await glideTo(page, box);

      if (evidenceShown) {
        console.log(
          `   ✓ Inspector shows a ${BACKGROUND_ACTIVITY_TYPE} activity event with a ` +
            `terminal status.`,
        );
      } else if (isBackgroundTask) {
        console.warn(
          `   ⚠ The ${BACKGROUND_ACTIVITY_TYPE} event is listed but carries no terminal ` +
            'status. The client is never told the job finished, so the card is ' +
            'right to still be waiting -- a DIFFERENT bug from the one this ' +
            'recording set out to document, and a more serious one.',
        );
      } else {
        console.warn(
          `   ⚠ An activity event is listed but is not a ${BACKGROUND_ACTIVITY_TYPE}. ` +
            `Payload head: ${payload.slice(0, 200) || '(empty -- payload never expanded)'}`,
        );
      }
      await sleep(4000);
    } else {
      console.warn(
        '   ⚠ No activity event listed at all. The terminal event never reached ' +
          'the client, so the card is right to still be waiting -- a different ' +
          'bug from the one recorded here.',
      );
    }
  }

  // ── Half 3: back to the card. This is the finding ────────────────────────
  console.log(`   Closing the Inspector to re-check the card...`);
  await clickIfVisible(page, '[aria-label="Close Web Inspector"]', 4000);
  await sleep(2000);

  const finalStatus = await readCardStatus(page);
  const finalText =
    (await page.locator(ACTIVITY_CARD).first().textContent().catch(() => '')) ?? '';
  const stillWorking = finalText.includes(WORKING_BADGE);

  if (stillWorking && evidenceShown) {
    console.log(
      `   🔴 FINDING REPRODUCED: the Inspector shows the background task reached a ` +
        `terminal status, and the card still reads "${WORKING_BADGE}" ` +
        `(data-status="${finalStatus}").`,
    );
  } else if (stillWorking) {
    console.log(
      `   🟠 Card still reads "${WORKING_BADGE}" (data-status="${finalStatus}"), but the ` +
        `Inspector evidence was not captured -- this clip shows a stuck card, not ` +
        `a proven discrepancy.`,
    );
  } else {
    console.log(
      `   🟢 Card resolved to data-status="${finalStatus}" -- the discrepancy did ` +
        `not reproduce on this run.`,
    );
  }

  await restOn(page, ACTIVITY_CARD, config.waitAfterPromptMs ?? 4000);
};
