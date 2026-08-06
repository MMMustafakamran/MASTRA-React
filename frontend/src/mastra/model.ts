import { openai } from "@ai-sdk/openai";

/**
 * One model for every agent in this harness.
 *
 * The docs are not consistent here — across the pages this repo implements they
 * specify `gpt-5.4`, `gpt-5.4-mini`, `gpt-4o`, and `gpt-4.1`, and the Quickstart
 * callout says GPT-4o while its own code says something else. Rather than
 * hard-code four ids and have several agents fail on accounts that lack them,
 * every agent reads this. Override with OPENAI_MODEL.
 */
export const model = () => openai(process.env.OPENAI_MODEL ?? "gpt-4o");
