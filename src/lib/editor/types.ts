import type { EditorOperationResult } from "@/hooks/use-tool-call-handler";

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
  getReadableSelection: () => EditorOperationResult & {
    selection?: ReadableSelection;
  };

  /**
   * Sets the selection in the editor based on paragraph indices
   * @param startParagraphIndex - The 0-based index of the starting paragraph
   * @param endParagraphIndex - The 0-based index of the ending paragraph
   * @param selectedText - The exact text content to select within the range
   * @returns An operation result indicating success or failure
   */
  setSelection: (
    startParagraphIndex: number,
    endParagraphIndex: number,
    selectedText: string,
  ) => EditorOperationResult;
}
