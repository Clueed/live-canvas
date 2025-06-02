// @ts-nocheck

import type { LiveFunctionCall } from "@/lib/live-ai-client/multimodal-live-types";
import { tryCatchAsync } from "@/utils/try-catch";
import type { GenerateContentResult, GenerativeModel } from "@google/genai";
import { MarkdownPlugin } from "@udecode/plate-markdown";
import type { PlateEditor } from "@udecode/plate/react";
import type { ZodTypeAny } from "zod";
import { createFunctionCallHandler } from "../tool-call-handlers";
import { endTaskOperation } from "./complete-task-ai-function";
import type { AiFunction, AiFunctionResponse } from "./helpers";

// TODO: make generic
// instead of passing the actual gemini object, it's probably better to abstract to
// .sendMessage and lift all the config up to be passed an deps
// we can also anticipate the response of functions being handeled differently to the sendMessage object should have a text and an function response argument (the serialization of function respones can be handled else where --- by a future native libary of as json like it is now)
// this way system prompt, tool declarations, and function declarations can be handled before this function is called
interface GeminiAgentArgs<TSchema extends ZodTypeAny> {
  editor: PlateEditor;
  inputPrompt: string;
  model: GenerativeModel;
  aiFunctions: AiFunction<TSchema>[];
}

export const geminiAgent = async <TSchema extends ZodTypeAny>(
  args: GeminiAgentArgs<TSchema>,
) => {
  const toolDeclarations = args.aiFunctions.map((tool) => tool.declaration);
  const chat = args.model.startChat({
    history: [],
  });

  const md = args.editor.getApi(MarkdownPlugin).markdown.serialize();
  const initialPrompt = createPrompt(args.inputPrompt, md);

  const MAX_LOOPS = 3;

  let message = initialPrompt;
  let response: GenerateContentResult | undefined;

  console.log(
    "[performComplexEdit] Starting operation with prompt:",
    args.inputPrompt,
  );

  for (let i = 0; i < MAX_LOOPS; i++) {
    console.log(`[performComplexEdit] Loop ${i + 1}/${MAX_LOOPS}`);
    console.log("[performComplexEdit] Sending message to model:", message);
    const result = await tryCatchAsync(() => chat.sendMessage(message));

    if (!result.success) {
      return {
        success: false,
        error: `${result.error.name}: ${result.error.message}`,
      };
    }

    const response = result.data;

    if (!response) {
      return {
        success: false,
        error: "No response received from the model.",
      };
    }
    const functions = getFunctionsFromResponse(response);
    console.log(
      "[performComplexEdit] Received function calls from model:",
      functions,
    );

    const functionCallHandler = createFunctionCallHandler(
      args.editor,
      args.aiFunctions,
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
      console.log("[performComplexEdit] Errors encountered in function calls.");
      const newFunctionCallResponses = setCompleteCallToErrorsDueToOthers({
        functionCallResults,
      });
      message = JSON.stringify(newFunctionCallResponses, null, 2);
      // Continue the loop to send error feedback
      continue;
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
    error: "Failed to complete task within the maximum loop limit.",
  };
};

type HandledFunctionCall<Response = unknown | undefined> = {
  response: Awaited<AiFunctionResponse<Response>>;
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
