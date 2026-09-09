import { RouteHeader } from "@/components/route-header";
import { SourceCode } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

/**
 * Steps 3 and 4 of the doc are implemented here. Steps 1, 2 and 5 are not, and
 * cannot be: they start at `npx copilotkit@latest login` and a
 * `CPK_INTELLIGENCE_API_KEY` from a hosted Intelligence project, which is an
 * account-scoped resource this harness does not have.
 *
 * The route used to be a bare header for that reason. It stopped being one when
 * the 2026-09-09 sync rewrote steps 3 and 4 from the multi-route handler to the
 * single-route one — that half needs no hosted project, so it is now the half
 * under test.
 */
export default function Page() {
  return (
    <>
      <RouteHeader path="/intelligence/quickstart" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The single-route runtime transport. Until the 2026-09-09 sync this
          page mounted the multi-route handler at{" "}
          <code>app/api/copilotkit/[[...slug]]/route.ts</code> and exported four
          verbs. It now mounts <code>mode: &quot;single-route&quot;</code> at a
          plain <code>route.ts</code>, exports only <code>POST</code>, and pairs
          it with <code>useSingleEndpoint</code> on the provider.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          That is a third runtime mount in this repo, not a rewrite of
          an existing one. <code>/api/copilotkit</code> stays multi-route
          because{" "}
          <a
            href="/quickstart"
            className="text-[var(--accent)] underline underline-offset-4"
          >
            Quickstart
          </a>{" "}
          and{" "}
          <a
            href="/copilot-runtime"
            className="text-[var(--accent)] underline underline-offset-4"
          >
            Copilot Runtime
          </a>{" "}
          both still publish <code>[[...slug]]</code>, <code>GET</code> +{" "}
          <code>POST</code>, and <code>useSingleEndpoint=&#123;false&#125;</code>.
          <code>/api/copilotkit-threads</code> stays multi-route because the
          thread REST subtree is dispatched only in that mode. The new mount
          takes the same runtime object as the threads mount, so the only
          variable between them is the transport.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Tell me a one-line joke."]}
            expect="The reply streams normally. Every request in the network tab is a POST to /api/copilotkit-single carrying a { method, params, body } envelope — no /info, /agent/myAgent/run, or /threads paths at all."
            fail="The chat never connects, or requests fall back to REST paths under /api/copilotkit-single, which would mean the provider negotiated its way off the single-route transport."
          />
        </div>
      </Panel>

      <Panel title="The route">
        <SourceCode file="frontend/src/app/api/copilotkit-single/route.ts" />
      </Panel>

      <Panel title="The provider">
        <SourceCode file="frontend/src/components/single-endpoint-provider.tsx" />
      </Panel>

      <Callout
        tone="warn"
        title="Single-route does not carry thread, memory, or annotation requests"
      >
        The step is introduced with &quot;It carries chat, thread, memory, and
        annotation requests through one <code>POST</code> endpoint.&quot; Only
        the first of those four is true at <code>@copilotkit/runtime</code>{" "}
        1.69.2. <code>validateMethod</code> in{" "}
        <code>v2/runtime/endpoints/single-route-helpers</code> accepts exactly
        seven envelope methods — <code>agent/run</code>,{" "}
        <code>agent/suggest</code>, <code>agent/connect</code>,{" "}
        <code>agent/stop</code>, <code>info</code>,{" "}
        <code>inspector/metadata</code>, <code>transcribe</code> — and answers{" "}
        <code>400 Unsupported method</code> for anything else. The multi-route
        router matches twenty, including all eight <code>threads/*</code>, all
        four <code>memories/*</code>, and <code>annotate</code>. None of those
        thirteen is reachable through the single endpoint. Use the probe button
        on the demo to see it per request class.
      </Callout>

      <Callout
        tone="warn"
        title="Single-route mode also switches thread endpoints off in /info"
      >
        Separately from the method allowlist,{" "}
        <code>createCopilotRuntimeHandler</code> dispatches single-route
        requests with <code>threadEndpointsEnabled: false</code>, where
        multi-route passes <code>true</code>. That flag feeds{" "}
        <code>resolveThreadEndpointInfo</code>, so a single-route{" "}
        <code>/info</code> reports no REST thread endpoints and no managed
        thread metadata even when the runtime is a full Intelligence runtime.
        The client believes it, and stops asking. So the doc&apos;s closing step
        — open Inspector, find your thread under <strong>Threads</strong> —
        cannot pass on the transport the same page just told you to adopt.
      </Callout>

      <Callout tone="warn" title="The page contradicts itself">
        The coding-agent prompt at the top of the page is unchanged, and still
        instructs the agent to &quot;enable the multi-route Runtime, align the
        frontend transport, and expose the full Runtime subtree for GET, POST,
        PATCH, and DELETE.&quot; The manual steps immediately below now say
        single-route, one verb. Whichever half a reader follows, the other half
        of the same page describes a different app.
      </Callout>

      <Callout tone="premium" title="Steps 1, 2 and 5 stay out of reach">
        <code>npx copilotkit@latest login</code> and{" "}
        <code>project select</code> mint a{" "}
        <code>CPK_INTELLIGENCE_API_KEY</code> against a hosted Intelligence
        project tied to an account. Without one the runtime behind this route
        falls back to <code>InMemoryAgentRunner</code>, and the confirmation
        step — Inspector showing <strong>Intelligence connected</strong> and a
        saved thread — has nothing to assert against. Set{" "}
        <code>CPK_INTELLIGENCE_API_KEY</code> and{" "}
        <code>COPILOTKIT_LICENSE_TOKEN</code> in{" "}
        <code>frontend/.env.local</code> and the mount picks them up with no
        code change.
      </Callout>

      <Callout
        tone="info"
        title="Suggestions quietly change shape on this transport"
      >
        Not a defect, but worth knowing before comparing this route against the
        others: the client only uses the stateless{" "}
        <code>/agent/:id/suggest</code> endpoint on non-<code>single</code>{" "}
        transports, because that URL is multi-route. Under{" "}
        <code>useSingleEndpoint</code> it falls back to cloning the provider
        agent and running it client-side instead.
      </Callout>
    </>
  );
}
