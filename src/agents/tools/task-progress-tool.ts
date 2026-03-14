import { Type } from "@sinclair/typebox";
import type { AnyAgentTool } from "./common.js";
import { readStringParam } from "./common.js";

/**
 * Lightweight tool the agent calls to signal task progress to the UI.
 *
 * Emite un tool_use que el frontend detecta y renderiza como un
 * paso de tarea colapsable (nombre + estado + herramientas hijas).
 *
 * El agente llama esto antes de empezar cada paso lógico de una tarea.
 * El frontend lee los args (step, status) para renderizar el step UI.
 */

const TaskProgressSchema = Type.Object({
  step: Type.String({
    description: "Short label describing the current task step, e.g. 'Initialize project scaffold'",
  }),
  status: Type.Optional(
    Type.String({
      description:
        "Step status: 'in_progress' (starting/working), 'done' (completed), 'error' (failed). Default: 'in_progress'",
    }),
  ),
});

export function createTaskProgressTool(): AnyAgentTool {
  return {
    label: "Task Progress",
    name: "task_progress",
    description:
      "Signal task progress to the user interface. Call this before starting each logical step of a multi-step task. " +
      'The step label should be a short, descriptive name (e.g. "Initialize project", "Configure routing"). ' +
      "This helps the user track your progress through complex tasks. " +
      "Use status='in_progress' when starting a step, 'done' when a step is complete, and 'error' if a step fails.",
    parameters: TaskProgressSchema,
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const step = readStringParam(params, "step", { required: true, label: "step" });
      const status = readStringParam(params, "status") ?? "in_progress";

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ step, status, acknowledged: true }),
          },
        ],
        details: { step, status },
      };
    },
  };
}
