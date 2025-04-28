"use client";

import { useEffect, useRef } from "react";

import { useLiveAPIContext } from "@/contexts/LiveAPIContext";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useLoggerStore } from "@/lib/store-logger";
import { cn } from "@/lib/utils";

import { AudioLinesIcon, BotIcon, MicIcon, UserIcon } from "lucide-react";

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
  message: ChatMessage;
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
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={cn("flex-1 overflow-auto", className)} ref={chatRef}>
      {messages.length === 0 ? (
        <div className="text-muted-foreground flex h-20 items-center justify-center text-sm">
          {"No conversation messages yet."}
        </div>
      ) : (
        <div className="flex flex-col gap-4 p-3">
          {messages.map((message) => {
            if (message.role === "user") {
              return <UserMessage key={message.id} message={message} />;
            }
            if (message.role === "assistant") {
              return <AssistantMessage key={message.id} message={message} />;
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}

function UserMessage({ message }: MessageProps) {
  return (
    <div key={message.id} className="flex justify-end gap-3">
      <div className="bg-muted max-w-[80%] rounded-lg p-4">
        {message.content && (
          <div className="text-sm break-words whitespace-pre-wrap">
            {message.content}
          </div>
        )}
        {!message.content && message.isVoiceMessage && (
          <div className="text-sm opacity-80">
            <AudioLinesIcon className="h-4 w-20" />
          </div>
        )}
      </div>
      <div className="bg-muted flex h-7 w-7 items-center justify-center rounded-full">
        <UserIcon className="text-muted-foreground h-4 w-4" />
      </div>
    </div>
  );
}

function AssistantMessage({ message }: MessageProps) {
  return (
    <div key={message.id} className="flex justify-start gap-3">
      <div className="bg-muted flex h-7 w-7 items-center justify-center rounded-full">
        <BotIcon className="text-muted-foreground h-4 w-4" />
      </div>
      <div className="bg-primary text-primary-foreground max-w-[80%] rounded-lg p-4">
        {message.content && (
          <div className="text-sm break-words whitespace-pre-wrap">
            {message.content}
          </div>
        )}
      </div>
    </div>
  );
}
