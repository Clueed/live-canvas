import { useCallback, useEffect } from 'react';

import { type MultimodalLiveClient } from '@/lib/multimodal-live-client';
import { SYSTEM_PROMPT } from '@/lib/prompts';
import { createFunctionCallHandler } from '@/lib/tool-call-handlers';
import { type ToolCall } from '@/types/multimodal-live-types';

interface UseToolCallHandlerProps {
    client: MultimodalLiveClient;
    updateCanvasText: (text: string, isUserUpdate: boolean) => void;
    canvasText: string;
    undo: () => void;
    redo: () => void;
}

export function useToolCallHandler({ client, updateCanvasText, canvasText, undo, redo }: UseToolCallHandlerProps) {
    const functionCallHandler = useCallback(createFunctionCallHandler({ canvasText, updateCanvasText, undo, redo }), [
        canvasText,
        updateCanvasText,
        undo,
        redo
    ]);

    const onToolCallHandler = useCallback(
        (toolCall: ToolCall, argClient: MultimodalLiveClient) => {
            console.log(`Received toolcall:`, toolCall);

            const functionResponses = toolCall.functionCalls.map((fc) => functionCallHandler(fc));

            argClient.sendToolResponse({ functionResponses });
        },
        [functionCallHandler]
    );

    useEffect(() => {
        if (!client) {
            return;
        }

        const onToolCall = (toolCall: ToolCall) => {
            onToolCallHandler(toolCall, client);
        };

        client.on('toolcall', onToolCall);

        return () => {
            client.off('toolcall', onToolCall);
        };
    }, [client, onToolCallHandler]);
}
