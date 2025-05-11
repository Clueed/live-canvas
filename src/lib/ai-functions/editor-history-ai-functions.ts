import type { PlateEditor } from "@udecode/plate/react";
import { z } from "zod";
import { defineAiFunction } from "./helpers";

/**
 * Operation for undoing the last artifact change
 */
export const undoOperation = defineAiFunction({
  declaration: {
    name: "undo_last_artifact_change",
    description: `
Reverts the most recent modification made to the artifact in the editor.
`.trim(),
  },
  paramsSchema: z.object({}),
  create: (editor: PlateEditor) => async () => {
    if (editor.history.undos.length === 0) {
      return {
        success: false,
        error: "Cannot undo - you are at the beginning of the edit history",
      };
    }
    editor.tf.undo();
    return {
      success: true,
    };
  },
});

/**
 * Operation for redoing the last artifact undo
 */
export const redoOperation = defineAiFunction({
  declaration: {
    name: "redo_last_artifact_undo",
    description: `
Reapplies the last artifact change that was undone.
`.trim(),
  },
  paramsSchema: z.object({}),
  create: (editor: PlateEditor) => async () => {
    if (editor.history.redos.length === 0) {
      return {
        success: false,
        error:
          "Cannot redo - you are at the most recent edit or all changes have been undone",
      };
    }
    editor.tf.redo();
    return {
      success: true,
    };
  },
});
