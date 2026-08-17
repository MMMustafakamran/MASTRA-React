import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Reads real files out of this repository so a page can display its own
 * implementation verbatim.
 *
 * The point is comparability: the code shown next to a doc link has to be the
 * code that actually runs, not a re-typed approximation of it. Anything
 * hand-copied drifts the moment the implementation changes.
 *
 * Runs on the server only. During `next build` the contents are read once and
 * inlined into the prerendered page; in dev they are re-read on each request,
 * so edits show up immediately.
 */

/** `process.cwd()` is `frontend/` under both `next dev` and `next build`. */
const FRONTEND_ROOT = process.cwd();
export const REPO_ROOT = path.resolve(FRONTEND_ROOT, "..");

export interface SourceFile {
  /** Repo-relative path, shown as the caption. */
  path: string;
  code: string;
  language: string;
  /** Present when only part of the file is shown. */
  lineRange?: { start: number; end: number };
  error?: string;
}

function languageFor(file: string): string {
  if (file.endsWith(".tsx")) return "tsx";
  if (file.endsWith(".ts")) return "ts";
  if (file.endsWith(".py")) return "python";
  if (file.endsWith(".css")) return "css";
  if (file.endsWith(".json")) return "json";
  return "text";
}

function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Shared by the doc-sync store, which writes rather than reads — so the repo
 * root and the traversal guard are defined once. If the `process.cwd()`
 * assumption above ever breaks, both subsystems break together and are fixed
 * together, instead of one quietly resolving somewhere else.
 */
export function resolveInRepo(repoRelative: string): string {
  const resolved = path.resolve(REPO_ROOT, repoRelative);
  // Never let a path escape the repo — these strings are authored, but a typo
  // walking upward should fail loudly rather than read something unexpected.
  if (!resolved.startsWith(REPO_ROOT + path.sep)) {
    throw new Error(`Refusing to read outside the repo: ${repoRelative}`);
  }
  return resolved;
}

/**
 * @param repoRelative  Path from the repo root, e.g. "backend/agent.py".
 * @param region        Optional `#region <name>` marker to slice out. Markers
 *                      stay visible in the source file so the excerpt is
 *                      traceable back to it.
 */
export async function readSource(
  repoRelative: string,
  region?: string,
): Promise<SourceFile> {
  const language = languageFor(repoRelative);

  let raw: string;
  try {
    raw = await readFile(resolveInRepo(repoRelative), "utf8");
  } catch (error) {
    return {
      path: repoRelative,
      code: "",
      language,
      error:
        error instanceof Error
          ? `Could not read ${repoRelative}: ${error.message}`
          : `Could not read ${repoRelative}`,
    };
  }

  if (!region) {
    return { path: repoRelative, code: raw.trimEnd(), language };
  }

  const lines = raw.split("\n");
  // Accept both `//#region name` (TS convention) and `# region name` (the
  // Python one), so markers read naturally in whichever file they live in.
  const startRe = new RegExp(`#\\s?region\\s+${escapeRe(region)}\\b`);
  const endRe = /#\s?endregion\b/;
  const startIdx = lines.findIndex((l) => startRe.test(l));
  if (startIdx === -1) {
    return {
      path: repoRelative,
      code: raw.trimEnd(),
      language,
      error: `Region "${region}" not found — showing the whole file.`,
    };
  }
  const rest = lines.slice(startIdx + 1);
  const endOffset = rest.findIndex((l) => endRe.test(l));
  const body = endOffset === -1 ? rest : rest.slice(0, endOffset);

  return {
    path: repoRelative,
    code: body.join("\n").replace(/^\n+|\s+$/g, ""),
    language,
    lineRange: {
      start: startIdx + 2,
      end: startIdx + 1 + (endOffset === -1 ? rest.length : endOffset),
    },
  };
}

export async function readSources(
  entries: { file: string; region?: string }[],
): Promise<SourceFile[]> {
  return Promise.all(entries.map((e) => readSource(e.file, e.region)));
}
