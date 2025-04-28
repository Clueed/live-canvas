'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useCreateEditor } from '@/components/editor/use-create-editor';
import { Canvas } from '@/components/live-api/Canvas';
import ControlTray from '@/components/live-api/ControlTray';
import { FloatingLoggerPanel } from '@/components/live-api/FloatingLoggerPanel';
import { FloatingTestPanel } from '@/components/live-api/FloatingTestPanel';
import SidePanel from '@/components/live-api/SidePanel';
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { useToolCallHandler } from '@/hooks/use-tool-call-handler';
import { TOOL_CALL_FUNCTIONS } from '@/lib/editor';
import { SYSTEM_PROMPT } from '@/lib/prompts';
import { type GenerativeContentBlob, type Part } from '@google/generative-ai';

// Renamed component from LiveCanvasLayout to LiveCanvasView
export function LiveCanvasView() {
  const { client, setConfig } = useLiveAPIContext();

  const editor = useCreateEditor();

  const [showTestPanel, setShowTestPanel] = useState(false);
  const [showLoggerPanel, setShowLoggerPanel] = useState(false);

  const toggleTestPanel = useCallback(() => setShowTestPanel((prev) => !prev), []);
  const toggleLoggerPanel = useCallback(() => setShowLoggerPanel((prev) => !prev), []);

  const functionDeclarations = useMemo(() => TOOL_CALL_FUNCTIONS.map((f) => f.declaration), []);

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
      tools: [{ functionDeclarations: functionDeclarations }]
    });
  }, [setConfig, functionDeclarations, SYSTEM_PROMPT]);

  useToolCallHandler({
    client,
    editor
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
        <SidePanel send={send} editor={editor} />
        <ControlTray
          sendRealtimeInput={sendRealtimeInput}
          onToggleTestPanel={toggleTestPanel}
          onToggleLoggerPanel={toggleLoggerPanel}
          isTestPanelOpen={showTestPanel}
          isLoggerPanelOpen={showLoggerPanel}
        />
      </div>
      <main className='flex flex-1 flex-col'>
        <Canvas editor={editor} />
      </main>
      <FloatingTestPanel show={showTestPanel} onClose={toggleTestPanel} editor={editor} />
      <FloatingLoggerPanel show={showLoggerPanel} onClose={toggleLoggerPanel} />
    </div>
  );
}
