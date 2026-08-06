import { Mastra } from "@mastra/core";
import { LibSQLStore } from "@mastra/libsql";

import {
  backgroundAgentsAgent,
  colleaguesContactAgent,
  languageAgent,
  myAgent,
  searchAgent,
  streamingAgent,
  weatherAgent,
} from "./agents";

/**
 * The Mastra instance the Copilot Runtime binds with `getLocalAgents`.
 *
 * Note there is no separate agent server in this repo. Mastra is a TypeScript
 * framework and the Quickstart's bring-your-own path imports the instance
 * directly into the Next.js route, so agents run in the same process as the app.
 *
 * `storage` and `backgroundTasks` come from the Background Tasks page — the
 * background worker needs somewhere to persist queued work, so both are
 * required for that route and harmless for every other one.
 */
export const mastra = new Mastra({
  agents: {
    myAgent,
    weatherAgent,
    languageAgent,
    streamingAgent,
    searchAgent,
    colleaguesContactAgent,
    backgroundAgentsAgent,
  },
  storage: new LibSQLStore({ id: "mastra-storage", url: ":memory:" }),
  backgroundTasks: { enabled: true },
});
