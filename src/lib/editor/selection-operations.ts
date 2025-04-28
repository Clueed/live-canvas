import { EditorOperationResult } from '@/hooks/use-tool-call-handler';
import { FunctionDeclaration, Schema, SchemaType } from '@google/generative-ai';
import { PlateEditor } from '@udecode/plate/react';

import { ReadableSelection } from './types';
import { BaseRange, Editor, Node, Path, Point, Text } from 'slate';
import { z } from 'zod';

/**
 * Get editor selection operation
 */
export const getSelectionOperation = {
  declaration: {
    name: 'get_editor_selection',
    description: `
Retrieves the visual selection in the editor. Use to communicate with the user about intent.
Returns a selection object with the following properties:
- startParagraphIndex: The paragraph index at the start of the selection
- endParagraphIndex: The paragraph index at the end of the selection
- selectedText: The actual text content that is selected
`.trim(),
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: []
    }
  },

  /**
   * Creates get selection operation function for the editor
   * @param editor PlateEditor instance
   * @returns Function to get the current selection
   */
  create: function (editor: PlateEditor) {
    /**
     * Gets the current selection in a human-readable format
     * @returns An operation result containing the selection on success, or an error message on failure
     */
    return function getReadableSelection(): EditorOperationResult & { selection?: ReadableSelection } {
      const selection = editor.selection;
      if (!selection) {
        return { success: false, error: 'No selection exists in the editor' };
      }

      try {
        const { startParagraphIndex, endParagraphIndex, selectedText } = getSelectionText(
          editor as unknown as Editor,
          selection
        );

        return {
          success: true,
          selection: { startParagraphIndex, endParagraphIndex, selectedText }
        };
      } catch (error) {
        return { success: false, error: `Error creating readable selection: ${error}` };
      }
    };
  }
};

/**
 * Set editor selection operation
 */
export const setSelectionOperation = {
  declaration: {
    name: 'set_editor_selection',
    description: `
Specify the visual selection in the editor. Use to communicate with the user about intent.
`.trim(),
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        startParagraphIndex: {
          type: SchemaType.NUMBER,
          description: 'The 0-based index of the paragraph where the selection should start.'
        } satisfies Schema,
        endParagraphIndex: {
          type: SchemaType.NUMBER,
          description: 'The 0-based index of the paragraph where the selection should end (inclusive).'
        } satisfies Schema,
        selectedText: {
          type: SchemaType.STRING,
          description: 'The exact text content that should be selected within the specified paragraph range.'
        } satisfies Schema
      },
      required: ['startParagraphIndex', 'endParagraphIndex', 'selectedText']
    }
  } satisfies FunctionDeclaration,

  paramsSchema: z.object({
    startParagraphIndex: z.number(),
    endParagraphIndex: z.number(),
    selectedText: z.string().min(1)
  }),
  /**
   * Creates set selection operation function for the editor
   * @param editor PlateEditor instance
   * @returns Function to set the editor selection
   */
  create: function (editor: PlateEditor) {
    /**
     * Sets the selection in the editor to span the given paragraph indices
     * @param startParagraphIndex - The 0-based index of the starting paragraph
     * @param endParagraphIndex - The 0-based index of the ending paragraph
     * @param selectedText - The exact text content to select within the range
     * @returns An operation result indicating success or failure
     */
    return function setSelection(
      startParagraphIndex: number,
      endParagraphIndex: number,
      selectedText: string
    ): EditorOperationResult {
      if (!selectedText || selectedText.trim() === '') {
        return { success: false, error: 'selectedText cannot be empty.' };
      }

      try {
        const editorNode = editor as unknown as Editor; // Cast for Node operations
        const maxIndex = editorNode.children.length - 1;

        // Validate indices
        if (
          startParagraphIndex < 0 ||
          startParagraphIndex > maxIndex ||
          endParagraphIndex < 0 ||
          endParagraphIndex > maxIndex ||
          startParagraphIndex > endParagraphIndex
        ) {
          return {
            success: false,
            error: `Invalid paragraph indices provided: start=${startParagraphIndex}, end=${endParagraphIndex}. Max index: ${maxIndex}`
          };
        }

        const texts = getParagraphTexts(editorNode, startParagraphIndex, endParagraphIndex);
        const found = findTextInParagraphs(texts, selectedText);
        if (!found) {
          return {
            success: false,
            error: `Could not find the text "${selectedText}" within paragraphs ${startParagraphIndex} to ${endParagraphIndex}`
          };
        }
        const anchor = getSlatePoint(editorNode, startParagraphIndex + found.start.paragraph, found.start.offset);
        const focus = getSlatePoint(editorNode, startParagraphIndex + found.end.paragraph, found.end.offset);
        const selectionRange: BaseRange = { anchor, focus };

        editor.tf.select(selectionRange);

        return { success: true };
      } catch (error) {
        return { success: false, error: `Error setting selection: ${error}` };
      }
    };
  }
};

function getParagraphNodes(editor: Editor, start: number, end: number): Node[] {
  const nodes: Node[] = [];
  for (let i = start; i <= end; i++) {
    const node = Node.get(editor, [i]);
    if (!node) throw new Error(`Could not find node at index ${i}`);
    nodes.push(node);
  }

  return nodes;
}

function getParagraphTexts(editor: Editor, start: number, end: number): string[] {
  return getParagraphNodes(editor, start, end).map(Node.string);
}

function combineParagraphTexts(texts: string[]): string {
  return texts.join('\n');
}

function findTextInParagraphs(texts: string[], selectedText: string) {
  const combined = combineParagraphTexts(texts);
  const startIndex = combined.indexOf(selectedText);
  if (startIndex === -1) return null;
  let acc = 0;
  let start: { paragraph: number; offset: number } | null = null;
  let end: { paragraph: number; offset: number } | null = null;
  const endIndex = startIndex + selectedText.length;
  for (let i = 0; i < texts.length; i++) {
    const len = texts[i].length;
    if (!start && startIndex < acc + len + (i > 0 ? 1 : 0)) {
      start = { paragraph: i, offset: startIndex - acc };
    }
    if (start && !end && endIndex <= acc + len + (i > 0 ? 1 : 0)) {
      end = { paragraph: i, offset: endIndex - acc };
      break;
    }
    acc += len + 1;
  }
  if (!start || !end) return null;

  return { start, end };
}

function getSlatePoint(editor: Editor, paragraphIndex: number, offset: number): Point {
  const path: Path = [paragraphIndex, 0];
  if (Node.has(editor, path) && Text.isText(Node.get(editor, path))) {
    const textNode = Node.get(editor, path) as Text;

    return { path, offset: Math.min(offset, textNode.text.length) };
  }

  return { path, offset: 0 };
}

function getSelectionText(editor: Editor, selection: BaseRange) {
  const startParagraphIndex = selection.anchor.path[0];
  const endParagraphIndex = selection.focus.path[0];
  const texts = getParagraphTexts(editor, startParagraphIndex, endParagraphIndex);
  if (startParagraphIndex === endParagraphIndex) {
    const start = selection.anchor.offset;
    const end = selection.focus.offset;

    return {
      startParagraphIndex,
      endParagraphIndex,
      selectedText: texts[0].slice(Math.min(start, end), Math.max(start, end))
    };
  }

  return {
    startParagraphIndex,
    endParagraphIndex,
    selectedText: combineParagraphTexts(texts)
  };
}
