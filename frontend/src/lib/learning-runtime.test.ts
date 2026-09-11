import assert from "node:assert/strict";
import { test } from "node:test";

// The runtime is built at import and its constructor throws on a blank key.
process.env.CPK_INTELLIGENCE_API_KEY ||= "test-key";

const AGENT_IDS = ["expense-agent", "default"];

test("Learning runtime routes every Thread to firstlearningtest", async () => {
  const { learningRuntime } = await import("./learning-runtime");
  const intelligence = learningRuntime.intelligence;
  assert.ok(intelligence, "the Learning runtime has no CopilotKitIntelligence");

  assert.equal(intelligence.ɵgetApiKey(), process.env.CPK_INTELLIGENCE_API_KEY);

  const select = intelligence.ɵgetLearningContainerId();
  assert.ok(select, "getLearningContainerId is not configured");
  for (const agentId of AGENT_IDS) {
    const containerId = await select({
      surface: "web",
      user: { id: "demo-user", name: "Demo User" },
      agentId,
      input: { threadId: "t", runId: "r", messages: [], tools: [], context: [], state: {}, forwardedProps: {} },
    });
    assert.equal(containerId, "firstlearningtest", `agent ${agentId}`);
  }
});
