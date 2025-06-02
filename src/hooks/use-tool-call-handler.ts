import { useCallback, useEffect } from "react";

import { AI_FUNCTIONS } from "@/lib/ai-functions/helpers";
import type { ToolCall } from "@/lib/live-ai-client/multimodal-live-types";
import type { MultimodalLiveClient } from "@/lib/multimodal-live-client";
import { createFunctionCallHandler } from "@/lib/tool-call-handlers";
import type { PlateEditor } from "@udecode/plate/react";

interface UseToolCallHandlerProps {
  client: MultimodalLiveClient;
  editor: PlateEditor;
}

export function useToolCallHandler({
  client,
  editor,
}: UseToolCallHandlerProps) {
  const functionCallHandler = createFunctionCallHandler(editor, AI_FUNCTIONS);

  const onToolCallHandler = useCallback(
    async (toolCall: ToolCall, argClient: MultimodalLiveClient) => {
      console.log("Received toolcall:", toolCall);

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

    const onToolCall = (toolCall: ToolCall) => {
      onToolCallHandler(toolCall, client);
    };

    client.on("toolcall", onToolCall);

    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client, onToolCallHandler]);
}
