import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';

export const runProgrammaticAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Programmatic Control] 1/2: Toggling Dark Mode in agent.state...`);
  const darkModeBtn = page.locator('button:has-text("Dark Mode")').first();
  if (await darkModeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    const dmBox = await darkModeBtn.boundingBox();
    if (dmBox) {
      await humanGlide(page, dmBox.x + dmBox.width / 2, dmBox.y + dmBox.height / 2, 20);
      await humanClick(page);
      console.log(`   Clicked Dark Mode!`);
      await sleep(1500);
    }
  }

  console.log(`   [Programmatic Control] 2/2: Sending draft message and running agent explicitly...`);
  // The draft box arrives pre-populated and submitting means clicking "Run agent",
  // which is the whole point of the page -- copilotkit.runAgent, not a chat submit.
  await sendPrompt(page, config.prompt, {
    inputSelector: 'input[placeholder="Message to send"]',
    submitSelector: 'button:has-text("Run agent")',
    clearFirst: true,
    timeoutMs: 12000,
  });

  console.log(`   Waiting for the run to stream into the transcript...`);
  await humanGlide(page, 960, 500, 25);

  // This page renders its own transcript -- no CopilotKit message classes at
  // all -- so the shared detector needs its own selector. Assistant rows are
  // the `.mr-8` ones; the user's are `.ml-8`. Without this the handler could
  // only sleep, and a run that never started still reported PASS.
  await waitForAgentResponseCompletion(
    page,
    config.waitAfterPromptMs ?? 1500,
    0,
    'section.space-y-2 > div.mr-8',
  );
};
