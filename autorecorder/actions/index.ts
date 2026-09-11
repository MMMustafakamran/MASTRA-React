/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADAPT THIS DIRECTORY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * What the recorder *does* on each demo page once it is open.
 *
 * The registry lives here rather than in `core/` on purpose: adding or removing
 * a page must never mean editing frozen code. A page with no entry falls back
 * to `runStandardAction` — type the prompt, submit, wait for the reply — which
 * is right for most pages. Write a handler only when a page needs more than
 * that: switching tabs, clicking an approval button, opening a panel.
 *
 * ── How this map was built ─────────────────────────────────────────────────
 * A specialised handler is wired only where this repo's demo page actually
 * contains the DOM that handler drives — the tab labels it clicks, the
 * placeholder it types into, the button it presses. Pages that look similar but
 * render differently are deliberately left on `runStandardAction` rather than
 * wired optimistically, because a handler pointed at the wrong DOM fails the
 * run. Unwired handler files are kept: they are the closest starting point when
 * one of those pages does need driving.
 *
 * Handlers should build on the helpers in `core/actions.ts`:
 *
 *   sendPrompt(page, prompt, opts)          types and submits, returns the
 *                                           assistant-message count from before
 *                                           submitting
 *   waitForAgentResponseCompletion(...)     waits for the reply to finish, and
 *                                           throws if none ever arrives
 *   promptsFor(config)                      the page's prompts[] , or [prompt]
 *
 * Pass that returned count into waitForAgentResponseCompletion on multi-turn
 * pages, or the previous turn's reply is mistaken for this one's.
 *
 * The fourth argument, `ctx`, is how a handler reports what it saw:
 *
 *   ctx.warn('Language panel still reads "english"')   -> [PASS*] with the note
 *   ctx.fail('Approve button never rendered')           -> [FAIL], clip still saved
 *
 * A `console.log` reaches nobody: the summary and the CI report only see what
 * goes through `ctx`.
 */

import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { runStandardAction } from '../core/actions';
import { type Page } from 'playwright';

import { READY_INPUT_OVERRIDES, waitForPageReady } from './page-ready';

import {
  runSharedStateReadAction,
  runSharedStateWriteAction,
} from './shared-state.action';
import { runA2uiAction } from './a2ui.action';
import { runAgUiAction } from './ag-ui.action';
import { runBackgroundTasksAction } from './background-tasks.action';
import { runDisplayOnlyAction } from './display-only.action';
import { runFrontendCardsAction } from './frontend-cards.action';
import { runFrontendToolsAction } from './frontend-tools.action';
import { runGovernedActionsAction } from './governed-actions.action';
import { runHeadlessUiAction } from './headless-ui.action';
import { runHitlAction } from './hitl.action';
import { runInspectorAction } from './inspector.action';
import { runInteractiveAction } from './interactive.action';
import { runLearningAction } from './learning.action';
import { runMemoriesAction } from './memories.action';
import { runPredictiveStateAction } from './predictive-state.action';
import { runPrebuiltAction } from './prebuilt.action';
import { runProgrammaticAction } from './programmatic.action';
import { runRuntimeAction } from './runtime.action';
import { runSlotsAction } from './slots.action';
import { runStateRenderingAction } from './state-rendering.action';
import { runToolRenderingAction } from './tool-rendering.action';

/** Keys are page ids from `config/pages.config.ts`. Doctor flags any orphans. */
export const ACTION_MAP: Record<string, PageActionHandler> = {
  "prebuilt-components": runPrebuiltAction,
  "custom-look-and-feel-slots": runSlotsAction,
  "custom-look-and-feel-headless-ui": runHeadlessUiAction,
  "programmatic-control": runProgrammaticAction,
  "inspector": runInspectorAction,
  "generative-ui-your-components-display-only": runDisplayOnlyAction,
  // Registered 2026-09-09. The page renders an approval card and SUSPENDS the
  // run on it; on `runStandardAction` nobody ever clicked Approve, so the take
  // filmed a turn that never finished on the page about finishing it.
  "generative-ui-your-components-interactive": runInteractiveAction,
  "generative-ui-tool-rendering": runToolRenderingAction,
  // Registered 2026-09-09 alongside the two-search prompt pair. The handler it
  // replaces asserted the list stays EMPTY -- true of a sibling repo whose doc
  // shipped React in a Python block, never of this one.
  "generative-ui-state-rendering": runStateRenderingAction,
  // Added 2026-09-09. This page is EXPECTED TO FAIL: the doc's published
  // a2ui setup renders nothing, and a prose answer would satisfy the shared
  // reply detector. The handler reads the surface so the take reports the
  // defect instead of passing on it.
  "generative-ui-a2ui": runA2uiAction,
  "frontend-tools": runFrontendToolsAction,
  // Registered 2026-09-09. Same reason as Interactive: `offerOptions` parks the
  // run until `respond` fires, and the two labels are model-authored so they
  // need the structural matcher in hitl.action.ts rather than Interactive's
  // fixed "Approve"/"Reject".
  "human-in-the-loop-tool-based": runHitlAction,
  "human-in-the-loop-governed-actions": runGovernedActionsAction,
  "shared-state-in-app-agent-read": runSharedStateReadAction,
  // Registered 2026-09-09. Writing is the app -> agent direction and it starts
  // with a button click; a chat prompt alone re-tests the Read page.
  "shared-state-in-app-agent-write": runSharedStateWriteAction,
  // Registered 2026-09-09. The chat is the one surface this page keeps
  // nearly empty, so the shared reply detector can pass on "Sure, I've
  // drafted that" while the document pane never fills. Read the pane.
  "shared-state-predictive-state-updates": runPredictiveStateAction,
  "ag-ui": runAgUiAction,
  // Registered 2026-09-09 with this app's camelCase agent ids. Unwired, the
  // page recorded one turn on the default agent and never clicked a route.
  "copilot-runtime": runRuntimeAction,
  "background-tasks": runBackgroundTasksAction,
  // Added 2026-09-11 with the three pages new upstream. All three report their
  // doc defects as warnings (PASS*) -- Frontend-Cards films a route crash on
  // this repo (no `default` agent) -- and end on overlay, terminal, Notepad.
  "frontend-cards": runFrontendCardsAction,
  "intelligence-memories": runMemoriesAction,
  learning: runLearningAction,
};

export async function executePageAction(
  page: Page,
  config: PageRecordConfig,
  rootPath: string,
  ctx: ActionContext,
): Promise<void> {
  // One gate for every page, including the ones that fall through to
  // runStandardAction. The engine waits for the route to respond and for
  // `chatReady` to be visible, but a dev server compiles client chunks lazily,
  // so markup can be on screen before anything is wired to it -- and a prompt
  // typed into an unhydrated input goes nowhere. Handlers that remount a chat
  // mid-run (tab switches) call waitForDomSettled again themselves.
  //
  // Pages that are not driven through a chat box name their own control in
  // READY_INPUT_OVERRIDES; without it the gate waits on a chat input the page
  // never renders and spends its whole timeout before every such recording.
  await waitForPageReady(page, {
    label: config.id,
    inputSelector: READY_INPUT_OVERRIDES[config.id],
  });

  const handler = ACTION_MAP[config.id] ?? runStandardAction;
  await handler(page, config, rootPath, ctx);
}
