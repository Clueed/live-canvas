import { createFunctionCallHandler } from "@/lib/tool-call-handlers";
import type { LiveFunctionCall } from "@/types/multimodal-live-types";
import {
  type GenerateContentResult,
  GoogleGenerativeAI,
  SchemaType,
} from "@google/generative-ai";
import { MarkdownPlugin } from "@udecode/plate-markdown";
import type { PlateEditor } from "@udecode/plate/react";
import { z } from "zod";
import { COMPLEX_EDIT_SYSTEM_PROMPT } from "../prompts";
import { endTaskOperation } from "./complete-task-ai-function";
import { redoOperation, undoOperation } from "./editor-history-ai-functions";
import {
  getEditorArtifactOperation,
  replaceTextOperation,
  setEditorArtifactOperation,
} from "./editor-text-ai-functions";
import { defineAiFunction } from "./helpers";

const apiKey = process.env.NEXT_PUBLIC_GCP_API_KEY;
if (!apiKey) {
  throw new Error("NEXT_PUBLIC_GCP_API_KEY is not defined.");
}
const genAI = new GoogleGenerativeAI(apiKey);

const PERFORM_COMPLEX_EDIT_FUNCTIONS = [
  getEditorArtifactOperation,
  setEditorArtifactOperation,
  replaceTextOperation,
  undoOperation,
  redoOperation,
  endTaskOperation,
];
const toolDeclarations = PERFORM_COMPLEX_EDIT_FUNCTIONS.map(
  (tool) => tool.declaration,
);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-preview-04-17",
  tools: [{ functionDeclarations: toolDeclarations }],
  systemInstruction: COMPLEX_EDIT_SYSTEM_PROMPT,
});

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
    const initialPrompt = createPrompt(inputPrompt, md);

    const chat = model.startChat({
      history: [],
    });

    const MAX_LOOPS = 3;

    let message = initialPrompt;
    let response: GenerateContentResult | undefined;

    console.log(
      "[performComplexEdit] Starting operation with prompt:",
      inputPrompt,
    );

    for (let i = 0; i < MAX_LOOPS; i++) {
      console.log(`[performComplexEdit] Loop ${i + 1}/${MAX_LOOPS}`);
      console.log("[performComplexEdit] Sending message to model:", message);
      response = await chat.sendMessage(message);
      const functions = getFunctionsFromResponse(response);
      console.log(
        "[performComplexEdit] Received function calls from model:",
        functions,
      );

      const functionCallHandler = createFunctionCallHandler(
        editor,
        PERFORM_COMPLEX_EDIT_FUNCTIONS,
      );

      const functionCallResults = await handleFunctions({
        functions,
        functionCallHandler,
      });

      console.log(
        "[performComplexEdit] Function call results:",
        functionCallResults,
      );

      const hasErrors = functionCallResults.some(
        (result) => result.response.success === false,
      );
      if (hasErrors) {
        console.log(
          "[performComplexEdit] Errors encountered in function calls.",
        );
        const newFunctionCallResponses = setCompleteCallToErrorsDueToOthers({
          functionCallResults,
        });
        message = JSON.stringify(newFunctionCallResponses, null, 2);
      }

      const completeCall = functionCallResults.find(
        (fc) => fc.functionCall.name === endTaskOperation.declaration.name,
      );
      if (completeCall) {
        console.log(
          "[performComplexEdit] Complete task operation found. Returning result:",
          completeCall.response,
        );
        return completeCall.response;
      }

      message = JSON.stringify(functionCallResults, null, 2);
    }

    console.log("[performComplexEdit] Max loops reached. Failing operation.");
    return {
      success: false,
      error: "Failed to complete task.",
    };
  },
});

type HandledFunctionCall = {
  response:
    | ({
        success: true;
      } & unknown)
    | { success: false; error: string };
  functionCall: LiveFunctionCall;
};

const setCompleteCallToErrorsDueToOthers = (args: {
  functionCallResults: HandledFunctionCall[];
}) => {
  const newFunctionCallResponses = args.functionCallResults.map((fc) => {
    if (fc.functionCall.name === endTaskOperation.declaration.name) {
      return {
        ...fc,
        response: { success: false, error: "Other functions failed." },
      };
    }

    return fc;
  });

  return newFunctionCallResponses;
};

const handleFunctions = async (args: {
  functions: LiveFunctionCall[];
  functionCallHandler: ReturnType<typeof createFunctionCallHandler>;
}): Promise<HandledFunctionCall[]> => {
  const functionCallResult = await Promise.all(
    args.functions.map(async (functionCall) => {
      const { response } = await args.functionCallHandler(functionCall);
      return {
        response,
        functionCall,
      };
    }),
  );

  return functionCallResult;
};

const getFunctionsFromResponse = (
  response: GenerateContentResult,
): LiveFunctionCall[] => {
  const calls = response.response.functionCalls() ?? [];
  return calls.map((call) => ({
    ...call,
    id: "dummy-id",
  }));
};

const createPrompt = (inputPrompt: string, md: string) => {
  return `
# Instructions 
${inputPrompt}

# Current artifact:
${md}
`.trim();
};
