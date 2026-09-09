import { type Page } from 'playwright';
import { humanGlide, sleep } from '../core/overlays/cursor';
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';

/**
 * A2UI — and a page that is expected to FAIL.
 *
 * The doc's Backend section promises that once `a2ui` is set on the runtime,
 * "any A2UI output returned from your agent will automatically be rendered in
 * the chat interface -- no additional frontend code required." With the
 * published configuration it renders nothing: the agent is never offered a
 * rendering tool, so it describes the layout in prose instead. The reasoning is
 * traced in `api/copilotkit/[[...slug]]/route.ts`.
 *
 * `runStandardAction` cannot express that. It waits for an assistant message,
 * and a prose answer IS an assistant message -- a long, confident, entirely
 * text one. The take would report PASS on the exact failure the route was
 * added to document.
 *
 * So the surface is read directly. The A2UI renderer marks what it draws with
 * an `a2ui-surface` class (confirmed by probe: present with
 * `injectA2UITool: true`, absent without it), which makes it the one signal
 * that separates a rendered component tree from a paragraph describing one.
 */

/** What the bundled A2UI renderer puts on the surface it draws. */
const SURFACE = '[class*="a2ui-surface"]';

export const runA2uiAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  _rootPath: string,
  ctx: ActionContext,
) => {
  console.log(`   [A2UI] Asking the agent for a layout rather than a description...`);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 12000 });

  const reply = await waitForAgentResponseCompletion(
    page,
    config.waitAfterPromptMs ?? 7000,
    msgCount,
    undefined,
    {
      startTimeoutMs: ctx.timeouts.replyStartMs,
      streamTimeoutMs: ctx.timeouts.replyStreamMs,
    },
  );
  if (reply.streamTimedOut) {
    ctx.warn('The reply was still streaming when the cap expired.');
  }

  // A surface can be emitted after the last text token, so give the stream a
  // beat to settle before deciding it never arrived.
  await sleep(2000);
  const surfaces = await page.locator(SURFACE).count().catch(() => 0);
  console.log(`   A2UI surfaces rendered: ${surfaces}`);

  // Hold on the thread either way -- the prose answer is the evidence when
  // there is nothing else to show.
  const message = page.locator('.copilotKitAssistantMessage, [data-message-role="assistant"]').last();
  const box = await message.boundingBox().catch(() => null);
  if (box) {
    await humanGlide(page, box.x + Math.min(box.width / 2, 240), box.y + 60, 22);
  }
  await sleep(3000);

  if (surfaces === 0) {
    ctx.fail(
      'No A2UI surface rendered. The runtime carries the `a2ui` option exactly ' +
        'as the doc publishes it, and the doc states no frontend code is ' +
        'required -- but with no A2UI catalog registered on the client, the ' +
        'runtime resolves `injectA2UITool` to undefined, @ag-ui/a2ui-middleware ' +
        'injects no rendering tool, and the agent answers in prose. The setup ' +
        'as published cannot render; it needs `injectA2UITool: true` or a ' +
        'frontend catalog, and the overview page names neither.',
    );
    return;
  }

  // If a future version starts rendering from the published config, this is
  // where the take stops being a finding -- say so rather than silently passing.
  console.log(`   A2UI rendered from the published configuration.`);
};
