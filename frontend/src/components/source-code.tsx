import { readSource, type SourceFile } from "@/lib/source";

import { CodeFigure } from "./code-figure";

/**
 * Renders a file from this repository verbatim.
 *
 * Server component — it reads from disk during render, so what appears here is
 * always the code currently in the repo. Compare it directly against the doc
 * page linked in the route header.
 */

function captionFor(source: SourceFile): string {
  return source.lineRange
    ? `${source.path}  ·  lines ${source.lineRange.start}–${source.lineRange.end}`
    : source.path;
}

export async function SourceCode({
  file,
  region,
}: {
  /** Repo-relative path, e.g. "backend/agent.py". */
  file: string;
  /** Optional `#region <name>` marker to slice out. */
  region?: string;
}) {
  const source = await readSource(file, region);

  return (
    <CodeFigure
      code={source.code}
      caption={captionFor(source)}
      language={source.language}
      note={source.error}
    />
  );
}

export async function SourceCodeGroup({
  files,
  note,
}: {
  files: { file: string; region?: string }[];
  note?: React.ReactNode;
}) {
  const sources = await Promise.all(
    files.map(({ file, region }) => readSource(file, region)),
  );

  return (
    <div className="space-y-4">
      {sources.map((source) => (
        <CodeFigure
          key={`${source.path}-${source.lineRange?.start ?? 0}`}
          code={source.code}
          caption={captionFor(source)}
          language={source.language}
          note={source.error}
        />
      ))}
      {note && (
        <p className="text-sm text-slate-600 dark:text-slate-400">{note}</p>
      )}
    </div>
  );
}
