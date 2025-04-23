import { use, useCallback, useEffect } from 'react';

import { type MultimodalLiveClient } from '@/lib/multimodal-live-client';
import { SYSTEM_PROMPT, getEditorArtifact, setEditorArtifact } from '@/lib/prompts';
import { type LiveFunctionCall, type ToolCall, type ToolResponseMessage } from '@/types/multimodal-live-types';
import type { FunctionCall } from '@google/generative-ai';

interface UseToolCallHandlerProps {
    client: MultimodalLiveClient;
    updateCanvasText: (text: string, isUserUpdate: boolean) => void;
    canvasText: string;
}

export function useToolCallHandler({ client, updateCanvasText, canvasText }: UseToolCallHandlerProps) {
    const functionCallHandler = useCallback(
        (fc: LiveFunctionCall) => {
            switch (fc.name) {
                case setEditorArtifact.name: {
                    const args = fc.args as { text?: string };
                    if (typeof args?.text === 'string') {
                        updateCanvasText(args.text, false);

                        return {
                            response: { output: { success: true } },
                            id: fc.id
                        };
                    } else {
                        return {
                            response: { output: { success: false, error: 'Invalid arguments' } },
                            id: fc.id
                        };
                    }
                }
                case getEditorArtifact.name: {
                    return {
                        response: { success: true, artifact: canvasText },
                        id: fc.id
                    };
                }

                default: {
                    console.warn(`Unknown function call: ${fc.name}`);

                    return {
                        response: { success: false, error: 'Unknown function call' },
                        id: fc.id
                    };
                }
            }
        },
        [canvasText, updateCanvasText]
    );

    const onToolCallHandler = useCallback(
        (toolCall: ToolCall, argClient: MultimodalLiveClient) => {
            console.log(`[Page] Received toolcall:`, toolCall);

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
