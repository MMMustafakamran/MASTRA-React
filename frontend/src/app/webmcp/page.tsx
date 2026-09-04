import { RouteHeader } from "@/components/route-header";

/**
 * Nothing is implemented here on purpose.
 *
 * The doc is an opt-in flag on a frontend tool (`webmcp: true`, or
 * `webmcp: { annotations }`) plus a browser-side discovery path. Its own
 * "Test the complete path" section requires Chrome 149 or newer with the
 * WebMCP origin trial enabled, an origin-isolated document, and Chrome’s
 * Model Context Tool Inspector extension. CopilotKit deliberately does
 * nothing when `document.modelContext` is missing, so a demo built here
 * would render a tool that silently never registers — a green clip of
 * nothing happening, which is worse than no clip.
 *
 * The page is tracked so drift is watched. When the flag can be exercised,
 * build the demo here and flip `status` in `lib/nav-config.ts`.
 */
export default function Page() {
  return <RouteHeader path="/webmcp" />;
}
