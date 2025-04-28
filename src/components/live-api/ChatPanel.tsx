"use client";

import { useEffect, useRef } from "react";

import { useLiveAPIContext } from "@/contexts/LiveAPIContext";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useLoggerStore } from "@/lib/store-logger";
import { cn } from "@/lib/utils";

import { AudioLinesIcon } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  id: string; // Unique message ID
  isVoiceMessage?: boolean; // Flag for voice messages
}

interface ChatPanelProps {
  className?: string;
}

interface MessageProps {
  role: "user" | "assistant";
  children: React.ReactNode;
}

/**
 * ChatPanel - A component that displays conversation messages in a chat-like interface
 *             using the useChatMessages hook for logic.
 *
 * @param {string} className - Optional CSS class to apply to the root element
 * @returns {JSX.Element} The chat panel UI displaying conversation messages
 */
export function ChatPanel({ className = "" }: ChatPanelProps) {
  const { client } = useLiveAPIContext();
  const { log, logs } = useLoggerStore();
  const { messages } = useChatMessages({
    client: client,
    log,
    logs,
  });
  const chatRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages update
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps for events
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={cn("flex-1 overflow-auto", className)} ref={chatRef}>
      {messages.length === 0 ? (
        <div className="text-base-11 flex h-20 items-center justify-center text-sm">
          {"No conversation messages yet."}
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-3">
          {messages.map((message) => (
            <Message key={message.id} role={message.role}>
              {message.content && message.content}
              {message.isVoiceMessage && (
                <div className="flex items-center gap-2">
                  <AudioLinesIcon className="size-[2cap]" />
                  <span className="sr-only">Voice message</span>
                </div>
              )}
            </Message>
          ))}
        </div>
      )}
    </div>
  );
}

function Message({ role, children }: MessageProps) {
  return (
    <div
      className={cn("flex", role === "user" ? "justify-end" : "justify-start")}
    >
      <div className="bg-base-2 max-w-[80%] rounded-md p-2 text-xs break-words whitespace-pre-wrap">
        {children}
      </div>
    </div>
  );
}
