import { existsSync, readFileSync, statSync } from 'node:fs';
import { type Page } from 'playwright';
import { promptsFor, sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { sleep } from '../core/overlays/cursor';
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import {
  copilotkitVersionLine,
  type LogMark,
  markServerLogs,
  serverLogSince,
  showEvidence,
  showServerTerminal,
  writeNote,
} from './error-evidence';
import { glideClick, glideTo, visibleWithin, waitForText } from './glide-click';

/**
 * Frontend-Driven Cards -- a card in, a turn out, and the payload between them.
 *
 * The page makes two claims, and the take is built to film both. The card
 * renders in the transcript (click "Simulate: deployment finished"), and the
 * agent never receives it (send a turn, then read the probe row that prints the
 * roles in the run request that actually left the browser).
 *
 * ON THIS REPO THE TAKE FILMS A CRASH INSTEAD, reported as a warning (PASS*)
 * like the other doc defects -- a FAIL here would turn every nightly red for a
 * documented bug. The page's bare `useAgent()` and `<CopilotChat />` resolve to
 * agent id "default"; this repo's `/api/copilotkit` registers the Mastra agents
 * under their instance keys and has no `default`, so as soon as `/info`
 * answers, react-core throws "useAgent: Agent 'default' not found after runtime
 * sync" and Next's full-screen error overlay replaces the route. The handler
 * holds on that overlay, closes it, replays what the dev server logged, and
 * types the explanation. If the route ever survives (a `default` agent was
 * added, or the library stopped throwing), it falls through to the full
 * card-and-payload take. `ctx.fail` is kept for a surface that is genuinely
 * missing for some other reason.
 *
 * The click waits for `isReady true` on purpose. A card added while the runtime
 * is still connecting goes to a provisional agent and is silently dropped when
 * the real one arrives -- a finding in the sibling repos, but not what this
 * take is about. Clicking early would film that instead, randomly.
 */

const CARD = '.rounded-lg.border.p-4:has-text("Deployment finished")';
const CRASH = /Agent 'default' not found after runtime sync/;
const ROUTE = '/generative-ui/frontend-cards/demo-chat';
const RELEVANT = /activity|app-event-card|frontend-cards|\/agent\/[^/]+\/run|runtime sync|Agent 'default'/;

const CRASH_NOTE = [
  'frontend cards - the page code crashes the route on mastra',
  '',
  'step 3 useAgent() and step 2 <CopilotChat /> pass no agentId -> "default"',
  'mastra registers agents by their key (quickstart: agents: { myAgent })',
  'so there is no default. once /info answers, useAgent throws',
  '"agent default not found after runtime sync" and the page is gone',
  '',
  'with agentId="myAgent" it works: card renders, payload is user only,',
  'agent says it saw no card. the page never mentions agent ids',
  'also: step 3 watcher is never mounted by step 2, socket url is a placeholder',
];

const WORKING_NOTE = [
  'frontend cards - the route survived here',
  '',
  'card renders, payload row says user only, agent says it saw no card',
  'step 3 watcher is never mounted by step 2, socket url is a placeholder',
];

/**
 * The crash happens while the page loads, before this handler runs, so a mark
 * taken now would miss it. Start from the dev server's last request for this
 * route instead -- the load this take is filming.
 */
function markFromRouteLoad(rootPath: string): LogMark {
  const mark = markServerLogs(rootPath);
  for (const f of mark.files) {
    if (!existsSync(f.path)) continue;
    const text = readFileSync(f.path);
    const at = text.lastIndexOf(`GET ${ROUTE}`);
    if (at >= 0 && at < statSync(f.path).size) f.offset = at;
  }
  return mark;
}

async function crashText(page: Page, timeoutMs: number): Promise<string | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const hit = page.getByText(CRASH).first();
    if (await hit.isVisible().catch(() => false)) {
      return ((await hit.textContent().catch(() => '')) ?? '').trim();
    }
    const ready = await page
      .locator('[data-testid=agent-state]')
      .textContent({ timeout: 500 })
      .catch(() => null);
    if (ready?.includes('isReady true')) return null;
    await sleep(500);
  }
  return null;
}

export const runFrontendCardsAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  rootPath: string,
  ctx: ActionContext,
) => {
  const crashed = await crashText(page, 30_000);
  if (crashed !== null) {
    const logs = markFromRouteLoad(rootPath);
    console.log('   [Frontend Cards] the route crashed on runtime sync -- the finding.');
    ctx.warn(
      'The page\'s verbatim code crashes the route: bare useAgent()/<CopilotChat /> resolve to "default", ' +
        'which this Mastra runtime does not register -- ' +
        (crashed.slice(0, 220) || "useAgent: Agent 'default' not found after runtime sync"),
    );
    // 1. Next's own overlay is already up, full-screen: read it, then close it
    //    so the terminal and Notepad are not underneath it.
    await glideTo(page, page.getByText(CRASH).first(), 7000);
    await page.keyboard.press('Escape').catch(() => {});
    await sleep(800);
    // 2. What the dev server printed for that load, 3. the explanation.
    await showServerTerminal(page, serverLogSince(logs, { relevant: RELEVANT }));
    await writeNote(page, 'frontend-cards.txt', [...CRASH_NOTE, '', copilotkitVersionLine(rootPath)].join('\n'));
    return;
  }

  const logs = markServerLogs(rootPath);
  const state = page.locator('[data-testid=agent-state]');
  const ready = await waitForText(state, (t) => t.includes('isReady true'), 60_000);
  if (!ready.includes('isReady true')) {
    ctx.fail(`useAgent() never became ready (last: "${ready}") -- the card would go to a provisional agent`);
  }
  await glideTo(page, state, 1200);

  console.log('   [Frontend Cards] adding the activity card...');
  await glideClick(page, page.locator('[data-testid=add-activity-card]'));
  await sleep(1200);
  const card = page.locator(CARD).first();
  if (!(await visibleWithin(card, 5000))) {
    ctx.fail('The activity card never rendered in the transcript');
  } else {
    await glideTo(page, card, 1500);
  }

  const [prompt] = promptsFor(config);
  const msgCount = await sendPrompt(page, prompt);
  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000, msgCount);

  const payload = page.locator('[data-testid=roles-payload]');
  const roles = await waitForText(payload, (t) => !t.startsWith('no run'), 10_000);
  if (roles.startsWith('no run')) {
    ctx.warn('No run payload was captured, so the "agent never sees it" claim went unchecked');
  } else if (/\bactivity\b/.test(roles.split('(')[0])) {
    ctx.fail(`The activity message reached the agent: payload roles were "${roles}"`);
  }
  await glideTo(page, payload, 2500);

  await showEvidence(page, logs, {
    fileName: 'frontend-cards.txt',
    text: [...WORKING_NOTE, '', copilotkitVersionLine(rootPath)].join('\n'),
  }, { relevant: RELEVANT });
};
