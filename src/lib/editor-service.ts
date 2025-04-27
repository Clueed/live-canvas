import { EditorOperationResult } from '@/hooks/use-tool-call-handler';
import { type PlateEditor } from '@udecode/plate/react';

export interface EditorService {
  canvasText: () => string;
  updateCanvasText: (text: string, isUserUpdate: boolean) => void;
  undo: () => EditorOperationResult;
  redo: () => EditorOperationResult;
}

export function createEditorService(editor: PlateEditor): EditorService {
  const canvasText = () => editor.api.markdown.serialize();

  const updateCanvasText = (newText: string, isUserUpdate: boolean) => {
    const newMarkdown = editor.api.markdown.deserialize(newText);
    if (!newMarkdown) {
      return;
    }
    editor.tf.setValue(newMarkdown);
  };

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
      content: editor.api.markdown.serialize()
    };
  };

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
      content: editor.api.markdown.serialize()
    };
  };

  return {
    canvasText,
    updateCanvasText,
    undo,
    redo
  };
}
