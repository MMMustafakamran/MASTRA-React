import { readManifest } from "@/lib/doc-sync/store";

/**
 * The repo's single doc-sync date, read from the snapshot manifest.
 *
 * A component rather than a constant because the date is now machine-written:
 * it changes whenever the sync button runs, so nothing can hold it as a
 * compile-time value. Being a `ReactNode` lets it drop into either place the
 * old constant was used — a `KeyValue` row, or mid-sentence in prose.
 *
 * Any page rendering this needs `export const dynamic = "force-dynamic"`,
 * otherwise `next build` inlines whatever the snapshot said at build time.
 */
export async function DocSyncedAt({ withPages = false }: { withPages?: boolean }) {
  const state = await readManifest();

  if (state.kind !== "ok") {
    return <span>never synced</span>;
  }

  const day = state.manifest.syncedAt.slice(0, 10);
  const count = Object.keys(state.manifest.pages).length;

  return <span>{withPages ? `${day} · ${count} pages` : day}</span>;
}
