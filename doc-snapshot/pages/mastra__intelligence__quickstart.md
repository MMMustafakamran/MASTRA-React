# Connect Intelligence in 5 minutes

> Connect an existing CopilotKit app to Intelligence and store persistent threads in a cloud-hosted project.

You want to persist conversations reliably in production, improve your agents over time, understand their performance with AI analytics, and inspect every thread, event, and state change.
CopilotKit Intelligence adds these capabilities to your existing app without changing your frontend or agent framework.

You are done when Inspector shows that Intelligence is connected and displays your first saved thread. React Native apps confirm the thread in the hosted Intelligence project because React Native does not include Inspector.

## Start with your coding agent

If your app already has a working CopilotKit agent and frontend, use this prompt to configure the remaining Intelligence pieces.

### Copy this prompt into your coding agent

```text
Read https://docs.copilotkit.ai/backend/runtime-endpoints#enable-rich-threads-routes and finish setting up Rich Threads in this repository.

First inspect the repository's agent instructions, installed CopilotKit versions, Runtime adapter, frontend provider, route or proxy setup, and existing authentication. Preserve the current framework and deployment model. Preserve existing authentication middleware and access checks on every Runtime route.

Follow the guide to enable the multi-route Runtime, align the frontend transport, and expose the full Runtime subtree for GET, POST, PATCH, and DELETE. Authenticate every Runtime route with onRequest. Set identifyUser from the existing server-verified signed-in application user. Enforce thread ownership for threads/events, threads/state, and agent/stop as described in https://docs.copilotkit.ai/auth#thread-authorization. Never use a fixed demo identity in production. If no trusted user identity or ownership source exists, stop and ask me which source to use.

Start the app. For a browser frontend, open Inspector and verify that Home shows Intelligence connected. Send one message, open Threads in Inspector, and confirm that the new thread contains the message. React Native does not include Inspector, so verify its new thread in the selected hosted Intelligence project instead. Run focused tests, lint, and typecheck. Report the files changed, commands run, and verification result. If blocked, explain the missing input; do not invent setup.
```

## Set it up manually

Before you start, make sure that you have a CopilotKit app with a working agent, runtime, and frontend.

<Steps>
  <Step>
    ### Select an Intelligence project

    Sign in from your project root. Then select the project that will store your threads.

    ```bash title="Terminal"
    npx copilotkit@latest login
    npx copilotkit@latest project select
    ```

    `project select` writes a project API key to `.env` as `CPK_INTELLIGENCE_API_KEY`. Keep this key on the server.
  </Step>

  <Step>
    ### Connect your runtime

    Construct the Intelligence client. Then pass it and your existing user lookup to `CopilotRuntime`.

    ```ts title="Your CopilotKit runtime"
    import {
      CopilotKitIntelligence,
      CopilotRuntime,
    } from "@copilotkit/runtime/v2";

    // Create the Intelligence client with your project API key. Keep this key on the server.
    const intelligence = new CopilotKitIntelligence({
      apiKey: process.env.CPK_INTELLIGENCE_API_KEY!,
    });

    const runtime = new CopilotRuntime({
      agents,
      // Pass the Intelligence client to the runtime
      intelligence,
      // Identify the user from a verified session or token
      identifyUser: async (request) => {
        const user = await authenticateApplicationUser(request);
        if (!user) throw new Error("Unauthorized");
        return { id: user.id, name: user.name };
      },
    });
    ```

    <Callout type="info" title="Use your existing authentication">
      `authenticateApplicationUser` represents your server-side authentication function. It must return the user from a verified session or token. The Runtime requires `identifyUser` to associate web threads with that user.
    </Callout>

    If no trusted user identity exists, add authentication before you continue. A fixed identity is suitable only for a local, single-user demo.

    <Callout type="warn" title="Protect every Runtime route before production">
      `identifyUser` names the caller, but it is not an authentication gate. Use the handler's `onRequest` hook to reject unauthenticated requests. You must also enforce thread ownership for `threads/events`, `threads/state`, and `agent/stop`. Follow the [thread authorization guide](/mastra/auth#thread-authorization) for the complete pattern.
    </Callout>
  </Step>

  <Step>
    ### Expose the thread routes

    Use the multi-route handler. Mount the complete runtime subtree. Export `GET`, `POST`, `PATCH`, and `DELETE`.

    ```ts title="app/api/copilotkit/[[...slug]]/route.ts"
    import { createCopilotRuntimeHandler } from "@copilotkit/runtime/v2";

    const handler = createCopilotRuntimeHandler({
      runtime,
      basePath: "/api/copilotkit",
    });

    export const GET = handler;
    export const POST = handler;
    export const PATCH = handler;
    export const DELETE = handler;
    ```

    This example uses a Next.js catch-all route, but the fetch-based handler works with any server that uses standard Web `Request` and `Response` objects.
    For another server, use the [runtime adapter guide](/mastra/runtime-server-adapter#multi-route-vs-single-route).
  </Step>

  <Step>
    ### Use the multi-route frontend transport

    Point your frontend provider at the runtime base path.

    
      Add the runtimeUrl prop to your `CopilotKitProvider`. The provider uses the multi-route transport to send messages, events, and state to the runtime.

      ```tsx title="Your CopilotKit provider"
      import { CopilotKitProvider } from "@copilotkit/react-core/v2";

      export function App() {
        return (
          <CopilotKitProvider runtimeUrl="/api/copilotkit">
            <YourApp />
          </CopilotKitProvider>
        );
      }
      ```
    

    

    

    
  </Step>

  <Step>
    ### Confirm the connection

    
      Start your app and open it on localhost. Click the Inspector button (Kite icon) in the corner of the app.

      1. Open **Home**. Make sure that **Intelligence connected** appears beside **What's going on**.
      2. Return to your app and send one message to create a thread.
      3. Open **Threads** in Inspector. Your new thread must appear in the list.
      4. Open the thread. Make sure that **Messages** contains the message that you sent.

      If Home does not show **Intelligence connected**, or Threads is locked, the setup is incomplete. Follow the action shown in Inspector or review the [Inspector setup states](/mastra/inspector#project-context-and-usage).
    

    

    

    
  </Step>
</Steps>

<Callout type="success" title="Intelligence is connected">
  Your runtime stores new conversations in Intelligence. Browser apps can inspect their messages, events, and state in Inspector. React Native apps can inspect them in the hosted Intelligence project.
</Callout>
