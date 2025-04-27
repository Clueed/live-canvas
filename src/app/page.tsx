'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import Link from 'next/link';

import { useCreateEditor } from '@/components/editor/use-create-editor';
import { Canvas } from '@/components/live-api/Canvas';
import ControlTray from '@/components/live-api/ControlTray';
import SidePanel from '@/components/live-api/SidePanel';
import { LiveAPIProvider, useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { EditorOperationResult, useToolCallHandler } from '@/hooks/use-tool-call-handler';
import { useManagedCanvas } from '@/hooks/useManagedCanvas';
import { createEditorService } from '@/lib/editor-service';
import { FUNCTION_DECLARATIONS, SYSTEM_PROMPT, getEditorArtifact, setEditorArtifact } from '@/lib/prompts';
import { cn } from '@/lib/utils';
import type { ToolCall } from '@/types/multimodal-live-types';
import { type FunctionDeclaration, type GenerativeContentBlob, type Part, SchemaType } from '@google/generative-ai';
import { type MarkdownPlugin } from '@udecode/plate-markdown';
import { type PlateEditor } from '@udecode/plate/react';

const API_KEY = process.env.NEXT_PUBLIC_GCP_API_KEY as string;

const host = 'generativelanguage.googleapis.com';
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

function MainContent() {
  const { client, setConfig } = useLiveAPIContext();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const editor = useCreateEditor();
  const editorService = createEditorService(editor);

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
      tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }]
    });
  }, [setConfig]);

  useToolCallHandler({
    client,
    ...editorService
  });

  // Function to send text/parts to the API
  const send = (inputParts: Part | Part[]) => {
    const partsArray = Array.isArray(inputParts) ? inputParts : [inputParts];
    client.send(partsArray, true);
  };

  // Function to send realtime media chunks (audio/video)
  const sendRealtimeInput = (chunks: GenerativeContentBlob[]) => {
    client.sendRealtimeInput(chunks);
  };

  return (
    <div className='flex h-screen max-h-dvh w-screen max-w-dvw overflow-hidden'>
      <div className='flex h-full w-80 flex-col border-r'>
        <SidePanel send={send} editorService={editorService} />
        <ControlTray
          videoRef={videoRef}
          supportsVideo={true} // Assuming video is supported
          onVideoStreamChange={setVideoStream}
          sendRealtimeInput={sendRealtimeInput}
        />
      </div>
      <main className='flex flex-1 flex-col'>
        <Canvas editor={editor} />
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
