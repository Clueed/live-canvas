'use client';

import React, { useEffect, useRef } from 'react';

import { Avatar, AvatarFallback } from '@/components/plate-ui/avatar';
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useLoggerStore } from '@/lib/store-logger';
import type {
  ClientContentMessage,
  ModelTurn,
  RealtimeInputMessage,
  ServerContentMessage,
  ToolCallCancellationMessage,
  ToolResponseMessage
} from '@/types/multimodal-live-types';

import { Mic } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
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
export function ChatPanel({ className = '' }: ChatPanelProps) {
  const { client } = useLiveAPIContext();
  const { log, logs } = useLoggerStore();
  const { messages, hasVoiceMessage } = useChatMessages({ client, log, logs });
  const chatRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={`flex-1 overflow-auto ${className}`} ref={chatRef}>
      {messages.length === 0 ? (
        <div className='text-muted-foreground flex h-20 items-center justify-center text-sm'>
          {hasVoiceMessage ? (
            <div className='flex flex-col items-center'>
              <div className='mb-1 flex items-center gap-1'>
                <Mic className='h-4 w-4' />
                <span>Voice message detected</span>
              </div>
              <span className='text-xs'>No transcription available</span>
            </div>
          ) : (
            'No conversation messages yet.'
          )}
        </div>
      ) : (
        <div className='flex flex-col gap-4 p-3'>
          {messages.map((message) => {
            if (message.role === 'user') {
              return <UserMessage key={message.id} message={message} />;
            }
            if (message.role === 'assistant') {
              return <AssistantMessage key={message.id} message={message} />;
            }

            return null; // Should not happen based on current logic
          })}
        </div>
      )}
    </div>
  );
}

function UserMessage({ message }: MessageProps) {
  return (
    <div key={message.id} className='flex justify-end gap-3'>
      <div className='bg-primary text-primary-foreground max-w-[80%] rounded-lg p-2'>
        {message.isVoiceMessage && (
          <div className='mb-1 flex items-center gap-1 text-xs'>
            <Mic className='h-3 w-3' />
            {message.content ? <span>Voice message</span> : <span>Voice Input</span>}
          </div>
        )}
        {message.content && // Only render text div if content exists
          !message.content.startsWith('[') && ( // Don't show placeholder text like "[Sent Tool Response]" here
            <div className='text-sm break-words whitespace-pre-wrap'>{message.content}</div>
          )}
        {!message.content && message.isVoiceMessage && <div className='text-sm italic opacity-80'>[Voice input]</div>}
        {/* Display placeholder for client actions */}
        {(message.content.startsWith('[Sent') || message.content.startsWith('[Cancelled')) && (
          <div className='text-sm italic opacity-80'>{message.content}</div>
        )}
        <div className='mt-1 text-xs opacity-70'>{message.timestamp.toLocaleTimeString()}</div>
      </div>
      <Avatar className='h-7 w-7'>
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    </div>
  );
}

function AssistantMessage({ message }: MessageProps) {
  return (
    <div key={message.id} className='flex justify-start gap-3'>
      <Avatar className='h-7 w-7'>
        <AvatarFallback>AI</AvatarFallback>
      </Avatar>
      <div className='bg-muted max-w-[80%] rounded-lg p-2'>
        {message.content && ( // Only render text div if content exists
          <div className='text-sm break-words whitespace-pre-wrap'>{message.content}</div>
        )}
        <div className='mt-1 text-xs opacity-70'>{message.timestamp.toLocaleTimeString()}</div>
      </div>
    </div>
  );
}
