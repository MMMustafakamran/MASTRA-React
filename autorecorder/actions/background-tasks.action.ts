import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { sendPrompt } from '../core/actions';
import { openInspector, openInspectorPanel } from './inspector.action';

/**
 * Records what the Background Tasks page actually does, which is not what the
 * page promises.
 *
 * A tool marked `background: { enabled: true }` does not block the run: Mastra
 * queues it, the agent answers immediately, and progress is supposed to arrive
 * on the AG-UI activity channel. `components/background-task-activity.tsx`
 * renders those events and flips its badge off "Working…" only when
 * `content.status` becomes `completed` or `failed`.
 *
 * The badge never flips. This handler was first written on the assumption that
 * the completion event arrives and the renderer drops it -- a UI bug. The
 * recording disproved that. What the Inspector shows is:
 *
 *   - exactly ONE `ACTIVITY_SNAPSHOT`, `activityType: "mastra-background-task"`,
 *     carrying `status: "running"`, and never superseded
 *   - a `Run finished` event at the same timestamp
 *
 * So the agent RUN completes while the background TASK is still reported as
 * running, and no later event ever corrects it. The card is not lying; it is
 * never told. The defect is upstream of the renderer: the run's event stream
 * closes with the task unresolved, and nothing reopens it.
 *
 * `_background.timeoutMs` varies between runs -- 10000 and 30000 have both been
 * recorded -- so the wait below deliberately outlasts the larger value. An
 * earlier revision waited 20s and called the unresolved card proof; against a
 * 30s timeout it was not, and that reading has been withdrawn.
 *
 * Read "Run finished" carefully when watching: it is the RUN, not the task. It
 * is the most natural thing in the world to read it as the task completing,
 * which is exactly the confusion this recording exists to remove.
 *
 * The video shows, in one take:
 *
 *   1. the activity card on screen, badge reading "Working…"
 *   2. the Inspector's Threads -> AG-UI Events tab: the activity snapshot
 *      expanded so `status: "running"` is legible, then scrolled down to the
 *      `Run finished` event -- both must be seen, or there is no contradiction
 *   3. back to the card, still reading "Working…"
 *
 * ── Why the AG-UI Events tab ───────────────────────────────────────────────
 * The Inspector's thread view carries three tabs: Timeline, AG-UI Events,
 * State. Timeline is a summarised run view. State holds agent state, which this
 * tool never writes. Only AG-UI Events shows the untransformed events, which is
 * the only place the contradiction -- run finished, task running -- is visible
 * at all.
 *
 * ── Driving the Inspector ──────────────────────────────────────────────────
 * It is a Lit web component (`cpk-web-inspector`) with open shadow roots.
 * Playwright's locators pierce those; `innerHTML`/`textContent` on a matched
 * element do NOT, and a locator will happily click a button inside a row whose
 * text reads as empty. Class names also move between releases -- CI installs
 * without a lockfile, so it runs a newer Inspector than local node_modules.
 * Both facts cost several CI runs. Hence: match tab LABELS loosely and tab IDS
 * exactly, verify every navigation step landed, and read content through
 * `allTextContents()` rather than per-element accessors.
 *
 * Known-good handles on the build recorded here:
 *
 *   .cpk-tl__item          a thread row (a div, not a button)
 *   button[role=tab]       Timeline / AG-UI Events / State
 *   .cpk-td__tab--active   which of those is showing
 *   .cpk-td__event-type    an event's label -- "Activity snapshot", "Run finished"
 *   pre                    an expanded event payload
 *
 * A handler that silently skips the evidence half is worse than one that says
 * it failed, so the outcomes below are reported distinctly and honestly.
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

/** Separates collected rows; chosen so no page content can contain it. */
const ROW_SEP = '<<<ROW>>>';

/**
 * Collects text from every open shadow root under the Inspector.
 *
 * Playwright's locators pierce shadow DOM, but `innerHTML`/`textContent` on a
 * matched element do not: a row whose content lives in a nested shadow root
 * reads as empty even while a locator can click a button inside it. That
 * combination -- a toggle that clicks fine, a payload that reads empty -- cost
 * two CI runs to diagnose, so the assertion no longer goes through locators at
 * all. The cursor work above still does, because that is what the video needs.
 */
async function deepText(page: Page, rootSelector: string): Promise<string> {
  return page
    .evaluate(({ sel, SEP }) => {
      const out: string[] = [];
      const walk = (node: Document | ShadowRoot | Element) => {
        for (const el of Array.from(node.querySelectorAll('*'))) {
          if (el.matches(sel)) out.push((el as HTMLElement).innerText || el.textContent || '');
          if (el.shadowRoot) walk(el.shadowRoot);
        }
      };
      walk(document);
      return out.join(SEP);
    }, { sel: rootSelector, SEP: ROW_SEP })
    .catch(() => '');
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
  // Longer than the largest `_background.timeoutMs` this tool has been seen to
  // declare. That value is NOT fixed -- recorded runs have carried both 10000
  // and 30000 -- so a 20s wait sat under the task's own timeout on some runs
  // and the card being unresolved proved nothing there. Outwaiting the ceiling
  // is what makes "still running" a finding rather than an artefact.
  console.log(`   ⏳ Letting the background job run past its declared timeout...`);
  await sleep(45000);

  const statusBeforeInspector = await readCardStatus(page);
  const badgeText =
    (await page.locator(ACTIVITY_CARD).first().textContent().catch(() => '')) ?? '';
  console.log(
    `   📌 Card after the job should have finished: data-status="${statusBeforeInspector}"` +
      `${badgeText.includes(WORKING_BADGE) ? ' (still reading "Working…")' : ''}`,
  );

  // ── Half 2: the Inspector's own read of the same stream ──────────────────
  //
  // Both nav steps go through inspector.action's helpers rather than matching
  // on button text. Text matching resolves to whichever ancestor contains the
  // words -- a panel wrapper, not the nav button -- and clicking that is a
  // silent no-op. The helpers walk shadow roots recursively, target
  // `data-inspector-menu-key`, and throw if the panel does not go active.
  await openInspector(page);

  console.log(`   Navigating to Threads...`);
  await openInspectorPanel(page, 'threads');
  await sleep(2000);

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
      const toggle = activityEvent
        .locator('button[aria-expanded], button:has-text("Show details")')
        .first();
      const haveToggle = await toggle.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`   🔬 details toggle visible: ${haveToggle}`);
      if (haveToggle) {
        const tb = await toggle.boundingBox();
        if (tb) {
          await glideTo(page, tb);
          await humanClick(page);
        } else {
          await toggle.click().catch(() => {});
        }
        await sleep(1500);
        // A glide-and-click lands on screen coordinates, so anything overlaying
        // the row swallows it silently. Verify, and fall back to a direct DOM
        // click that cannot be intercepted.
        if ((await toggle.getAttribute('aria-expanded').catch(() => null)) !== 'true') {
          console.log(`   🔬 cursor click did not expand it; clicking directly...`);
          await toggle.click({ force: true }).catch(() => {});
          await sleep(1500);
        }
        console.log(
          `   🔬 aria-expanded after clicking: ${await toggle
            .getAttribute('aria-expanded')
            .catch(() => 'unknown')}`,
        );
      }

      // The expanded payload renders as a <pre>. Read every one and pick the
      // background-task snapshot out by content: this build has no
      // `.cpk-td__event` row class, and allTextContents() is the accessor that
      // demonstrably works against its shadow DOM.
      const pres = await page
        .locator('pre')
        .allTextContents()
        .catch(() => [] as string[]);
      const payload = pres.find((t) => t.includes(BACKGROUND_ACTIVITY_TYPE)) ?? '';
      console.log(
        `   🔬 activity payload (${payload.length} chars): ${payload.slice(0, 300).replace(/\s+/g, ' ')}`,
      );
      const isBackgroundTask = payload.includes(BACKGROUND_ACTIVITY_TYPE);
      const taskStatus = /"status"\s*:\s*"([^"]+)"/.exec(payload)?.[1] ?? 'unknown';
      const runFinished = (
        await page.locator('.cpk-td__event-type').allTextContents().catch(() => [] as string[])
      ).some((t) => /run finished/i.test(t));
      evidenceShown = isBackgroundTask && runFinished;

      const box = await activityEvent.boundingBox();
      if (box) await glideTo(page, box);

      // Scroll on to "Run finished" and rest there. The snapshot alone shows a
      // task running; the contradiction only reads on screen when the viewer
      // also sees the run that has ended, and it sits below the fold.
      if (runFinished) {
        const finishedRow = page
          .locator('.cpk-td__event-type')
          .filter({ hasText: /run finished/i })
          .last();
        if (await finishedRow.isVisible({ timeout: 4000 }).catch(() => false)) {
          await finishedRow.scrollIntoViewIfNeeded().catch(() => {});
          await sleep(1200);
          const fb = await finishedRow.boundingBox();
          if (fb) {
            await glideTo(page, fb);
            console.log(`   🎯 Resting on the "Run finished" event.`);
            await sleep(4000);
          }
        }
      }

      if (evidenceShown) {
        console.log(
          `   ✓ Inspector: the run has FINISHED while the only ${BACKGROUND_ACTIVITY_TYPE} ` +
            `snapshot still reports status="${taskStatus}".`,
        );
      } else if (isBackgroundTask) {
        console.warn(
          `   ⚠ ${BACKGROUND_ACTIVITY_TYPE} snapshot found (status="${taskStatus}") but no ` +
            '"Run finished" event -- the run is still open, so nothing is wrong yet.',
        );
      } else {
        console.warn(
          `   ⚠ No ${BACKGROUND_ACTIVITY_TYPE} payload among ${pres.length} expanded blocks. ` +
            'The details toggle expanded but the payload is not a <pre> in this build.',
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
      `   🔴 FINDING REPRODUCED: the run finished with the background task still ` +
        `reported as running, and the card still reads "${WORKING_BADGE}" ` +
        `(data-status="${finalStatus}"). The client is never told the job ended.`,
    );
  } else if (stillWorking) {
    console.log(
      `   🟠 Card still reads "${WORKING_BADGE}" (data-status="${finalStatus}"), but the ` +
        `Inspector evidence was not captured -- this clip shows a stuck card, not ` +
        `a proven discrepancy.`,
    );
  } else {
    console.log(
      `   🟢 Card resolved to data-status="${finalStatus}" -- the completion event DID ` +
        `arrive on this run, which would mean the defect is intermittent.`,
    );
  }

  await restOn(page, ACTIVITY_CARD, config.waitAfterPromptMs ?? 4000);
};
