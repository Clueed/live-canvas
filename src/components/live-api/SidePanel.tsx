"use client";

import type React from "react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLiveAPIContext } from "@/contexts/LiveAPIContext";
import { cn } from "@/utils/cn";
import type { Part } from "@google/genai";
import type { PlateEditor } from "@udecode/plate/react";

import { Send } from "lucide-react";

interface SidePanelProps {
  send: (parts: Part | Part[]) => void;
  editor: PlateEditor;
}

export default function SidePanel({ send, editor }: SidePanelProps) {
  const { connected } = useLiveAPIContext();
  const [textInput, setTextInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!textInput.trim() || !connected) return;
    send([{ text: textInput }]);
    setTextInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit();
    }
  };

  return (
    <div className="flex h-full max-h-full w-80 flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b p-1 px-4">
        <h2 className="text-lg font-semibold">NORI</h2>
      </header>

      {/* <ChatPanel /> */}

      <div
        className={cn(
          "mt-auto p-3",
          !connected && "pointer-events-none opacity-50",
        )}
      >
        <div className="relative flex items-end gap-2">
          <Textarea
            ref={inputRef}
            placeholder={
              connected ? "Type something..." : "Connect to send messages"
            }
            className="min-h-[40px] flex-1 resize-none pr-12"
            rows={1}
            onKeyDown={handleKeyDown}
            onChange={(e) => setTextInput(e.target.value)}
            value={textInput}
            disabled={!connected}
            aria-label="Message input"
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-1.5 bottom-1.5 h-7 w-7"
            onClick={handleSubmit}
            disabled={!connected || !textInput.trim()}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
