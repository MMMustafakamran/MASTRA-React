import { highlight } from "@/lib/highlight";

/**
 * The one code block in the app.
 *
 * Both `SourceCode` (files read off disk) and `CodeBlock` (inline snippets)
 * render through this, so caption, scrolling, and highlighting stay identical
 * between them.
 *
 * Async because highlighting is async. Every caller is a server component.
 */
export async function CodeFigure({
  code,
  caption,
  language,
  note,
  scroll = "block",
}: {
  code: string;
  /** Shown on the left of the caption bar — usually a file path. */
  caption?: string;
  /** Drives both the caption badge and the grammar used. */
  language?: string;
  /** Warning line between the caption and the code. */
  note?: string;
  /**
   * "block" caps the height and scrolls both ways — right for whole files.
   * "inline" only scrolls horizontally — right for short snippets.
   */
  scroll?: "block" | "inline";
}) {
  const html = language ? await highlight(code, language) : null;
  const scrollClass =
    scroll === "block" ? "max-h-[36rem] overflow-auto" : "overflow-x-auto";

  return (
    <figure className="code-figure overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
      {(caption || language) && (
        <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-2 font-mono text-xs text-slate-400">
          <span className="min-w-0 break-all">{caption}</span>
          {language && <span className="shrink-0 uppercase">{language}</span>}
        </figcaption>
      )}

      {note && (
        <p className="border-b border-amber-900 bg-amber-950/40 px-4 py-2 text-xs text-amber-200">
          {note}
        </p>
      )}

      {html ? (
        // Shiki emits its own <pre class="shiki">; globals.css sizes and pads it.
        // The input is this repo's own files, read server-side, and Shiki
        // escapes the code content.
        <div
          className={scrollClass}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre
          className={`${scrollClass} p-4 text-xs leading-relaxed text-slate-100`}
        >
          <code>{code}</code>
        </pre>
      )}
    </figure>
  );
}
