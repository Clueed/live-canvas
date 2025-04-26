import { getEditorArtifact, redoLastArtifactUndo, setEditorArtifact, undoLastArtifactChange } from '@/lib/prompts';
import { LiveFunctionCall } from '@/types/multimodal-live-types';

interface FunctionCallHandlerParams {
    canvasText: string;
    updateCanvasText: (text: string, isUserUpdate: boolean) => void;
    undo?: () => void;
    redo?: () => void;
}

export function createFunctionCallHandler({ canvasText, updateCanvasText, undo, redo }: FunctionCallHandlerParams) {
    return (fc: LiveFunctionCall) => {
        switch (fc.name) {
            case setEditorArtifact.name: {
                const args = fc.args as { text?: string };
                if (typeof args?.text === 'string') {
                    updateCanvasText(args.text, false);

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
                    response: { success: true, artifact: canvasText },
                    id: fc.id
                };
            }
            case undoLastArtifactChange.name: {
                if (undo) {
                    undo();
                    return {
                        response: { success: true },
                        id: fc.id
                    };
                } else {
                    return {
                        response: { success: false, error: 'Undo functionality not available' },
                        id: fc.id
                    };
                }
            }
            case redoLastArtifactUndo.name: {
                if (redo) {
                    redo();
                    return {
                        response: { success: true },
                        id: fc.id
                    };
                } else {
                    return {
                        response: { success: false, error: 'Redo functionality not available' },
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
