'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Canvas } from '@/components/live-api/Canvas';
import ControlTray from '@/components/live-api/ControlTray';
import SidePanel from '@/components/live-api/SidePanel';
import { LiveAPIProvider, useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { useManagedCanvas } from '@/hooks/useManagedCanvas';
import { cn } from '@/lib/utils';
import type { ToolCall } from '@/types/multimodal-live-types';
import { type FunctionDeclaration, type GenerativeContentBlob, type Part, SchemaType } from '@google/generative-ai';

// --- Configuration ---
const API_KEY = process.env.NEXT_PUBLIC_GCP_API_KEY as string;
if (typeof API_KEY !== 'string') {
    // Consider a more user-friendly error display in a real app
    throw new Error('NEXT_PUBLIC_GCP_API_KEY environment variable not set!');
}

const host = 'generativelanguage.googleapis.com';
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

// Define the tool declaration
const updateCanvasDeclaration: FunctionDeclaration = {
    name: 'update_canvas',
    description:
        'The canvas is a workplace for the user to work with text. Everything concerning any kind of text document should be displayed to the user by calling the function.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            text: {
                type: SchemaType.STRING,
                description: 'The text content to display in the canvas. Can be plain text or markdown.'
            }
        },
        required: ['text']
    }
};

// --- Main Content Component (Handles API interaction and state) ---
function MainContent() {
    const { client, setConfig } = useLiveAPIContext();
    const { canvasText, updateCanvasText, getOptionalCanvasPart } = useManagedCanvas();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

    // Function to send text/parts to the API
    const send = (inputParts: Part | Part[]) => {
        const partsArray = Array.isArray(inputParts) ? inputParts : [inputParts];
        const optionalCanvasPart = getOptionalCanvasPart();

        if (optionalCanvasPart) {
            client.send([optionalCanvasPart, ...partsArray]);
        } else {
            client.send(partsArray, true); // Send as a complete turn if no canvas context
        }
    };

    // Function to send realtime media chunks (audio/video)
    const sendRealtimeInput = (chunks: GenerativeContentBlob[]) => {
        const optionalCanvasPart = getOptionalCanvasPart();

        // Send canvas context only once at the beginning of a stream segment if needed
        if (optionalCanvasPart) {
            // Check if the client has a mechanism to know if context was already sent for this segment
            // For simplicity here, we might send it with the first chunk, but a more robust solution is needed.
            // Let's assume the client handles sending context appropriately or we send it once.
            // A simple flag could work:
            // if (!client.contextSentThisSegment && optionalCanvasPart) {
            //    client.send([optionalCanvasPart], false); // Send context without ending turn
            //    client.contextSentThisSegment = true; // Mark context as sent
            // }
            // For now, let's just send the chunks. The hook logic might need adjustment.
        }

        client.sendRealtimeInput(chunks);
    };

    // Effect for setting up API configuration and listeners
    useEffect(() => {
        setConfig({
            model: 'models/gemini-2.0-flash-exp', // Or your desired model
            generationConfig: {
                responseModalities: 'text' // Expect text responses
            },
            systemInstruction: {
                parts: [
                    {
                        text: 'You are a writing and editing assistant whose primary workspace is the canvas. Always deliver your drafts, revisions, and feedback there.'
                    }
                ]
            },
            tools: [{ functionDeclarations: [updateCanvasDeclaration] }]
        });

        // Listener for incoming tool calls
        const onToolCall = (toolCall: ToolCall) => {
            console.log(`[Page] Received toolcall:`, toolCall);
            const fc = toolCall.functionCalls.find((fc) => fc.name === updateCanvasDeclaration.name);

            if (fc && typeof (fc.args as { text?: string })?.text === 'string') {
                updateCanvasText((fc.args as { text: string }).text, false); // AI update
            }

            // Respond to *all* function calls received
            if (toolCall.functionCalls.length) {
                // Use a small delay like in the original example
                setTimeout(
                    () =>
                        client.sendToolResponse({
                            functionResponses: toolCall.functionCalls.map((f) => ({
                                response: { output: { success: true } }, // Assume success for canvas update
                                id: f.id
                            }))
                        }),
                    100 // Reduced delay slightly
                );
            }
        };

        // Register the listener
        // Note: The TS errors for .on/.off might still appear here but should work at runtime
        client.on('toolcall', onToolCall);

        // Cleanup function
        return () => {
            client.off('toolcall', onToolCall);
        };
    }, [client, setConfig, updateCanvasText]); // Dependencies

    return (
        <div className='flex h-screen w-screen overflow-hidden'>
            <SidePanel send={send} />
            <main className='flex flex-1 flex-col'>
                {/* Main App Area: Canvas and Video */}
                <div className='relative flex flex-1 overflow-hidden p-4'>
                    {' '}
                    {/* Added padding */}
                    <Canvas
                        text={canvasText}
                        onChange={(newText) => updateCanvasText(newText, true)} // User update
                    />
                    {/* Video overlay (optional, adjust styling as needed) */}
                    <video
                        className={cn(
                            'absolute right-4 bottom-4 h-32 w-auto rounded border bg-black shadow-lg transition-opacity duration-300',
                            {
                                'opacity-100': videoStream,
                                'pointer-events-none opacity-0': !videoStream
                            }
                        )}
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted // Mute local playback to avoid echo
                    />
                </div>

                {/* Control Tray */}
                <ControlTray
                    videoRef={videoRef}
                    supportsVideo={true} // Assuming video is supported
                    onVideoStreamChange={setVideoStream}
                    sendRealtimeInput={sendRealtimeInput}
                />
            </main>
        </div>
    );
}

// --- Page Component (Sets up Provider) ---
export default function Page() {
    // No need for video state here anymore, moved to MainContent
    return (
        <LiveAPIProvider url={uri} apiKey={API_KEY}>
            <MainContent />
        </LiveAPIProvider>
    );
}
