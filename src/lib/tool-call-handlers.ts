import { EditorOperationResult } from '@/hooks/use-tool-call-handler';
import { EditorService } from '@/lib/editor-service';
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
        const selection = editorService.getSelection();

        console.log('selection', selection);

        return {
          response: {
            success: true,
            selection
          },
          id: fc.id
        };
      }
      case setEditorSelection.name: {
        const args = fc.args as { anchor?: any; focus?: any };

        if (args?.anchor?.path && typeof args.anchor.offset === 'number') {
          try {
            // If focus is not provided, it defaults to the anchor position
            const selection = {
              anchor: args.anchor,
              focus: args.focus || args.anchor
            };

            editorService.setSelection(selection);

            return {
              response: { success: true },
              id: fc.id
            };
          } catch (error) {
            return {
              response: {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error setting selection'
              },
              id: fc.id
            };
          }
        } else {
          return {
            response: {
              success: false,
              error: 'Invalid selection arguments. Anchor must have valid path and offset.'
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
