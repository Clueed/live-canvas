import { EditorOperationResult } from '@/hooks/use-tool-call-handler';
import { TOOL_CALL_FUNCTIONS } from '@/lib/editor';
import { LiveFunctionCall } from '@/types/multimodal-live-types';
import { PlateEditor } from '@udecode/plate/react';

export function createFunctionCallHandler(editor: PlateEditor) {
  return (fc: LiveFunctionCall) => {
    const functionDeclaration = TOOL_CALL_FUNCTIONS.find((f) => f.declaration.name === fc.name);

    if (!functionDeclaration) {
      console.warn(`Unknown function call: ${fc.name}`);

      return {
        response: { success: false, error: 'Unknown function call' },
        id: fc.id
      };
    }

    const functionCall = functionDeclaration.create(editor);

    let args = undefined;
    const argsSchema = functionDeclaration.paramsSchema;
    if (argsSchema) {
      const argsResult = argsSchema.safeParse(fc.args);

      if (!argsResult.success) {
        return {
          response: { success: false, error: argsResult.error.message },
          id: fc.id
        };
      }

      args = argsResult.data;
    }
    let response;
    if (argsSchema) {
      response = functionCall(args);
    } else {
      response = functionCall();
    }

    return {
      response: response,
      id: fc.id
    };
  };
}
