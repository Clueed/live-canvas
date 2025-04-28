import type { EditorOperationResult } from "@/hooks/use-tool-call-handler";
import { FunctionDeclaration, Schema, SchemaType } from "@google/generative-ai";
import { MarkdownPlugin } from "@udecode/plate-markdown";
import type { PlateEditor } from "@udecode/plate/react";

/**
 * Operation for undoing the last artifact change
 */
export const undoOperation = {
  declaration: {
    name: "undo_last_artifact_change",
    description: `
Reverts the most recent modification made to the artifact in the editor, typically when the user explicitly asks to undo.
Returns an operation result with success status, error message if failed, and current content after the undo operation.
`.trim(),
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },

  /**
   * Creates a function to perform an undo operation on the editor
   * @param editor PlateEditor instance
   * @returns Function that performs an undo operation
   */
  create: (editor: PlateEditor) =>
    function undo(): EditorOperationResult {
      if (editor.history.undos.length === 0) {
        return {
          success: false,
          error: "Cannot undo - you are at the beginning of the edit history",
        };
      }
      editor.tf.undo();

      return {
        success: true,
        content: editor.getApi(MarkdownPlugin).markdown.serialize(),
      };
    },
};

/**
 * Operation for redoing the last artifact undo
 */
export const redoOperation = {
  declaration: {
    name: "redo_last_artifact_undo",
    description: `
Reapplies the last artifact change that was undone, typically when the user explicitly asks to redo.
Returns an operation result with success status, error message if failed, and current content after the redo operation.
`.trim(),
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: [],
    },
  },

  /**
   * Creates a function to perform a redo operation on the editor
   * @param editor PlateEditor instance
   * @returns Function that performs a redo operation
   */
  create: (editor: PlateEditor) =>
    function redo(): EditorOperationResult {
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
        content: editor.getApi(MarkdownPlugin).markdown.serialize(),
      };
    },
};
