import { useCallback, useEffect } from "react";

import { AI_FUNCTIONS } from "@/lib/ai-functions/helpers";

import { createFunctionCallHandler } from "@/lib/tool-call-handlers";
import type { LiveServerToolCall } from "@google/genai";
import type { PlateEditor } from "@udecode/plate/react";

import type { GenAILiveClient } from "@/lib/live-ai-client/multimodal-live-client";

interface UseToolCallHandlerProps {
  client: GenAILiveClient;
  editor: PlateEditor;
}

export function useToolCallHandler({
  client,
  editor,
}: UseToolCallHandlerProps) {
  const functionCallHandler = createFunctionCallHandler(editor, AI_FUNCTIONS);

  const onToolCallHandler = useCallback(
    async (toolCall: LiveServerToolCall, argClient: GenAILiveClient) => {
      console.log("Received toolcall:", toolCall);

      if (!toolCall.functionCalls || toolCall.functionCalls.length === 0) {
        console.warn("Received tool call with no function calls");
        return;
      }

      const functionResponses = await Promise.all(
        toolCall.functionCalls.map((fc) => functionCallHandler(fc)),
      );

      argClient.sendToolResponse({ functionResponses });
    },
    [functionCallHandler],
  );

  useEffect(() => {
    if (!client) {
      return;
    }

    const onToolCall = (toolCall: LiveServerToolCall) => {
      onToolCallHandler(toolCall, client);
    };

    client.on("toolcall", onToolCall);

    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client, onToolCallHandler]);
}
