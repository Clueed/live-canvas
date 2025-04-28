import { useCallback, useEffect } from "react";

import type { MultimodalLiveClient } from "@/lib/multimodal-live-client";
import { createFunctionCallHandler } from "@/lib/tool-call-handlers";
import type { ToolCall } from "@/types/multimodal-live-types";
import type { PlateEditor } from "@udecode/plate/react";

interface UseToolCallHandlerProps {
  client: MultimodalLiveClient;
  editor: PlateEditor;
}

export function useToolCallHandler({
  client,
  editor,
}: UseToolCallHandlerProps) {
  const functionCallHandler = createFunctionCallHandler(editor);

  const onToolCallHandler = useCallback(
    (toolCall: ToolCall, argClient: MultimodalLiveClient) => {
      console.log("Received toolcall:", toolCall);

      const functionResponses = toolCall.functionCalls.map((fc) =>
        functionCallHandler(fc),
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
