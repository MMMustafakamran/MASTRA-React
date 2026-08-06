import { Agent } from "@mastra/core/agent";
import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { z } from "zod";

import { model } from "./model";
import { addSearch, runDeepResearchTool, weatherInfo } from "./tools";

/**
 * The agents this harness serves — one per documentation page that defines one.
 *
 * Nothing here was designed for this repo. Each agent's name, instructions,
 * tools, and working-memory schema are the doc's.
 *
 * Why several agents rather than one: in Mastra, shared state *is* working
 * memory, and working memory carries a single Zod schema per agent. The docs
 * define three different schemas — `language`, `document`, and `searches` — so
 * they cannot be merged without inventing a schema no page shows.
 *
 * Each agent gets its own in-memory LibSQL store, exactly as the docs do. That
 * means state is per-process and resets on restart, which is fine for a harness.
 */

const store = () => new LibSQLStore({ id: "mastra-storage", url: ":memory:" });

// #region my-agent
// Quickstart — docs.copilotkit.ai/mastra/quickstart?agent=bring-your-own
export const myAgent = new Agent({
  id: "myAgent",
  name: "My Agent",
  instructions: "You are a helpful assistant!",
  model: model(),
});
// #endregion

// #region weather-agent
// Tool Rendering
export const weatherAgent = new Agent({
  id: "weatherAgent",
  name: "Weather Agent",
  instructions:
    "You are a helpful assistant that provides current weather information. When asked about the weather, use the weather information tool to fetch the data.",
  model: model(),
  tools: {
    weatherInfo,
  },
});
// #endregion

// #region language-agent
// Shared State read + write — .../shared-state/in-app-agent-read and -write
export const AgentStateSchema = z.object({
  language: z.enum(["english", "spanish"]),
});

export type AgentState = z.infer<typeof AgentStateSchema>;

export const languageAgent = new Agent({
  id: "languageAgent",
  name: "Language Agent",
  model: model(),
  instructions:
    "Always communicate in the preferred language of the user as defined in your working memory. Do not communicate in any other language.",
  memory: new Memory({
    storage: store(),
    options: {
      workingMemory: {
        enabled: true,
        schema: AgentStateSchema,
      },
    },
  }),
});
// #endregion

// #region streaming-agent
// Predictive State Updates — .../shared-state/predictive-state-updates
export const StreamingAgentState = z.object({
  document: z.string().default(""),
});

export const streamingAgent = new Agent({
  id: "streamingAgent",
  name: "Streaming Agent",
  model: model(),
  // The prompt drives the model to write the full document straight into
  // working memory via the built-in updateWorkingMemory tool, rather than
  // pasting it into a chat message.
  instructions: `You are a collaborative writing assistant. Whenever the user asks you to write, draft, or revise anything, call the \`updateWorkingMemory\` tool with the FULL content under the \`document\` field. Never paste the document into a chat message — it belongs in shared state, and the UI renders it live as you stream it.`,
  memory: new Memory({
    storage: store(),
    options: {
      workingMemory: {
        enabled: true,
        schema: StreamingAgentState,
      },
    },
  }),
});
// #endregion

// #region search-agent
// State Rendering — .../generative-ui/state-rendering
const SearchAgentStateSchema = z.object({
  searches: z
    .array(
      z.object({
        query: z.string(),
        done: z.boolean(),
      }),
    )
    .default([]),
});

export type SearchAgentState = z.infer<typeof SearchAgentStateSchema>;

export const searchAgent = new Agent({
  id: "searchAgent",
  name: "Search Agent",
  model: model(),
  instructions: `
    You are a helpful assistant for storing searches.

    IMPORTANT:
    - Use the addSearch tool to add a search to the agent's state
    - ONLY USE THE addSearch TOOL ONCE FOR A GIVEN QUERY
  `,
  tools: {
    addSearch,
  },
  memory: new Memory({
    storage: store(),
    options: {
      workingMemory: {
        enabled: true,
        schema: SearchAgentStateSchema,
      },
    },
  }),
});
// #endregion

// #region colleagues-agent
// Readables — docs.copilotkit.ai/mastra/agent-app-context
//
// Note how context arrives: `instructions` is a function reading
// `requestContext.get('ag-ui')?.context`. Mastra injects what the frontend
// registered with `useAgentContext` there, so no tool is involved.
export const colleaguesContactAgent = new Agent({
  id: "colleague-agent",
  name: "Colleagues contact Agent",
  model: model(),
  instructions: ({ requestContext }) => {
    // `requestContext.get()` is typed as `{}` in @mastra/core 1.56, so the
    // doc's `?.context` access does not compile without this shape.
    const aguiContext = (
      requestContext.get("ag-ui") as
        | { context?: { description: string; value: unknown }[] }
        | undefined
    )?.context;
    const colleaguesContextItem = aguiContext?.find(
      (contextItem) =>
        contextItem.description === "The current user's colleagues",
    );
    return `
        You are a helpful assistant that can help emailing colleagues.
        The user's colleagues are: ${JSON.stringify(colleaguesContextItem?.value, null, 2)}
    `;
  },
});
// #endregion

// #region background-agent
// Background Tasks — docs.copilotkit.ai/mastra/background-tasks
export const backgroundAgentsAgent = new Agent({
  id: "background-agents",
  name: "Background Agents Agent",
  tools: { runDeepResearchTool },
  model: model(),
  instructions:
    "You are a research assistant that dispatches long-running work to the " +
    "background. When the user asks you to research a topic, call the " +
    "run_deep_research tool ONCE, then send a short message saying the work " +
    "is running in the background.",
});
// #endregion
