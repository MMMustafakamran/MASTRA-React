import { type Page } from 'playwright';
import {
  AgentSilentError,
  promptsFor,
  sendPrompt,
  waitForAgentResponseCompletion,
} from '../core/actions';
import { sleep } from '../core/overlays/cursor';
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { waitForDomSettled } from './page-ready';
import { glideClick, glideTo, waitForText } from './glide-click';

/**
 * Learning -- one turn on the agent the page's selector assigns, one on the
 * agent it does not.
 *
 * `expense-agent` is routed to the `expense-review` container, which does not
 * exist in this harness's Intelligence project. The platform refuses to create
 * the Thread (`LEARNING_CONTAINER_NOT_FOUND`), the run 404s with "Failed to
 * initialize thread", and the chat shows nothing at all. Silence on that turn is
 * the finding, so it is waited out rather than treated as a recorder failure --
 * and if the agent DOES answer, the container has been created since and the
 * finding needs revisiting, which is what the warning says.
 *
 * `default` is the control: same runtime, same Mastra agent, selector returns
 * `undefined`, and it answers.
 */

async function readyOn(page: Page, ctx: ActionContext, agentId: string): Promise<void> {
  const ready = await waitForText(page.locator('[data-testid=learning-ready]'), (t) => t === 'true', 60_000);
  if (ready !== 'true') ctx.fail(`${agentId}: the agent never became ready`);
  await glideTo(page, page.locator('[data-testid=learning-assignment]'), 1500);
}

export const runLearningAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  _rootPath: string,
  ctx: ActionContext,
) => {
  const prompts = promptsFor(config);

  console.log('   [Learning] 1/2: expense-agent -> "expense-review"...');
  await readyOn(page, ctx, 'expense-agent');
  const assignedCount = await sendPrompt(page, prompts[0]);
  try {
    await waitForAgentResponseCompletion(page, 2000, assignedCount, undefined, {
      startTimeoutMs: 25_000,
    });
    ctx.warn(
      'expense-agent answered. The expense-review container may exist in the project now -- re-check the finding on /learning.',
    );
  } catch (error) {
    if (!(error instanceof AgentSilentError)) throw error;
    console.log('   [Learning] expense-agent stayed silent -- the finding.');
    ctx.warn(
      'expense-agent never answered: its Thread is assigned to "expense-review", which does not exist, ' +
        'and the run fails with "Failed to initialize thread" while the chat shows nothing',
    );
    await sleep(1500);
  }

  console.log('   [Learning] 2/2: default -> no container...');
  await glideClick(page, page.locator('button:text-is("default")'));
  await sleep(400);
  await waitForDomSettled(page, { settleMs: 800 });
  await readyOn(page, ctx, 'default');
  const controlCount = await sendPrompt(page, prompts[1] ?? prompts[0]);
  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 3000, controlCount);
};
