import { AI_FUNCTIONS } from "@/lib/ai-functions";
import type { LiveFunctionCall } from "@/types/multimodal-live-types";
import type { PlateEditor } from "@udecode/plate/react";

export function createFunctionCallHandler(editor: PlateEditor) {
  return (fc: LiveFunctionCall) => {
    const functionDeclaration = AI_FUNCTIONS.find(
      (f) => f.declaration.name === fc.name,
    );

    if (!functionDeclaration) {
      console.warn(`Unknown function call: ${fc.name}`);

      return {
        response: { success: false, error: "Unknown function call" },
        id: fc.id,
      };
    }

    const functionCall = functionDeclaration.create(editor);

    const argsSchema = functionDeclaration.paramsSchema;
    const argsResult = argsSchema.safeParse(fc.args);
    if (!argsResult.success) {
      return {
        response: { success: false, error: argsResult.error.message },
        id: fc.id,
      };
    }

    const response = functionCall(argsResult.data);

    return {
      response: response,
      id: fc.id,
    };
  };
}
