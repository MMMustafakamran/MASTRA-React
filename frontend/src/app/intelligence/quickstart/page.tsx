import { RouteHeader } from "@/components/route-header";

/**
 * Nothing is implemented here on purpose.
 *
 * Step 1 of the doc is `npx copilotkit@latest login` followed by
 * `project select`, which writes a `CPK_INTELLIGENCE_API_KEY` for a hosted
 * Intelligence project. Without that project there is no runtime to point
 * `CopilotKitIntelligence` at, so every later step — persistent threads,
 * Inspector showing "connected" — has nothing to assert against.
 *
 * The rest of the `/intelligence` section stays in the manifest’s
 * `knownUnmapped` list: those pages are the old `/premium/*` pages under a
 * new prefix, and were declined before. This one is tracked because it is
 * genuinely new rather than a rename.
 */
export default function Page() {
  return <RouteHeader path="/intelligence/quickstart" />;
}
