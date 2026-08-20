import { type Page } from 'playwright';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';

/**
 * The doc's `sayHello` tool, executed in the browser rather than in the agent.
 *
 * ── Why this page needs a dialog handler ───────────────────────────────────
 * The handler body is `alert(\`Hello, \${name}!\`)`. A native alert is browser
 * chrome, not page content, so it never appears in the recording -- and left
 * unhandled it blocks the page: Playwright's default is to dismiss dialogs
 * automatically, which works, but it happens silently and there is then no
 * evidence in the run output that the browser-side handler ever fired.
 *
 * Handling it explicitly fixes both halves. The listener accepts the dialog so
 * the handler can return, and records its message -- which is the only proof
 * that the tool executed *in this browser* rather than the agent having
 * described a greeting in prose. That distinction is the entire point of the
 * page, and without this check a plain-text answer would still report PASS.
 */
export const runFrontendToolsAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  const dialogs: string[] = [];
  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.message());
    console.log(`   🔔 Browser dialog fired: "${dialog.message()}"`);
    await dialog.accept().catch(() => {});
  });

  console.log(`   [Frontend Tools] Sending prompt to trigger the browser sayHello tool...`);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 12000 });

  // The agent's confirmation only arrives after the handler returned its string
  // over AG-UI, so waiting for the reply also waits for the round trip.
  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000, msgCount);

  if (dialogs.length === 0) {
    throw new Error(
      'The sayHello handler never ran: no browser dialog fired during the run. ' +
        'The agent answered in text instead of calling the tool, or the tool was ' +
        'not forwarded in the AG-UI run input.',
    );
  }
};
