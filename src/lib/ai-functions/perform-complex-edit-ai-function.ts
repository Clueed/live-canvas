import { createFunctionCallHandler } from "@/lib/tool-call-handlers";
import {
  type FunctionCall,
  type FunctionResponsePart,
  GoogleGenerativeAI,
  SchemaType,
} from "@google/generative-ai";
import type { PlateEditor } from "@udecode/plate/react";
import { z } from "zod";
import { redoOperation, undoOperation } from "./editor-history-ai-functions";
import {
  getEditorArtifactOperation,
  replaceTextOperation,
  setEditorArtifactOperation,
} from "./editor-text-ai-functions";
import { defineAiFunction } from "./helpers";

const PERFORM_COMPLEX_EDIT_FUNCTIONS = [
  getEditorArtifactOperation,
  setEditorArtifactOperation,
  replaceTextOperation,
  undoOperation,
  redoOperation,
] as const;

export const performComplexEditOperation = defineAiFunction({
  declaration: {
    name: "perform_complex_edit",
    description:
      "Performs complex editing tasks based on a user prompt by leveraging other available editor functions. It can understand the user's intent and orchestrate calls to other tools like text replacement, selection manipulation, or content retrieval to achieve the desired outcome. It manages a multi-turn conversation with the Gemini model to achieve this.",
    parameters: {
      type: SchemaType.OBJECT, // Use the imported SchemaType enum
      properties: {
        prompt: {
          type: SchemaType.STRING, // Use the imported SchemaType enum
          description: "User's instruction for the complex edit.",
        },
      },
      required: ["prompt"],
    },
  },
  paramsSchema: z.object({
    prompt: z.string().min(1, "Prompt cannot be empty."),
  }),
  create: (editor: PlateEditor) => async (args) => {
    const { prompt } = args;
    console.log(`Executing perform_complex_edit with prompt: "${prompt}"`);

    const apiKey = process.env.NEXT_PUBLIC_GCP_API_KEY;
    if (!apiKey) {
      console.error("NEXT_PUBLIC_GCP_API_KEY is not defined.");
      return {
        success: false,
        error: "Missing API key for complex edit functionality.",
      };
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const functionCallHandler = createFunctionCallHandler(
        editor,
        PERFORM_COMPLEX_EDIT_FUNCTIONS,
      );
      const toolDeclarations = PERFORM_COMPLEX_EDIT_FUNCTIONS.map(
        (tool) => tool.declaration,
      );

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-preview-04-17",
        tools: [{ functionDeclarations: toolDeclarations }],
      });

      const chat = model.startChat({
        history: [],
      });

      console.log("Sending initial prompt to Gemini:", prompt);
      let result = await chat.sendMessage(prompt);
      let iterationCount = 0;
      const MAX_ITERATIONS = 10;

      while (iterationCount < MAX_ITERATIONS) {
        iterationCount++;
        const response = result.response;
        const calls: FunctionCall[] = [];

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.functionCall) {
              calls.push(part.functionCall);
            }
          }
        }

        if (calls.length > 0) {
          console.log(
            `Gemini Function Call(s) [Iteration ${iterationCount}]:`,
            calls.map((call) => call.name),
          );
          const functionResponseParts: FunctionResponsePart[] = [];

          for (const call of calls) {
            try {
              const { response: functionCallResponse } =
                await functionCallHandler({
                  ...call,
                  id: "dummy-id",
                });

              functionResponseParts.push({
                functionResponse: {
                  name: call.name,
                  response: functionCallResponse,
                },
              });
            } catch (e: unknown) {
              console.error(`Error executing tool ${call.name}:`, e);
              const errorMessage =
                e instanceof Error ? e.message : "Unknown error";
              functionResponseParts.push({
                functionResponse: {
                  name: call.name,
                  response: {
                    success: false,
                    error: `Error executing tool ${call.name}: ${errorMessage}`,
                  },
                },
              });
            }
          }

          if (functionResponseParts.length > 0) {
            console.log(
              `Sending FunctionResponseParts to Gemini [Iteration ${iterationCount}]:`,
              JSON.stringify(functionResponseParts, null, 2),
            );
            result = await chat.sendMessage(functionResponseParts);
          } else {
            // This case should ideally not happen if calls.length > 0
            // but as a fallback, if no responses were generated, break.
            console.log(
              "No function responses generated despite calls, breaking.",
            );
            return { success: true, text: response.text() }; // Or handle as an error/unexpected state
          }
        } else {
          // No function call, so we have a final text response
          const finalText = response.text();
          console.log("Gemini Final Response:", finalText);
          return { success: true, text: finalText }; // Assuming AiFunctionResponse can handle this
        }
      }
      if (iterationCount >= MAX_ITERATIONS) {
        console.warn("Reached max iterations for perform_complex_edit.");
        return {
          success: false,
          error: "Reached maximum iterations without a final text response.",
        };
      }
    } catch (error: unknown) {
      console.error("Error in performComplexEditOperation:", error);
      let errorMessage = "An unexpected error occurred during complex edit.";
      if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }

      // Check for specific Gemini API error details if available
      // Assuming error is an object with a response property, which has a promptFeedback property
      const gcpError = error as { response?: { promptFeedback?: unknown } };
      if (gcpError?.response?.promptFeedback) {
        errorMessage += ` Gemini API feedback: ${JSON.stringify(gcpError.response.promptFeedback)}`;
      }
      return {
        success: false,
        error: errorMessage,
      };
    }

    return {
      success: false,
      error: "This should never happen. Please report this bug.",
    };
  },
});
