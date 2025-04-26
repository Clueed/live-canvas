'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Canvas } from '@/components/live-api/Canvas';
import ControlTray from '@/components/live-api/ControlTray';
import SidePanel from '@/components/live-api/SidePanel';
import { LiveAPIProvider, useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { useToolCallHandler } from '@/hooks/use-tool-call-handler';
import { useManagedCanvas } from '@/hooks/useManagedCanvas';
import { SYSTEM_PROMPT, getEditorArtifact, setEditorArtifact } from '@/lib/prompts';
import { cn } from '@/lib/utils';
import type { ToolCall } from '@/types/multimodal-live-types';
import { type FunctionDeclaration, type GenerativeContentBlob, type Part, SchemaType } from '@google/generative-ai';

const API_KEY = process.env.NEXT_PUBLIC_GCP_API_KEY as string;

const host = 'generativelanguage.googleapis.com';
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

// --- Main Content Component (Handles API interaction and state) ---
function MainContent() {
    const { client, setConfig } = useLiveAPIContext();
    const { canvasText, updateCanvasText, getOptionalCanvasPart } = useManagedCanvas();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        setConfig({
            model: 'models/gemini-2.0-flash-exp',
            generationConfig: {
                responseModalities: 'text'
            },
            systemInstruction: {
                parts: [
                    {
                        text: SYSTEM_PROMPT
                    }
                ]
            },
            tools: [{ functionDeclarations: [setEditorArtifact, getEditorArtifact] }]
        });
    }, [setConfig]);

    useToolCallHandler({ client, updateCanvasText, canvasText });

    // Function to send text/parts to the API
    const send = (inputParts: Part | Part[]) => {
        const partsArray = Array.isArray(inputParts) ? inputParts : [inputParts];
        const optionalCanvasPart = getOptionalCanvasPart();

        if (optionalCanvasPart) {
            client.send([optionalCanvasPart, ...partsArray]);
        } else {
            client.send(partsArray, true);
        }
    };

    // Function to send realtime media chunks (audio/video)
    const sendRealtimeInput = (chunks: GenerativeContentBlob[]) => {
        const optionalCanvasPart = getOptionalCanvasPart();

        if (optionalCanvasPart) {
            client.send([optionalCanvasPart], false);
        }

        client.sendRealtimeInput(chunks);
    };

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

export default function Page() {
    return (
        <LiveAPIProvider url={uri} apiKey={API_KEY}>
            <MainContent />
        </LiveAPIProvider>
    );
}
