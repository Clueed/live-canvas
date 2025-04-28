import { Schema, SchemaType } from '@google/generative-ai';
import { MarkdownPlugin } from '@udecode/plate-markdown';
import { PlateEditor } from '@udecode/plate/react';

import { FunctionOperation } from '.';
import { z } from 'zod';

/**
 * Operation for retrieving the current editor artifact content
 */
export const getEditorArtifactOperation = {
  declaration: {
    name: 'get_editor_artifact',
    description: `
Fetches the current text of the artifact in the editor, including any Markdown syntax.
Use this to read or reference what's already displayed before deciding edits.
Returns a single string with the full artifact content (Markdown intact)
`.trim(),
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: []
    }
  },

  /**
   * Creates a function to retrieve the editor content as Markdown
   * @param editor PlateEditor instance
   * @returns Function that returns the editor content as a Markdown string
   */
  create: function (editor: PlateEditor) {
    return function getEditorArtifact() {
      return {
        success: true,
        artifact: editor.getApi(MarkdownPlugin).markdown.serialize()
      };
    };
  }
};

/**
 * Operation for setting the editor artifact content
 */
const setEditorArtifactParamsSchema = z.object({
  text: z.string()
});

export const setEditorArtifactOperation = {
  paramsSchema: setEditorArtifactParamsSchema,
  declaration: {
    name: 'set_editor_artifact',
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
          description: 'Complete artifact content.'
        } satisfies Schema
      },
      required: ['text']
    }
  },
  /**
   * Creates a function to update the editor content with new Markdown text
   * @param editor PlateEditor instance
   * @returns Function that updates the editor with new Markdown content, validating input first.
   */
  create: function (editor: PlateEditor) {
    return function setEditorArtifact(args: z.infer<typeof setEditorArtifactParamsSchema>) {
      const newMarkdown = editor.getApi(MarkdownPlugin).markdown.deserialize(args.text);
      if (!newMarkdown) {
        return { success: false, error: 'Failed to deserialize markdown' };
      }
      editor.tf.setValue(newMarkdown);

      return { success: true };
    };
  }
} as const satisfies FunctionOperation;
