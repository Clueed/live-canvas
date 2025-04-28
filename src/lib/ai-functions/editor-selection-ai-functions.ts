import { type Schema, SchemaType } from "@google/generative-ai";
import type { PlateEditor } from "@udecode/plate/react";

import type { BaseRange } from "slate";
import { z } from "zod";
import {
  findTextInParagraphs,
  getParagraphTexts,
  getSelectionText,
  getSlatePoint,
} from "./editor-functions-helpers";
import { defineAiFunction } from "./helpers";

/**
 * Get editor selection operation
 */
export const getSelectionOperation = defineAiFunction({
  declaration: {
    name: "get_editor_selection",
    description: `
Retrieves the visual selection in the editor. Use to communicate with the user about intent.
`.trim(),
  },
  create: (editor: PlateEditor) => () => {
    const selection = editor.selection;
    if (!selection) {
      return { success: false, error: "No selection exists in the editor" };
    }
    try {
      const { startParagraphIndex, endParagraphIndex, selectedText } =
        getSelectionText(editor, selection);
      return {
        success: true,
        startParagraphIndex,
        endParagraphIndex,
        selectedText,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error creating readable selection: ${error}`,
      };
    }
  },
});

/**
 * Set editor selection operation
 */
export const setSelectionOperation = defineAiFunction({
  declaration: {
    name: "set_editor_selection",
    description: `
Specify the visual selection in the editor. Use to communicate with the user about intent.
`.trim(),
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        startParagraphIndex: {
          type: SchemaType.NUMBER,
          description:
            "The 0-based index of the paragraph where the selection should start.",
        } satisfies Schema,
        endParagraphIndex: {
          type: SchemaType.NUMBER,
          description:
            "The 0-based index of the paragraph where the selection should end (inclusive).",
        } satisfies Schema,
        selectedText: {
          type: SchemaType.STRING,
          description:
            "The exact text content that should be selected within the specified paragraph range.",
        } satisfies Schema,
      },
      required: ["startParagraphIndex", "endParagraphIndex", "selectedText"],
    },
  },
  paramsSchema: z.object({
    startParagraphIndex: z.number(),
    endParagraphIndex: z.number(),
    selectedText: z.string().min(1),
  }),
  create:
    (editor: PlateEditor) =>
    ({ startParagraphIndex, endParagraphIndex, selectedText }) => {
      try {
        const maxIndex = editor.children.length - 1;
        if (
          startParagraphIndex < 0 ||
          startParagraphIndex > maxIndex ||
          endParagraphIndex < 0 ||
          endParagraphIndex > maxIndex ||
          startParagraphIndex > endParagraphIndex
        ) {
          return {
            success: false,
            error: `Invalid paragraph indices provided: start=${startParagraphIndex}, end=${endParagraphIndex}. Max index: ${maxIndex}`,
          };
        }
        const texts = getParagraphTexts(
          editor,
          startParagraphIndex,
          endParagraphIndex,
        );
        const found = findTextInParagraphs(texts, selectedText);
        if (!found) {
          return {
            success: false,
            error: `Could not find the text "${selectedText}" within paragraphs ${startParagraphIndex} to ${endParagraphIndex}`,
          };
        }
        const anchor = getSlatePoint(
          editor,
          startParagraphIndex + found.start.paragraph,
          found.start.offset,
        );
        const focus = getSlatePoint(
          editor,
          startParagraphIndex + found.end.paragraph,
          found.end.offset,
        );
        const selectionRange: BaseRange = { anchor, focus };
        editor.tf.select(selectionRange);
        return { success: true };
      } catch (error) {
        return { success: false, error: `Error setting selection: ${error}` };
      }
    },
});
