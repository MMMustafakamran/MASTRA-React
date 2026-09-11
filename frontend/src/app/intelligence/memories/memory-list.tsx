// Memories & Recall, "React" — the page's `components/memory-list.tsx`,
// verbatim. NOTHING IMPORTS THIS FILE, on purpose.
//
// The page imports `useMemories` from `@copilotkit/react-core`. That entry
// point is the v1 surface and has no such export — checked on 1.66.2 (this
// repo's lockfile) and 1.71.0 (what CI resolves): the hook ships only from
// `@copilotkit/react-core/v2`. So the snippet fails before it renders:
//
//   tsc        TS2305: Module '"@copilotkit/react-core"' has no exported
//              member 'useMemories'.
//   next dev   Turbopack refuses the module — a missing named export from an
//              ESM package is a compile error, not an `undefined` at runtime —
//              so any route importing this file does not build.
//
// The failed import leaves `useMemories` untyped, which knocks on into a second
// error on the `.map` callback (TS7006) — two errors from one wrong path.
//
// Kept verbatim with both errors acknowledged, so the file typechecks and stays
// the evidence. The demo runs the same component with the import moved to
// `/v2` (see `demo-chat/page.tsx`), which is the only change it needs.

// [1] memories: the page's React component
// @ts-expect-error — the page's import; `useMemories` is not exported from the package root.
import { useMemories } from "@copilotkit/react-core";

export function MemoryList() {
  const { memories, isLoading, isAvailable, removeMemory } = useMemories();

  if (!isAvailable) return <p>Memory is not available for this runtime.</p>;
  if (isLoading) return <p>Loading memories…</p>;

  return (
    <ul>
      {/* @ts-expect-error — knock-on of the import: `memories` is untyped, so this is TS7006. */}
      {memories.map((memory) => (
        <li key={memory.id}>
          {memory.content}
          <button type="button" onClick={() => void removeMemory(memory.id)}>
            Forget
          </button>
        </li>
      ))}
    </ul>
  );
}
