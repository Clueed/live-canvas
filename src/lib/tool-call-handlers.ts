import type { FunctionCall } from "@google/genai";
import type { PlateEditor } from "@udecode/plate/react";
import type { AiFunction } from "./ai-functions/helpers";

export function createFunctionCallHandler(
  editor: PlateEditor,
  functions: AiFunction[],
) {
  return async (fc: FunctionCall) => {
    const functionDeclaration = functions.find(
      (f) => f.declaration.name === fc.name,
    );

    if (!functionDeclaration) {
      console.warn(`Unknown function call: ${fc.name}`);

      return {
        id: fc.id,
        name: fc.name,
        response: { success: false, error: "Unknown function call" },
      };
    }

    const functionCall = functionDeclaration.create(editor);

    const argsSchema = functionDeclaration.paramsSchema;
    const argsResult = argsSchema.safeParse(fc.args);
    if (!argsResult.success) {
      return {
        id: fc.id,
        name: fc.name,
        response: { success: false, error: argsResult.error.message },
      };
    }

    const response = await functionCall(argsResult.data);

    return {
      id: fc.id,
      name: fc.name,
      response: response,
    };
  };
}
