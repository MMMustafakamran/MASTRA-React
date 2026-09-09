# Agent App Context

> Share app specific context with your agent.


## What is this?

One of the most common use cases for CopilotKit is to register app state and context using `useAgentContext`.
This way, you can notify your agent of what is going on in your app in real time.

## When should I use this?

You can use this when you want to provide the user with feedback about what is in your working memory. As your agent's
state updates, you can reflect these updates natively in your application.

Some examples might be: the current user, the current page, etc. This can be shared with your agent in real time.

## Implementation

<Callout type="warn" title="Context values arrive as JSON strings">
  The AG-UI protocol defines a context value as a string. Therefore
  `useAgentContext` calls `JSON.stringify` on any `value` that is not already a
  string, and your agent receives the JSON text instead of the object or the
  array.

  Parse the value before you read a field from it. Use `json.loads(item["value"])`
  in Python, or `JSON.parse(item.value)` in TypeScript. If you skip the parse
  step, an index such as `colleagues[0]` returns a single character, and a shape
  check such as `isinstance(value, list)` can never pass.

  Do not stringify the value again, because that produces double encoding. A
  `value` that is already a string is sent unchanged, so no parse step is needed
  for it.
</Callout>

<Steps>
    <Step>
        ### Share data with your agent

        The [`useAgentContext` hook](/reference/v2/hooks/useAgentContext) is used to add data as context to the Copilot.

        ```tsx title="YourComponent.tsx" showLineNumbers
        "use client" // only necessary if you are using Next.js with the App Router. // [!code highlight]
        import { useAgentContext } from "@copilotkit/react-core/v2"; // [!code highlight]
        import { useState } from 'react';

        export function YourComponent() {
            // Create colleagues state with some sample data
            const [colleagues, setColleagues] = useState([
                { id: 1, name: "John Doe", role: "Developer" },
                { id: 2, name: "Jane Smith", role: "Designer" },
                { id: 3, name: "Bob Wilson", role: "Product Manager" }
            ]);

            // Define agent context
            // [!code highlight:4]
            useAgentContext({
                description: "The current user's colleagues",
                value: colleagues,
            });
            return (
                // Your custom UI component
                <>...</>
            );
        }
        ```
    </Step>

    <Step>
        ### Consume the data in your Mastra agent

        Mastra has `RuntimeContext` class that can be used to set and access the extra context at run time.
        The context from CopilotKit is automatically injected there, and can be used immediately.
        You can read more about it [here](https://mastra.ai/en/docs/agents/runtime-context)

        ```tsx title="agent.ts"
        import { openai } from "@ai-sdk/openai";
        import { Agent } from "@mastra/core/agent";

        export const colleaguesContactAgent = new Agent({
            id: "colleague-agent",
            name: "Colleagues contact Agent",
            model: openai("gpt-4o"),
            // Use the injected runtime context
            // [!code highlight:13]
            instructions: ({ requestContext }) => {
                const aguiContext = requestContext.get('ag-ui')?.context;
                const colleaguesContextItem = aguiContext?.find(contextItem => contextItem.description === "The current user's colleagues")

                // The value is already a JSON string, so parse it instead of stringifying it
                const colleagues = colleaguesContextItem ? JSON.parse(colleaguesContextItem.value) : [];
                const colleagueList = colleagues.map((c) => `${c.name} (${c.role})`).join(", ");

                return `
                    You are a helpful assistant that can help emailing colleagues.
                    The user's colleagues are: ${colleagueList}
                `
            },
            // ... Everything else used to configure your agent
        });
        ```
    </Step>
    <Step>
        ### Give it a try!
        Ask your agent a question about the context. It should be able to answer!
    </Step>
</Steps>
