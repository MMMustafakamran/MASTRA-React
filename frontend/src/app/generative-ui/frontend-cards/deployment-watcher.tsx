// Frontend-Driven Cards, step 3 — "Add the card from frontend code". Verbatim,
// file name included (`app/deployment-watcher.tsx` on the page).
//
// Two things the page leaves to the reader, both kept as published:
//   - `wss://example.com/deployments` is a placeholder. Nothing answers there,
//     so mounted as written this component never adds a card.
//   - The page never mounts it. Step 2's `Page` renders `<CopilotChat />` and
//     nothing else, and step 3 does not say where `<DeploymentWatcher />` goes.
//     The demo mounts it inside the step-2 provider, because `useAgent()` only
//     works under one — that placement is this harness's inference.

// [3] frontend cards: add the card from frontend code
import { useEffect } from "react";
import { useAgent } from "@copilotkit/react-core/v2";

export function DeploymentWatcher() {
  const { agent } = useAgent();

  useEffect(() => {
    const socket = new WebSocket("wss://example.com/deployments");
    socket.onmessage = (event) => {
      const deployment = JSON.parse(event.data);
      agent.addMessage({
        id: crypto.randomUUID(),
        role: "activity", // [!code highlight]
        activityType: "app-event-card",
        content: { title: "Deployment finished", detail: deployment.sha },
      });
    };
    return () => socket.close();
  }, [agent]);

  return null;
}
