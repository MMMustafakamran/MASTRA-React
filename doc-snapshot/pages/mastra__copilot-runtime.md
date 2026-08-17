# Copilot Runtime

> The Copilot Runtime is the backend that connects your frontend to your AI agents, providing authentication, middleware, routing, and more.


The Copilot Runtime is the backend layer that connects your frontend application to your AI agents. It's set up during the [quickstart](/mastra/quickstart) and is the recommended way to use CopilotKit.

## Setting Up the Runtime

The runtime is a lightweight server endpoint that you add to your backend. Here's a minimal example using Next.js:

```ts title="app/api/copilotkit/route.ts"
import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";

const serviceAdapter = new ExperimentalEmptyAdapter();

const runtime = new CopilotRuntime({
  agents: {
    // your agents go here
  },
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
```

Then point your frontend at the endpoint:


```tsx
<CopilotKit runtimeUrl="/api/copilotkit">
  <YourApp />
</CopilotKit>
```




For setup with other backend frameworks (Express, NestJS, Node.js HTTP), see the [quickstart](/mastra/quickstart).

## The Default Agent

If you register an agent with the name `"default"`, CopilotKit's prebuilt UI components will use it automatically without any additional configuration on the frontend. This is useful when you have one primary agent and don't want to specify an `agentId` everywhere.

```ts title="app/api/copilotkit/route.ts"
const runtime = new CopilotRuntime({
  agents: {
    // Frontend APIs use this agent when no other agent id is selected.
    default: new HttpAgent({ url: "https://my-agent.example.com" }),
  },
});
```

When you register multiple agents, the `"default"` agent powers the chat unless a specific agent is selected. Other agents remain addressable through the frontend agent API.

## What the Runtime Provides

### Authentication and Security

The runtime runs on your server, which means agent communication stays server-side. This gives you a trusted environment to enforce authentication, validate requests, and keep API keys secure. When you use the runtime, safe defaults are put in place so your agent endpoints are not exposed to unauthenticated access.

### AG-UI Middleware

The [AG-UI protocol](/ag-ui-protocol) supports a middleware layer (`agent.use`) for logging, guardrails, request transformation, and more. Because the runtime runs server-side, this middleware executes in a trusted environment where it cannot be tampered with by the client.

### Agent Routing

When you register multiple agents with the runtime, it handles discovery and routing automatically. Your frontend doesn't need to know the details of where each agent lives or how to reach it.

### Enterprise Intelligence Platform

Features like [threads](/mastra/threads) and the [inspector](/mastra/inspector) are provided through the runtime and the Enterprise Intelligence Platform. These give you conversation persistence and debugging capabilities out of the box.

## Built-in Middleware

The runtime supports two first-class middleware options you can enable directly on `CopilotRuntime` without calling `.use()` on each agent manually.

### A2UI

Pass `a2ui: {}` to automatically apply `A2UIMiddleware` to all registered agents:

```ts title="app/api/copilotkit/route.ts"
const runtime = new CopilotRuntime({
  agents: { default: myAgent },
  a2ui: {}, // enables A2UI rendering for all agents
});
```

To scope it to specific agents only, pass an `agents` list:

```ts
a2ui: {
  agents: ["my-agent"];
}
```

On the frontend, the A2UI renderer activates automatically. Configure `a2ui`
only when you want to override its defaults:


```tsx
<CopilotKit runtimeUrl="/api/copilotkit" a2ui={{ theme: myCustomTheme }}>
  {children}
</CopilotKit>
```




### mcpApps

Pass `mcpApps` to configure MCP servers for all agents from a single place:

```ts title="app/api/copilotkit/route.ts"
const runtime = new CopilotRuntime({
  agents: { default: myAgent },
  mcpApps: {
    servers: [
      { type: "http", url: "http://localhost:3108/mcp", serverId: "my-server" },
    ],
  },
});
```

Each server entry optionally accepts an `agentId` field to scope that server to a single agent. Without it, the server is available to all agents.

## What If I Want to Connect to My AG-UI Agent Directly?

CopilotKit is built on the [AG-UI protocol](/ag-ui-protocol), which is an open standard. If you want to connect your frontend directly to an AG-UI-compatible agent without the runtime, pass the agent instance in your frontend configuration:


```tsx
import { HttpAgent } from "@ag-ui/client";

const myAgent = new HttpAgent({
  url: "https://my-agent.example.com",
});

<CopilotKit agents__unsafe_dev_only={{ "my-agent": myAgent }}>
  <YourApp />
</CopilotKit>;
```




<Callout type="warn">
  Direct agent connections are intended for development and prototyping. This
  approach is not recommended for production unless you are confident in your
  setup, and is not officially supported by CopilotKit. If you run into issues
  with a direct connection, you will need to troubleshoot on your own.
</Callout>

There are important things to understand before going this route:

1. **Authentication is your responsibility.** When you use the Copilot Runtime, safe defaults are put in place so that your agent endpoints are not exposed to unauthenticated access. When you connect directly, it is entirely up to you to secure your agent endpoint and manage authentication.

2. **Many ecosystem features won't work.** The AG-UI protocol supports a middleware layer designed to run on the backend. Many features in the CopilotKit ecosystem depend on this server-side middleware. Without the runtime, these features — including [threads](/mastra/threads) and other capabilities — will not be available.

### Comparison

|                        | With Runtime                | Direct Connection |
| ---------------------- | --------------------------- | ----------------- |
| **Authentication**     | Safe defaults provided      | You manage it     |
| **AG-UI Middleware**   | Runs server-side            | Not available     |
| **Agent Routing**      | Automatic                   | Manual            |
| **Ecosystem Features** | Full support                | Limited           |
| **CopilotKit Support** | Supported                   | Not supported     |
| **Setup**              | Requires a backend endpoint | Frontend-only     |


## Execution tracing

When you embed a Mastra agent in Copilot Runtime, its tracing is carried through
AG-UI end to end, so runs show up in your Mastra observability backend with no
extra wiring.

- **Inbound** — pass `tracingOptions` alongside `mastra` in
  `MastraAgent.getLocalAgents` to anchor each run under a caller-chosen trace.
  The shape is `{ traceId?: string; metadata?: Record<string, unknown> }`:

  ```ts
  const runtime = new CopilotRuntime({
    agents: MastraAgent.getLocalAgents({
      mastra,
      tracingOptions: {
        traceId: myTraceId,
        metadata: { feature: "support-chat", tenant: tenantId },
      },
    }),
  });
  ```

- **Outbound** — the execution `traceId` Mastra assigns to a run is surfaced on
  the `RUN_FINISHED` event's `result` field as `{ traceId }`, so you can anchor
  feedback or scores back to the exact run (e.g. `createFeedback({ traceId })`).
