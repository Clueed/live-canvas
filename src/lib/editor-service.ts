import { EditorOperationResult } from '@/hooks/use-tool-call-handler';
import { MarkdownPlugin } from '@udecode/plate-markdown';
import { type PlateEditor } from '@udecode/plate/react';

import { BaseRange, Editor, Node } from 'slate';

/**
 * Represents a human-readable selection in the editor
 */
export interface ReadableSelection {
  /** The paragraph index at the selection start */
  startParagraphIndex: number;
  /** The paragraph index at the selection end */
  endParagraphIndex: number;
  /** The selected text content */
  selectedText: string;
}

/**
 * EditorService interface defining core editor operations.
 * Provides a unified API for interacting with the editor.
 */
export interface EditorService {
  /** Retrieves the current editor content as a Markdown string */
  canvasText: () => string;

  /**
   * Updates the editor content with new Markdown text
   * @param text - The Markdown content to set
   * @param isUserUpdate - Whether this update was initiated by the user
   */
  updateCanvasText: (text: string, isUserUpdate: boolean) => void;

  /**
   * Performs an undo operation on the editor
   * @returns An operation result indicating success/failure and updated content
   */
  undo: () => EditorOperationResult;

  /**
   * Performs a redo operation on the editor
   * @returns An operation result indicating success/failure and updated content
   */
  redo: () => EditorOperationResult;

  /**
   * Gets the current selection in a human-readable format
   * @returns A human-readable selection or null if no selection exists
   */
  getReadableSelection: () => ReadableSelection | null;

  /**
   * Sets the selection in the editor
   * @param selection - The selection to set
   */
  setSelection: (selection: BaseRange) => void;
}

/**
 * Creates an EditorService instance for the given PlateEditor.
 * Encapsulates editor operations and provides standardized error handling.
 *
 * @param editor - The PlateEditor instance to wrap
 * @returns An EditorService providing a unified interface to editor operations
 */
export function createEditorService(editor: PlateEditor): EditorService {
  /**
   * Retrieves the current editor content as Markdown
   * @returns The editor content as a Markdown string
   */
  const canvasText = () => editor.getApi(MarkdownPlugin).markdown.serialize();

  /**
   * Updates the editor content with new Markdown text
   * @param newText - The Markdown content to set
   * @param isUserUpdate - Whether this update was initiated by the user
   */
  const updateCanvasText = (newText: string, isUserUpdate: boolean) => {
    const newMarkdown = editor.getApi(MarkdownPlugin).markdown.deserialize(newText);
    if (!newMarkdown) {
      return;
    }
    editor.tf.setValue(newMarkdown);
  };

  /**
   * Performs an undo operation on the editor
   * @returns An operation result with success/failure status and content if successful
   */
  const undo = (): EditorOperationResult => {
    if (editor.history.undos.length === 0) {
      return {
        success: false,
        error: 'Cannot undo - you are at the beginning of the edit history'
      };
    }
    editor.tf.undo();

    return {
      success: true,
      content: editor.getApi(MarkdownPlugin).markdown.serialize()
    };
  };

  /**
   * Performs a redo operation on the editor
   * @returns An operation result with success/failure status and content if successful
   */
  const redo = (): EditorOperationResult => {
    if (editor.history.redos.length === 0) {
      return {
        success: false,
        error: 'Cannot redo - you are at the most recent edit or all changes have been undone'
      };
    }
    editor.tf.redo();

    return {
      success: true,
      content: editor.getApi(MarkdownPlugin).markdown.serialize()
    };
  };

  /**
   * Gets the current selection in a human-readable format
   * @returns A human-readable selection or null if no selection exists
   */
  const getReadableSelection = (): ReadableSelection | null => {
    const selection = editor.selection;
    if (!selection) return null;

    try {
      // Get the starting element index (usually paragraph number)
      const startParagraphIndex = selection.anchor.path[0];
      const endParagraphIndex = selection.focus.path[0];

      // Extract text content from the selection
      let selectedText = '';

      if (startParagraphIndex === endParagraphIndex) {
        // Selection within the same paragraph
        const node = Node.get(editor as unknown as Editor, [startParagraphIndex]);
        const text = Node.string(node);
        const start = selection.anchor.offset;
        const end = selection.focus.offset;
        selectedText = text.slice(Math.min(start, end), Math.max(start, end));
      } else {
        // Selection across multiple paragraphs - for simplicity, just get all text from each paragraph
        const startNode = Node.get(editor as unknown as Editor, [startParagraphIndex]);
        const endNode = Node.get(editor as unknown as Editor, [endParagraphIndex]);

        // Get text from start paragraph
        const startText = Node.string(startNode);
        // Get text from end paragraph
        const endText = Node.string(endNode);

        // Include text from paragraphs in between (if any)
        const paragraphs = [];
        paragraphs.push(startText);

        // Add paragraphs in between if there are any
        for (let i = startParagraphIndex + 1; i < endParagraphIndex; i++) {
          const node = Node.get(editor as unknown as Editor, [i]);
          paragraphs.push(Node.string(node));
        }

        if (startParagraphIndex !== endParagraphIndex) {
          paragraphs.push(endText);
        }

        selectedText = paragraphs.join('\n');
      }

      return {
        startParagraphIndex,
        endParagraphIndex,
        selectedText
      };
    } catch (error) {
      console.error('Error creating readable selection:', error);

      return null;
    }
  };

  /**
   * Sets the selection in the editor
   * @param selection - The selection to set
   */
  const setSelection = (selection: BaseRange): void => {
    editor.tf.select(selection);
  };

  return {
    canvasText,
    updateCanvasText,
    undo,
    redo,
    getReadableSelection,
    setSelection
  };
}
