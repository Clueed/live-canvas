import { SchemaType } from "@google/generative-ai";
import type { PlateEditor } from "@udecode/plate/react";
import { z } from "zod";
import { defineAiFunction } from "./helpers";

export const completeTaskOperation = defineAiFunction({
  declaration: {
    name: "complete_task",
    description:
      "Signals that the task is complete and provides a message to return to the caller.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        success: {
          type: SchemaType.BOOLEAN,
          description: "Whether the task was completed successfully.",
        },
        message: {
          type: SchemaType.STRING,
          description:
            "A message to return to the caller summarizing the result.",
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
