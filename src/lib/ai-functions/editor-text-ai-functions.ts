import { Type } from "@google/genai";
import { MarkdownPlugin } from "@udecode/plate-markdown";
import { SuggestionPlugin } from "@udecode/plate-suggestion/react";
import type { PlateEditor } from "@udecode/plate/react";
import type { BaseRange } from "slate";
import { z } from "zod";
import {
  findTextInParagraphs,
  getParagraphTexts,
  getSlatePoint,
} from "./editor-functions-helpers";
import { defineAiFunction } from "./helpers";

/**
 * Operation for retrieving the current editor artifact content
 */
export const getEditorArtifactOperation = defineAiFunction({
  declaration: {
    name: "get_editor_artifact",
    description: `
Fetches the current text of the artifact in the editor.
`.trim(),
  },
  create: (editor: PlateEditor) => async () => {
    return {
      success: true,
      artifact: editor.getApi(MarkdownPlugin).markdown.serialize(),
    };
  },
});

export const setEditorArtifactOperation = defineAiFunction({
  declaration: {
    name: "set_editor_artifact",
    description: `
Replaces the entire content of the user's artifact in the editor, which supports Markdown formatting (headings, lists, code blocks, etc.).
Use this when you've generated or revised a complete draft and want to display it.
Does *not* merge with existing text; always supplies a full artifact string.
  `.trim(),
    parameters: {
      type: Type.OBJECT,
      properties: {
        text: {
          type: Type.STRING,
          description: "Complete artifact content.",
        },
      },
      required: ["text"],
    },
  },
  paramsSchema: z.object({
    text: z.string(),
  }),
  create: (editor: PlateEditor) => async (args) => {
    const newMarkdown = editor
      .getApi(MarkdownPlugin)
      .markdown.deserialize(args.text);
    if (!newMarkdown) {
      return { success: false, error: "Failed to deserialize markdown" };
    }
    editor.tf.setValue(newMarkdown);
    return { success: true };
  },
});

/**
 * Operation for replacing text within specific paragraphs
 */
export const replaceTextOperation = defineAiFunction({
  declaration: {
    name: "replace_text",
    description: `
Replaces specific text within a range of paragraphs in the editor.
Use this for targeted text replacements while preserving the rest of the document.
`.trim(),
    parameters: {
      type: Type.OBJECT,
      properties: {
        startParagraphIndex: {
          type: Type.NUMBER,
          description:
            "The 0-based index of the paragraph where the replacement should start.",
        },
        endParagraphIndex: {
          type: Type.NUMBER,
          description:
            "The 0-based index of the paragraph where the replacement should end (inclusive).",
        },
        textToReplace: {
          type: Type.STRING,
          description:
            "The exact text content that should be replaced within the specified paragraph range.",
        },
        replacementText: {
          type: Type.STRING,
          description: "The new text to insert in place of the matched text.",
        },
      },
      required: [
        "startParagraphIndex",
        "endParagraphIndex",
        "textToReplace",
        "replacementText",
      ],
    },
  },
  paramsSchema: z.object({
    startParagraphIndex: z.number(),
    endParagraphIndex: z.number(),
    textToReplace: z.string().min(1),
    replacementText: z.string(),
  }),
  create:
    (editor: PlateEditor) =>
    async ({
      startParagraphIndex,
      endParagraphIndex,
      textToReplace,
      replacementText,
    }) => {
      try {
        const maxIndex = editor.children.length - 1;

        console.log("children", editor.children);

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

        // Get the raw text from paragraphs without markdown conversion
        const texts = getParagraphTexts(
          editor,
          startParagraphIndex,
          endParagraphIndex,
        );

        // Find the text in paragraphs using raw text
        const found = findTextInParagraphs(texts, textToReplace);
        if (!found) {
          return {
            success: false,
            error: `Could not find the text "${textToReplace}" within paragraphs ${startParagraphIndex} to ${endParagraphIndex}`,
          };
        }

        // Create selection range for the text to replace
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

        // Select the text and replace it
        editor.tf.select(selectionRange);
        editor.setOption(SuggestionPlugin, "isSuggesting", true);
        editor.tf.insertText(replacementText);
        editor.setOption(SuggestionPlugin, "isSuggesting", false);

        return { success: true };
      } catch (error) {
        return { success: false, error: `Error replacing text: ${error}` };
      }
    },
});
