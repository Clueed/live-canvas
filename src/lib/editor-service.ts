import { EditorOperationResult } from '@/hooks/use-tool-call-handler';
import { MarkdownPlugin } from '@udecode/plate-markdown';
import { type PlateEditor } from '@udecode/plate/react';

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

  return {
    canvasText,
    updateCanvasText,
    undo,
    redo
  };
}
