import { EditorOperationResult } from '@/hooks/use-tool-call-handler';
import { EditorService } from '@/lib/editor-service';
import { getEditorArtifact, redoLastArtifactUndo, setEditorArtifact, undoLastArtifactChange } from '@/lib/prompts';
import { LiveFunctionCall } from '@/types/multimodal-live-types';

export function createFunctionCallHandler(editorService: EditorService) {
  return (fc: LiveFunctionCall) => {
    switch (fc.name) {
      case setEditorArtifact.name: {
        const args = fc.args as { text?: string };
        if (typeof args?.text === 'string') {
          editorService.updateCanvasText(args.text, false);

          return {
            response: { output: { success: true } },
            id: fc.id
          };
        } else {
          return {
            response: { output: { success: false, error: 'Invalid arguments' } },
            id: fc.id
          };
        }
      }
      case getEditorArtifact.name: {
        return {
          response: { success: true, artifact: editorService.canvasText() },
          id: fc.id
        };
      }
      case undoLastArtifactChange.name: {
        const result = editorService.undo();

        return {
          response: {
            success: result.success,
            ...(result.error && { error: result.error }),
            ...(result.content && { artifact: result.content })
          },
          id: fc.id
        };
      }
      case redoLastArtifactUndo.name: {
        const result = editorService.redo();

        return {
          response: {
            success: result.success,
            ...(result.error && { error: result.error }),
            ...(result.content && { artifact: result.content })
          },
          id: fc.id
        };
      }
      default: {
        console.warn(`Unknown function call: ${fc.name}`);

        return {
          response: { success: false, error: 'Unknown function call' },
          id: fc.id
        };
      }
    }
  };
}
