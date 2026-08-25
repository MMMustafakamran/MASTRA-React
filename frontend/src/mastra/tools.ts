import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * Every tool the agents in this harness expose.
 *
 * All three come from documentation pages — nothing here was invented for this
 * repo. Each is marked with the page it belongs to.
 */

// #region weather-info
// Tool Rendering — docs.copilotkit.ai/mastra/generative-ui/tool-rendering
export const weatherInfo = createTool({
  id: "weatherInfo",
  inputSchema: z.object({
    location: z.string(),
  }),
  description: `Fetches the current weather information for a given location`,
  execute: async ({ location }) => {
    // Tool logic here (e.g., API call)
    console.log("Using tool to fetch weather information for", location);
    return { temperature: 20, conditions: "Sunny" };
  },
});
// #endregion

// #region add-search
// State Rendering — docs.copilotkit.ai/mastra/generative-ui/state-rendering
export const addSearch = createTool({
  id: "addSearch",
  inputSchema: z.object({
    query: z.string(),
  }),
  description: "Add a search to the agent's list of searches",
  execute: async ({ query }) => {
    // Tool implementation - working memory is automatically updated
    return { success: true, query };
  },
});
// #endregion

// #region deep-research
// Background Tasks — docs.copilotkit.ai/mastra/background-tasks
// Doc step "Define a backgroundable tool" (src/mastra/tools/background-research.ts)
export const runDeepResearchTool = createTool({
  id: "run_deep_research",
  description:
    "Kick off a long-running deep-research task on a topic. This runs in " +
    "the background while the conversation continues.",
  inputSchema: z.object({
    topic: z.string().describe("The topic to research in depth."),
  }),
  background: { enabled: true },
  execute: async ({ topic }) => {
    // Runs when the background worker executes the task.
    return JSON.stringify({
      topic,
      summary: `Deep research on "${topic}" completed.`,
    });
  },
});
// #endregion
