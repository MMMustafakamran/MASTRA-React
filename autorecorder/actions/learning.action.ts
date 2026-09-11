import { type Page } from 'playwright';
import { promptsFor, sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { sleep } from '../core/overlays/cursor';
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { waitForDomSettled } from './page-ready';
import { copilotkitVersionLine, markServerLogs, showEvidence } from './error-evidence';
import { glideClick, glideTo, waitForText } from './glide-click';

/**
 * Learning -- one turn on each agent, each on a brand-new Thread, and the
 * container the platform bound each Thread to.
 *
 * The runtime's selector is `() => "firstlearningtest"`, the container created
 * in the Intelligence project's dashboard (the page's "Create a Learning
 * container" step). Both agents should answer, and the panel's "Thread
 * container (platform)" row -- the Thread read back from the runtime's own
 * threads route -- should read `firstlearningtest` for both.
 *
 * A missing or different container is a finding, not a recorder failure: the
 * take still films it and the warning says what the row showed.
 */

const CONTAINER = 'firstlearningtest';

const NOTE = [
  `learning - threads land in ${CONTAINER}`,
  '',
  `created the container ${CONTAINER} in the intelligence dashboard (page step 2)`,
  `runtime: getLearningContainerId: () => "${CONTAINER}"`,
  '',
  `expense-agent: new thread, answers, platform says container ${CONTAINER}`,
  `default: new thread, answers, platform says container ${CONTAINER}`,
  '',
  'minor, page side:',
  'agents + identifyUser used but never defined, needs runtime 1.70+ (not stated)',
  '(this repo locks 1.66.2, where getLearningContainerId does not exist)',
  'without the container the run fails "failed to initialize thread", chat blank.',
  'troubleshooting table only says the thread will not show in the container',
];

async function turn(page: Page, ctx: ActionContext, agentId: string, prompt: string, waitMs: number): Promise<string> {
  const ready = await waitForText(page.locator('[data-testid=learning-ready]'), (t) => t === 'true', 60_000);
  if (ready !== 'true') ctx.fail(`${agentId}: the agent never became ready`);
  await glideTo(page, page.locator('[data-testid=learning-assignment]'), 1500);

  const count = await sendPrompt(page, prompt);
  await waitForAgentResponseCompletion(page, waitMs, count);

  const bound = page.locator('[data-testid=learning-bound]');
  const container = await waitForText(bound, (t) => t !== '—' && t.length > 0, 20_000);
  await glideTo(page, bound, 2500);
  console.log(`   [Learning] ${agentId}: Thread container (platform) = ${container}`);
  if (container !== CONTAINER) {
    ctx.warn(`${agentId}: the Thread's container read "${container}", expected "${CONTAINER}"`);
  }
  return container;
}

export const runLearningAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  rootPath: string,
  ctx: ActionContext,
) => {
  const logs = markServerLogs(rootPath);
  const prompts = promptsFor(config);
  const waitMs = config.waitAfterPromptMs ?? 3000;

  console.log('   [Learning] 1/2: expense-agent...');
  const first = await turn(page, ctx, 'expense-agent', prompts[0], waitMs);

  console.log('   [Learning] 2/2: default...');
  await glideClick(page, page.locator('button:text-is("default")'));
  await sleep(400);
  await waitForDomSettled(page, { settleMs: 800 });
  const second = await turn(page, ctx, 'default', prompts[1] ?? prompts[0], waitMs);

  const text =
    first === CONTAINER && second === CONTAINER
      ? NOTE
      : [...NOTE.slice(0, 5), `expense-agent thread container: ${first}`, `default thread container: ${second}`, ...NOTE.slice(7)];

  await showEvidence(page, logs, {
    fileName: 'learning.txt',
    text: [...text, '', copilotkitVersionLine(rootPath)].join('\n'),
    // Not a bare /learning/: that also matches the Inspector's own
    // `inspector-learning … 503`, which is not the page's code.
  }, { relevant: /LEARNING_|expense-agent|initialize thread|copilotkit-learning\/agent\//i });
};
