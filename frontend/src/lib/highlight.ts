import "server-only";

import { createHighlighter, type Highlighter } from "shiki";

/**
 * Syntax highlighting for the code shown on doc routes.
 *
 * Runs on the server only. Every page that renders code is a server component,
 * so the grammars never reach the browser and most routes are highlighted once
 * at build time rather than per request.
 *
 * Two choices worth knowing:
 *
 * - **One highlighter, created lazily and reused.** `createHighlighter` loads
 *   grammars and a theme and is expensive; several pages render four or more
 *   blocks. The promise is cached at module scope so that cost is paid once per
 *   process, not once per block.
 * - **A single dark theme.** The code figure is always dark (`bg-slate-950`)
 *   regardless of the page theme, so emitting light/dark CSS variables would
 *   produce unreadable light-on-dark text in light mode.
 */

const THEME = "github-dark";

/** Exactly what `languageFor()` in `lib/source.ts` can return, minus "text". */
const LANGS = ["tsx", "ts", "python", "bash", "yaml", "json"] as const;

type SupportedLang = (typeof LANGS)[number];

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= createHighlighter({
    themes: [THEME],
    langs: [...LANGS],
  });
  return highlighterPromise;
}

function isSupported(lang: string): lang is SupportedLang {
  return (LANGS as readonly string[]).includes(lang);
}

/**
 * @returns Highlighted HTML, or `null` when the language has no grammar — the
 *   caller then renders the code as plain text rather than showing nothing.
 */
export async function highlight(
  code: string,
  lang: string,
): Promise<string | null> {
  if (!isSupported(lang)) return null;

  try {
    const highlighter = await getHighlighter();
    return highlighter.codeToHtml(code, { lang, theme: THEME });
  } catch {
    // Never let a highlighting failure blank out a page's source panel.
    return null;
  }
}
