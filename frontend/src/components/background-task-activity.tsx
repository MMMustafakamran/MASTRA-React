"use client";

import type { ReactActivityMessageRenderer } from "@copilotkit/react-core/v2";
import { z } from "zod";

/**
 * Renders Mastra's background-task activity events.
 *
 * Activity messages are a separate AG-UI channel from tool calls, so this is
 * not a `useRenderTool` renderer. A renderer declares the `activityType` it
 * handles plus a Zod schema for the payload, and CopilotKit routes matching
 * events to it.
 *
 * It lives here rather than on the Background Tasks page because activity
 * renderers register on the provider — `renderActivityMessages` is a
 * provider-level array, and `useRenderActivityMessage()` is a *consumer* hook
 * that takes no arguments.
 *
 * `activityType` must match what Mastra emits. `@ag-ui/mastra` exports the same
 * string as `MASTRA_BACKGROUND_TASK_ACTIVITY_TYPE`; the doc writes the literal,
 * which is kept here.
 */

const contentSchema = z
  .object({
    status: z.string().optional(),
    args: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

// Doc step "Render the activity card in your frontend" (ui/app/activity-card.tsx)
export const backgroundTaskActivityRenderer: ReactActivityMessageRenderer<
  z.infer<typeof contentSchema>
> = {
  activityType: "mastra-background-task",
  content: contentSchema,
  render: ({ content }) => {
    const working =
      content.status !== "completed" && content.status !== "failed";
    const topic = (content.args?.topic as string | undefined) ?? "task";
    return (
      <div
        data-status={content.status ?? "running"}
        className="my-2 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <strong className="text-slate-800 dark:text-slate-100">
          Deep research
        </strong>
        <span className="text-slate-500">— {topic}</span>
        <span
          className={`ml-auto rounded px-2 py-0.5 text-xs font-medium ${
            working
              ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
              : "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
          }`}
        >
          {working ? "Working…" : content.status}
        </span>
      </div>
    );
  },
};
