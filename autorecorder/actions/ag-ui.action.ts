import { type Page } from 'playwright';
import { humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';

export const runAgUiAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [AG-UI] Sending message to capture live SSE event stream...`);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 8000 });

  console.log(
    `   Showcasing live AG-UI event log stream (RUN_STARTED -> TEXT_MESSAGE_CONTENT -> TOOL_CALL -> RUN_FINISHED)...`,
  );
  // Move cursor over event log panel on the left while events stream
  await sleep(1500);
  await humanGlide(page, 450, 300, 22);
  await sleep(1500);
  await humanGlide(page, 450, 550, 22);

  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000, msgCount);
};
