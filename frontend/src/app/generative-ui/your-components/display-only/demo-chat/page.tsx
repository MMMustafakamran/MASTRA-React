"use client";

import { CopilotChat, useComponent } from "@copilotkit/react-core/v2";
import { z } from "zod";

import { DemoFrame } from "@/components/demo-frame";

/**
 * Registering a React component as a tool the agent can render.
 *
 * `useComponent` is a thin wrapper over `useFrontendTool`: it registers a tool
 * with a `render` and deliberately no `handler`, then renders your component
 * with the tool arguments spread in as props. Nothing executes — the agent
 * decides when to show it, and CopilotKit draws it.
 *
 * No backend change is needed. CopilotKit forwards frontend tools to the agent
 * in the AG-UI run input, so the model can call `showWeather` even though the
 * agent never declares it.
 */

const weatherSchema = z.object({
  city: z.string().describe("City name"),
  temperature: z.number().describe("Temperature in Fahrenheit"),
  condition: z.string().describe("Weather condition"),
});

function WeatherCard({
  city,
  temperature,
  condition,
}: z.infer<typeof weatherSchema>) {
  return (
    <div className="my-2 max-w-xs rounded-lg border border-[var(--accent)] bg-white p-4 dark:bg-slate-900">
      <h3 className="font-semibold text-slate-900 dark:text-slate-50">{city}</h3>
      <p className="mt-1 text-2xl text-slate-900 dark:text-slate-50">
        {temperature}°F
      </p>
      <p className="mt-1 text-sm text-gray-500">{condition}</p>
    </div>
  );
}

export default function Page() {
  useComponent(
    {
      name: "showWeather",
      description: "Display a weather card for a city.",
      parameters: weatherSchema,
      render: WeatherCard,
    },
    [],
  );

  return (
    <DemoFrame
      parentPath="/generative-ui/your-components/display-only"
      subtitle="useComponent — agent-rendered React components"
    >
      <CopilotChat
        agentId="myAgent"
        labels={{
          welcomeMessageText:
            'Try "Show the weather card for Tokyo: 77 degrees, clear".',
        }}
      />
    </DemoFrame>
  );
}
