import { createFunctionCallHandler } from "@/lib/tool-call-handlers";
import {
  type FunctionCall,
  GoogleGenerativeAI,
  SchemaType,
} from "@google/generative-ai";
import { MarkdownPlugin } from "@udecode/plate-markdown";
import type { PlateEditor } from "@udecode/plate/react";
import { z } from "zod";
import { COMPLEX_EDIT_SYSTEM_PROMPT } from "../prompts";
import { completeTaskOperation } from "./complete-task-ai-function";
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
  completeTaskOperation,
] as const;

export const performComplexEditOperation = defineAiFunction({
  declaration: {
    name: "perform_complex_edit",
    description:
      "Performs complex editing tasks based on a user prompt by leveraging other available editor functions. It can understand the user's intent and orchestrate calls to other tools like text replacement, selection manipulation, or content retrieval to achieve the desired outcome. It manages a multi-turn conversation with the Gemini model to achieve this.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        prompt: {
          type: SchemaType.STRING,
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
    const { prompt: inputPrompt } = args;
    const md = editor.getApi(MarkdownPlugin).markdown.serialize();
    const prompt = createPrompt(inputPrompt, md);

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
        systemInstruction: COMPLEX_EDIT_SYSTEM_PROMPT,
      });

      const chat = model.startChat({
        history: [],
      });

      console.log("Sending initial prompt to Gemini:", prompt);
      let result = await chat.sendMessage(prompt);
      let response = result.response;
      console.log(
        "Received initial response from Gemini:",
        JSON.stringify(response, null, 2),
      );

      const calls: FunctionCall[] =
        response.candidates?.[0]?.content?.parts?.flatMap((part) =>
          part.functionCall ? [part.functionCall] : [],
        ) ?? [];

      console.log(
        "Gemini Function Call(s):",
        calls.map((call) => ({ name: call.name, args: call.args })),
      );

      const functionResponseParts = await Promise.all(
        calls.map(async (call) => {
          const { response: functionCallResponse } = await functionCallHandler({
            ...call,
            id: "dummy-id",
          });

          return {
            functionResponse: {
              name: call.name,
              response: functionCallResponse,
            },
          };
        }),
      );

      const hasErrors = functionResponseParts.some(
        (part) => !part.functionResponse.response.success,
      );

      if (hasErrors) {
        console.log(
          "Sending FunctionResponseParts back to Gemini:",
          JSON.stringify(functionResponseParts, null, 2),
        );
        result = await chat.sendMessage(functionResponseParts);
        response = result.response;
        console.log(
          "Received final response from Gemini:",
          JSON.stringify(response, null, 2),
        );
      }

      const finalText = response.text();
      console.log("Gemini Final Text Response:", finalText);
      return { success: true, text: finalText };
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
  },
});

const createPrompt = (inputPrompt: string, md: string) => {
  return `
# Instructions 
${inputPrompt}

# Current artifact:
${md}
`.trim();
};
