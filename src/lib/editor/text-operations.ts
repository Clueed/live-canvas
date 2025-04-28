import { type Schema, SchemaType } from "@google/generative-ai";
import { MarkdownPlugin } from "@udecode/plate-markdown";
import type { PlateEditor } from "@udecode/plate/react";
import { z } from "zod";
import { defineAiFunction } from "./helpers";

/**
 * Operation for retrieving the current editor artifact content
 */
export const getEditorArtifactOperation = defineAiFunction({
  declaration: {
    name: "get_editor_artifact",
    description: `
Fetches the current text of the artifact in the editor, including any Markdown syntax.
Use this to read or reference what's already displayed before deciding edits.
Returns a single string with the full artifact content (Markdown intact)
`.trim(),
  },
  create: (editor: PlateEditor) => () => {
    return {
      success: true,
      response: {
        artifact: editor.getApi(MarkdownPlugin).markdown.serialize(),
      },
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
      type: SchemaType.OBJECT,
      properties: {
        text: {
          type: SchemaType.STRING,
          description: "Complete artifact content.",
        } satisfies Schema,
      },
      required: ["text"],
    },
  },
  paramsSchema: z.object({
    text: z.string(),
  }),
  create: (editor: PlateEditor) => (args) => {
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
