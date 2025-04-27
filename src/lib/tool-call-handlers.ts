import { EditorOperationResult } from '@/hooks/use-tool-call-handler';
import { EditorService, ReadableSelection } from '@/lib/editor-service';
import {
  getEditorArtifact,
  getEditorSelection,
  redoLastArtifactUndo,
  setEditorArtifact,
  setEditorSelection,
  undoLastArtifactChange
} from '@/lib/prompts';
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
      case getEditorSelection.name: {
        const result = editorService.getReadableSelection();

        console.log('readable selection result', result);

        return {
          response: {
            output: result
          },
          id: fc.id
        };
      }
      case setEditorSelection.name: {
        const args = fc.args as {
          startParagraphIndex?: number;
          endParagraphIndex?: number;
          selectedText?: string;
        };
        if (
          typeof args?.startParagraphIndex === 'number' &&
          typeof args?.endParagraphIndex === 'number' &&
          typeof args?.selectedText === 'string'
        ) {
          const result = editorService.setSelection(
            args.startParagraphIndex,
            args.endParagraphIndex,
            args.selectedText
          );

          return {
            response: {
              output: result
            },
            id: fc.id
          };
        } else {
          return {
            response: {
              output: {
                success: false,
                error: 'Invalid arguments: Missing or invalid startParagraphIndex, endParagraphIndex, or selectedText'
              }
            },
            id: fc.id
          };
        }
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
