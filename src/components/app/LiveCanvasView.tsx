'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useCreateEditor } from '@/components/editor/use-create-editor';
import { Canvas } from '@/components/live-api/Canvas';
import ControlTray from '@/components/live-api/ControlTray';
import SidePanel from '@/components/live-api/SidePanel';
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { useToolCallHandler } from '@/hooks/use-tool-call-handler';
import { createEditorService } from '@/lib/editor-service';
import { FUNCTION_DECLARATIONS, SYSTEM_PROMPT } from '@/lib/prompts';
import { type GenerativeContentBlob, type Part } from '@google/generative-ai';

// Renamed component from LiveCanvasLayout to LiveCanvasView
export function LiveCanvasView() {
  const { client, setConfig } = useLiveAPIContext();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null); // Note: videoStream state is not used, consider removal if unnecessary
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

  const send = useCallback(
    (inputParts: Part | Part[]) => {
      if (!client) return;
      const partsArray = Array.isArray(inputParts) ? inputParts : [inputParts];
      client.send(partsArray, true);
    },
    [client]
  );

  const sendRealtimeInput = useCallback(
    (chunks: GenerativeContentBlob[]) => {
      if (!client) return;
      client.sendRealtimeInput(chunks);
    },
    [client]
  );

  return (
    <div className='flex h-screen max-h-dvh w-screen max-w-dvw overflow-hidden'>
      <div className='flex h-full w-80 flex-col border-r'>
        <SidePanel send={send} editorService={editorService} />
        <ControlTray
          videoRef={videoRef}
          supportsVideo={true}
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
