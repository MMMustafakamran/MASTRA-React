"use client";

import {
  CopilotChat,
  useDefaultRenderTool,
  useRenderTool,
} from "@copilotkit/react-core/v2";
import { z } from "zod";

import { DemoFrame } from "@/components/demo-frame";

/**
 * Two renderers in one chat: a named one for `weatherInfo`, and a generic
 * fallback for every other tool.
 *
 * `weatherInfo` is a Mastra tool on `weatherAgent`, defined in
 * `src/mastra/tools.ts` exactly as the doc defines it. The renderer name has to
 * match that tool's `id` character for character.
 */
export default function Page() {
  useRenderTool(
    {
      name: "weatherInfo",
      // The doc omits `parameters`; the shipped named overload requires a
      // schema and names the render prop `parameters` rather than `args`.
      parameters: z.object({ location: z.string() }),
      render: (props) => {
        if (props.status !== "complete") {
          return <p className="mt-2 text-gray-500">Calling weather API...</p>;
        }
        return (
          <p className="mt-2 text-gray-500">
            Called the weather API for {props.parameters?.location}.
          </p>
        );
      },
    },
    [],
  );

  useDefaultRenderTool({
    render: ({ name, status, result }) => (
      <div className="my-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
        <p className="font-mono text-xs text-slate-600 dark:text-slate-300">
          {status === "complete" ? "✓" : "⏳"} {name}
        </p>
        {status === "complete" && result && (
          <pre className="mt-1 overflow-x-auto text-xs text-slate-500">
            {result}
          </pre>
        )}
      </div>
    ),
  });

  return (
    <DemoFrame
      parentPath="/generative-ui/tool-rendering"
      subtitle="named renderer + wildcard fallback · weatherAgent"
    >
      <CopilotChat
        agentId="weatherAgent"
        labels={{
          welcomeMessageText:
            "Ask for the weather in a city to see the named renderer.",
        }}
      />
    </DemoFrame>
  );
}
