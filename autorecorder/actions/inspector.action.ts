import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { sendPrompt } from '../core/actions';

/**
 * Driving the CopilotKit Inspector.
 *
 * The Inspector is a Lit web component (`@copilotkit/web-inspector`) whose nav
 * lives behind NESTED shadow roots, so `document.querySelector` cannot see it
 * and a one-level shadow walk finds only the outer host. An earlier revision
 * matched `div`/`span` on `textContent`, which resolves to whichever ancestor
 * container happens to contain the words — a panel wrapper, not the nav button.
 * Clicking that wrapper's centre is a no-op, and the cursor lands mid-panel:
 * the clip looked like it did something and had not.
 *
 * Three rules came out of that, and they are why this file looks the way it
 * does:
 *
 *   1. **Walk shadow roots recursively.** One level is not enough.
 *   2. **Target `data-inspector-menu-key`, never text.** The nav renders that
 *      attribute on each leaf button. Labels are translated, renamed between
 *      releases, and duplicated on containers; the key is none of those things.
 *   3. **Click with a real mouse at resolved coordinates.** `el.click()` fires
 *      the handler without moving the cursor overlay, so the video shows a
 *      panel changing with no visible interaction.
 *
 * And one rule about honesty: assert the panel actually became active, and
 * throw if it did not. A recording that quietly skips the single interaction it
 * exists to show is worse than a failed one, because it looks like a pass.
 *
 * ── Which panel ────────────────────────────────────────────────────────────
 * `agents` renders EMPTY on these demo pages — there is no per-agent detail to
 * show for a single-agent app — so a clip that opens it documents a blank
 * rectangle. `ag-ui-events` is the panel with content: the protocol events the
 * run actually produced. That swap is the point of this action.
 *
 * ── Why the shadow walks below are LOOPS, not recursive functions ──────────
 * Every walk is an explicit stack loop containing NO named inner function, and
 * that is load-bearing.
 *
 * `page.evaluate` serialises its callback and ships the source to the browser.
 * tsx compiles this suite through esbuild with `keepNames`, which rewrites any
 * named function binding — `const walk = (root) => ...` included — into a call
 * to esbuild's `__name` helper. That helper is injected into the Node module
 * scope and does not exist in the page, so such a callback dies on arrival with
 * `ReferenceError: __name is not defined`.
 *
 * A previous revision shipped the walk as a string and `eval`'d it in the page,
 * which sidesteps the transform because esbuild never sees it as code.
 * Replacing that with a tidier recursive arrow broke all three repos at once —
 * and, because several call sites swallowed the error, it broke them *quietly*.
 * Loops keep the code visible to the type checker AND out of `keepNames`' reach.
 *
 * If you add another `page.evaluate` in this suite: no named functions inside
 * it, and do not wrap it in a `.catch()` that hides this class of failure.
 *
 * ── Version floor ──────────────────────────────────────────────────────────
 * `data-inspector-menu-key` exists in @copilotkit/web-inspector 1.69.x. Older
 * installs (1.66.x still sits in some repos' node_modules) do not have it, so
 * the throw below is the correct outcome there rather than a silent fallback to
 * text matching — CI resolves without a lockfile and gets 1.69.x, and a local
 * run on 1.66.x SHOULD fail loudly rather than record something different from
 * what CI records.
 */

/** Nav keys the Inspector renders. `agents` is deliberately not used here. */
export type InspectorMenuKey =
  | 'agents'
  | 'ag-ui-events'
  | 'agent-context'
  | 'frontend-tools'
  | 'capabilities'
  | 'threads'
  | 'memories';

/** Opens the Inspector overlay. Returns false when no trigger is on screen. */
export async function openInspector(page: Page): Promise<boolean> {
  console.log(`   Opening CopilotKit Inspector overlay...`);
  const triggerPos = await page.evaluate(() => {
    const stack: (Document | ShadowRoot)[] = [document];
    const seen = new Set<Document | ShadowRoot>();
    let btn: HTMLElement | null = null;
    while (stack.length > 0) {
      const root = stack.pop();
      if (!root || seen.has(root)) continue;
      seen.add(root);
      btn = root.querySelector(
        'button[aria-label*="Inspector" i], button[aria-label*="Console" i], #trigger, .trigger',
      ) as HTMLElement | null;
      if (btn) break;
      for (const el of Array.from(root.querySelectorAll('*'))) {
        if (el.shadowRoot) stack.push(el.shadowRoot);
      }
    }
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

  if (!triggerPos) {
    console.warn(
      '   ⚠ Inspector trigger not found. It mounts only on localhost ' +
        '(showDevConsole="auto") -- check the provider and the host in ' +
        'config/project.config.ts.',
    );
    return false;
  }

  await humanGlide(page, triggerPos.x, triggerPos.y, 22);
  await humanClick(page);
  await sleep(2500);
  return true;
}

/**
 * Selects one Inspector nav panel and proves it became active.
 *
 * Leaves live inside collapsible groups, so a leaf that is not in the DOM yet
 * is looked for again after opening each group. Groups toggle, so they are only
 * touched when the leaf is genuinely missing -- clicking them all up front
 * would close whichever one was already open.
 *
 * @throws if the nav item cannot be found, or does not go active once clicked.
 */
export async function openInspectorPanel(
  page: Page,
  menuKey: InspectorMenuKey,
): Promise<void> {
  const locate = async (): Promise<{ x: number; y: number } | null> =>
    page.evaluate((key) => {
      const stack: (Document | ShadowRoot)[] = [document];
      const seen = new Set<Document | ShadowRoot>();
      let tab: HTMLElement | null = null;
      while (stack.length > 0) {
        const root = stack.pop();
        if (!root || seen.has(root)) continue;
        seen.add(root);
        tab = root.querySelector(
          `button[data-inspector-menu-key="${key}"]`,
        ) as HTMLElement | null;
        if (tab) break;
        for (const el of Array.from(root.querySelectorAll('*'))) {
          if (el.shadowRoot) stack.push(el.shadowRoot);
        }
      }
      if (!tab) return null;
      tab.scrollIntoView({ block: 'center', inline: 'center' });
      const r = tab.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return null;
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, menuKey);

  let pos = await locate();

  if (!pos) {
    // The leaf's group is collapsed. Open groups one at a time, re-checking
    // after each, so an already-open group is never toggled shut.
    const groups: string[] = await page.evaluate(() => {
      const stack: (Document | ShadowRoot)[] = [document];
      const seen = new Set<Document | ShadowRoot>();
      const out: string[] = [];
      while (stack.length > 0) {
        const root = stack.pop();
        if (!root || seen.has(root)) continue;
        seen.add(root);
        for (const el of Array.from(
          root.querySelectorAll(
            'button[data-inspector-group]:not([data-inspector-menu-key])',
          ),
        )) {
          const g = el.getAttribute('data-inspector-group');
          if (g && !out.includes(g)) out.push(g);
        }
        for (const el of Array.from(root.querySelectorAll('*'))) {
          if (el.shadowRoot) stack.push(el.shadowRoot);
        }
      }
      return out;
    });

    for (const group of groups) {
      await page.evaluate((g) => {
        const stack: (Document | ShadowRoot)[] = [document];
        const seen = new Set<Document | ShadowRoot>();
        while (stack.length > 0) {
          const root = stack.pop();
          if (!root || seen.has(root)) continue;
          seen.add(root);
          const hit = root.querySelector(
            `button[data-inspector-group="${g}"]:not([data-inspector-menu-key])`,
          ) as HTMLElement | null;
          if (hit) {
            hit.click();
            return;
          }
          for (const el of Array.from(root.querySelectorAll('*'))) {
            if (el.shadowRoot) stack.push(el.shadowRoot);
          }
        }
      }, group);
      await sleep(600);
      pos = await locate();
      if (pos) break;
    }
  }

  if (!pos) {
    throw new Error(
      `[Inspector] Could not find the "${menuKey}" nav item ` +
        `(button[data-inspector-menu-key="${menuKey}"]) in any shadow root. ` +
        'Either the nav markup changed, or @copilotkit/web-inspector is older ' +
        'than 1.69 and does not carry the attribute at all.',
    );
  }

  console.log(`   🎯 "${menuKey}" at (${Math.round(pos.x)}, ${Math.round(pos.y)})`);
  await humanGlide(page, pos.x, pos.y, 20);
  await humanClick(page);
  await sleep(1200);

  const active = await page.evaluate((key) => {
    const stack: (Document | ShadowRoot)[] = [document];
    const seen = new Set<Document | ShadowRoot>();
    let tab: HTMLElement | null = null;
    while (stack.length > 0) {
      const root = stack.pop();
      if (!root || seen.has(root)) continue;
      seen.add(root);
      tab = root.querySelector(
        `button[data-inspector-menu-key="${key}"]`,
      ) as HTMLElement | null;
      if (tab) break;
      for (const el of Array.from(root.querySelectorAll('*'))) {
        if (el.shadowRoot) stack.push(el.shadowRoot);
      }
    }
    return (
      tab?.getAttribute('aria-current') === 'page' ||
      !!tab?.className.includes('inspector-nav-control-active')
    );
  }, menuKey);

  if (!active) {
    throw new Error(
      `[Inspector] Clicked the "${menuKey}" nav item but it did not become ` +
        'active -- the panel did not switch.',
    );
  }
  console.log(`   ✓ "${menuKey}" panel is active.`);
}

export const runInspectorAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Inspector] Sending message to populate the Inspector...`);
  await sendPrompt(page, config.prompt, { timeoutMs: 12000 });

  console.log(`   Waiting for initial agent response...`);
  await sleep(4500);

  await openInspector(page);

  // `agents` renders empty on a single-agent demo; `ag-ui-events` is where the
  // run's actual protocol traffic shows up.
  console.log(`   Selecting the AG-UI Events panel...`);
  await openInspectorPanel(page, 'ag-ui-events');
  await sleep(4000);

  await humanGlide(page, 960, 500, 25);
  await sleep(config.waitAfterPromptMs ?? 4000);
};
