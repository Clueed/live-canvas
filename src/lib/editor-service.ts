import { EditorOperationResult } from '@/hooks/use-tool-call-handler';
import { MarkdownPlugin } from '@udecode/plate-markdown';
import { type PlateEditor } from '@udecode/plate/react';

import { BaseRange, Editor, Node, Path, Point, Text } from 'slate';

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
   * @returns An operation result containing the selection on success, or an error message on failure
   */
  getReadableSelection: () => EditorOperationResult & { selection?: ReadableSelection };

  /**
   * Sets the selection in the editor based on paragraph indices
   * @param startParagraphIndex - The 0-based index of the starting paragraph
   * @param endParagraphIndex - The 0-based index of the ending paragraph
   * @param selectedText - The exact text content to select within the range
   * @returns An operation result indicating success or failure
   */
  setSelection: (startParagraphIndex: number, endParagraphIndex: number, selectedText: string) => EditorOperationResult;
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
   * @returns An operation result containing the selection on success, or an error message on failure
   */
  const getReadableSelection = (): EditorOperationResult & { selection?: ReadableSelection } => {
    const selection = editor.selection;
    if (!selection) {
      return { success: false, error: 'No selection exists in the editor' };
    }

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
        success: true,
        selection: {
          startParagraphIndex,
          endParagraphIndex,
          selectedText
        }
      };
    } catch (error) {
      // console.error('Error creating readable selection:', error);
      return { success: false, error: `Error creating readable selection: ${error}` };
      // return null;
    }
  };

  /**
   * Sets the selection in the editor to span the given paragraph indices
   * @param startParagraphIndex - The 0-based index of the starting paragraph
   * @param endParagraphIndex - The 0-based index of the ending paragraph
   * @param selectedText - The exact text content to select within the range
   * @returns An operation result indicating success or failure
   */
  const setSelection = (
    startParagraphIndex: number,
    endParagraphIndex: number,
    selectedText: string
  ): EditorOperationResult => {
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

      // --- Find the text within the paragraph range ---
      let combinedText = '';
      const nodesInRange: Node[] = [];
      for (let i = startParagraphIndex; i <= endParagraphIndex; i++) {
        const node = Node.get(editorNode, [i]);
        if (node) {
          nodesInRange.push(node);
          combinedText += Node.string(node) + '\n'; // Add newline to simulate paragraph breaks
        } else {
          return { success: false, error: `Could not find node at index ${i}` };
        }
      }
      combinedText = combinedText.slice(0, -1); // Remove trailing newline

      const startIndexInCombined = combinedText.indexOf(selectedText);

      if (startIndexInCombined === -1) {
        return {
          success: false,
          error: `Could not find the text "${selectedText}" within paragraphs ${startParagraphIndex} to ${endParagraphIndex}`
        };
      }

      // --- Calculate the precise Slate Path and Offset ---
      let accumulatedLength = 0;
      let startPoint: Point | null = null;
      let endPoint: Point | null = null;

      for (let i = 0; i < nodesInRange.length; i++) {
        const node = nodesInRange[i];
        const paragraphIndex = startParagraphIndex + i;
        const nodeText = Node.string(node);
        const nodeLength = nodeText.length;

        // Calculate start point
        if (!startPoint && startIndexInCombined < accumulatedLength + nodeLength) {
          const offsetInNode = startIndexInCombined - accumulatedLength;
          // Assuming text node is the first child at path [paragraphIndex, 0]
          const path: Path = [paragraphIndex, 0];
          // Validate path exists
          if (Node.has(editorNode, path) && Text.isText(Node.get(editorNode, path))) {
            startPoint = { path, offset: offsetInNode };
          } else {
            // Handle cases where paragraph might be empty or structure is different
            console.warn(`Could not find text node at path ${path} for start point.`);
            // Attempt to select the start of the paragraph as fallback
            startPoint = { path: [paragraphIndex, 0], offset: 0 };
          }
        }

        // Calculate end point
        const endIndexInCombined = startIndexInCombined + selectedText.length;
        if (startPoint && !endPoint && endIndexInCombined <= accumulatedLength + nodeLength + 1) {
          // +1 for the newline we added
          const offsetInNode = endIndexInCombined - accumulatedLength;
          // Assuming text node is the first child at path [paragraphIndex, 0]
          const path: Path = [paragraphIndex, 0];
          // Validate path exists
          if (Node.has(editorNode, path) && Text.isText(Node.get(editorNode, path))) {
            // Clamp offset to the actual length of the text node
            const textNode = Node.get(editorNode, path) as Text;
            const actualOffset = Math.min(offsetInNode, textNode.text.length);
            endPoint = { path, offset: actualOffset };
          } else {
            console.warn(`Could not find text node at path ${path} for end point.`);
            // Attempt to select the end of the paragraph text as fallback
            const textNode = Node.get(editorNode, [paragraphIndex, 0]) as Text;
            endPoint = { path: [paragraphIndex, 0], offset: textNode?.text.length ?? 0 };
          }
        }

        accumulatedLength += nodeLength + 1; // Account for the added newline

        if (startPoint && endPoint) {
          break; // Found both points
        }
      }

      if (!startPoint || !endPoint) {
        // This shouldn't happen if the text was found, but as a safeguard
        return { success: false, error: 'Failed to calculate selection points.' };
      }

      const selectionRange: BaseRange = {
        anchor: startPoint,
        focus: endPoint
      };

      editor.tf.select(selectionRange);

      return { success: true };
    } catch (error) {
      return { success: false, error: `Error setting selection: ${error}` };
    }
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
