import { Type } from "@google/genai";
import type { PlateEditor } from "@udecode/plate/react";
import { z } from "zod";
import { defineAiFunction } from "./helpers";

export const endTaskOperation = defineAiFunction({
  declaration: {
    name: "end_task",
    description:
      "Signals the definitive conclusion of the current request or assigned task. This function marks the final step in the workflow and MUST be called exactly once to finalize a task.\n\n**When to Call:**\n* **Single-Turn Completion:** If the task can be fully addressed by initiating one or more function calls within the current turn, and no subsequent steps *depend* on the results of these calls to continue the *same* task, you SHOULD include `end_task` alongside the other function call(s) in this turn.\n* **Assumption of Success:** When calling `end_task` concurrently with other function calls, assume those other calls will succeed. If any of them fail, the system will prevent the task from being marked as complete and will inform you of the error, allowing you to handle it in the next turn. You do not need to anticipate errors.\n* **Multi-Turn Completion:** If the task requires multiple steps across turns (e.g., you must wait for the result of function call A before deciding on or performing action B), defer calling `end_task` until the very final action of the task is performed in a subsequent turn.\n\nIn summary, call `end_task` as soon as all planned actions for the current task have been initiated, unless you explicitly need to wait for results from those actions to determine further steps *within that same task*.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        success: {
          type: Type.BOOLEAN,
          description:
            "Required. A boolean value indicating the final outcome of the task. Set to `true` if the primary objective of the request was successfully achieved. Set to `false` if the task failed, could not be completed as requested, or if any errors prevented a successful outcome. This parameter determines the final status communicated about the task.",
        },
        message: {
          type: Type.STRING,
          description:
            "Required. A string message summarizing the final result and providing context for the `success` status. If `success` is `true`, this message should confirm successful completion and concisely mention key results or confirmations (e.g., 'Scheduled the meeting', 'Found the requested document'). If `success` is `false`, this message MUST clearly explain the reason for the failure, detail any errors encountered, and state why the task could not be successfully completed (e.g., 'Failed to find the specified user', 'Encountered an error calling the API: [error details]', 'Could not access the required document due to permissions').",
        },
      },
      required: ["success", "message"],
    },
  },
  paramsSchema: z.discriminatedUnion("success", [
    z.object({
      success: z.literal(true),
      message: z.string(),
    }),
    z.object({
      success: z.literal(false),
      error: z.string(),
    }),
  ]),
  create: (_editor: PlateEditor) => async (args) => {
    return args;
  },
});
