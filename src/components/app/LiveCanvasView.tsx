"use client";

import { Canvas } from "@/components/live-api/Canvas";
import ControlTray from "@/components/live-api/ControlTray";
import { FloatingLoggerPanel } from "@/components/live-api/FloatingLoggerPanel";
import { FloatingTestPanel } from "@/components/live-api/FloatingTestPanel";
import SidePanel from "@/components/live-api/SidePanel";
import { useLiveAPIContext } from "@/contexts/LiveAPIContext";
import { useToolCallHandler } from "@/hooks/use-tool-call-handler";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AI_FUNCTIONS } from "@/lib/ai-functions/helpers";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import type { Part } from "@google/genai";
import { Modality } from "@google/genai";
import { usePlateEditor } from "@udecode/plate/react";

export function LiveCanvasView() {
  const { client, setConfig } = useLiveAPIContext();

  const editor = usePlateEditor();

  const [showTestPanel, setShowTestPanel] = useState(false);
  const [showLoggerPanel, setShowLoggerPanel] = useState(false);

  const toggleTestPanel = useCallback(
    () => setShowTestPanel((prev) => !prev),
    [],
  );
  const toggleLoggerPanel = useCallback(
    () => setShowLoggerPanel((prev) => !prev),
    [],
  );

  const functionDeclarations = useMemo(
    () => AI_FUNCTIONS.map((f) => f.declaration),
    [],
  );

  useEffect(() => {
    setConfig({
      responseModalities: [Modality.TEXT],
      systemInstruction: {
        parts: [
          {
            text: SYSTEM_PROMPT,
          },
        ],
      },
      tools: [{ functionDeclarations: functionDeclarations }],
    });
  }, [setConfig, functionDeclarations]);

  useToolCallHandler({
    client,
    editor,
  });

  const send = useCallback(
    (inputParts: Part | Part[]) => {
      if (!client) return;
      const partsArray = Array.isArray(inputParts) ? inputParts : [inputParts];
      client.send(partsArray, true);
    },
    [client],
  );

  const sendRealtimeInput = useCallback(
    (chunks: Array<{ mimeType: string; data: string }>) => {
      if (!client) return;
      client.sendRealtimeInput(chunks);
    },
    [client],
  );

  return (
    <div className="flex h-screen max-h-dvh w-screen max-w-dvw overflow-hidden">
      <div className="flex h-full w-80 flex-col border-r">
        <SidePanel send={send} editor={editor} />
        <ControlTray
          sendRealtimeInput={sendRealtimeInput}
          onToggleTestPanel={toggleTestPanel}
          onToggleLoggerPanel={toggleLoggerPanel}
          isTestPanelOpen={showTestPanel}
          isLoggerPanelOpen={showLoggerPanel}
        />
      </div>
      <main className="flex flex-1 flex-col">
        <Canvas editor={editor} />
      </main>
      <FloatingTestPanel
        show={showTestPanel}
        onClose={toggleTestPanel}
        editor={editor}
      />
      <FloatingLoggerPanel show={showLoggerPanel} onClose={toggleLoggerPanel} />
    </div>
  );
}
