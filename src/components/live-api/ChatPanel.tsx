'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/plate-ui/avatar';
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { useLoggerStore } from '@/lib/store-logger';
import {
  type ClientContentMessage,
  type ModelTurn,
  type RealtimeInputMessage,
  type ServerContentMessage,
  type ToolCallCancellationMessage,
  type ToolResponseMessage,
  isClientContentMessage,
  isModelTurn,
  isRealtimeInputMessage,
  isServerContentMessage,
  isToolCallCancellationMessage,
  isToolResponseMessage,
  isTurnComplete
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

/**
 * ChatPanel - A component that displays conversation messages in a chat-like interface
 *
 * This component processes logs from the LoggerStore and transforms them into a structured
 * chat view with separate bubbles for user and assistant messages. It handles:
 *
 * - Grouping related assistant messages into a single bubble when part of the same turn
 * - Displaying separate message bubbles for each turn in the conversation
 * - Detecting and indicating voice messages with a microphone icon
 * - Auto-scrolling to the latest messages
 * - Displaying appropriate UI when only voice messages (without transcription) are detected
 *
 * The component subscribes to both logs and turn completion events to properly
 * determine message boundaries. It uses timestamps to correlate voice inputs with
 * corresponding text messages and displays them appropriately.
 *
 * Voice messages are detected by scanning for RealtimeInputMessage logs and matching their
 * timestamps with nearby client messages. Messages are grouped by turn completion events,
 * ensuring that streaming responses appear as a single coherent message.
 *
 * @param {string} className - Optional CSS class to apply to the root element
 * @returns {JSX.Element} The chat panel UI displaying conversation messages
 */
export function ChatPanel({ className = '' }: ChatPanelProps) {
  const { client } = useLiveAPIContext();
  const { log, logs } = useLoggerStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const lastTurnCompleteRef = useRef<Date | null>(null);
  const [hasVoiceMessage, setHasVoiceMessage] = useState(false);

  // Subscribe to logs and turn completion events
  useEffect(() => {
    client.on('log', log);

    // Direct listener for turn completion events
    const handleTurnComplete = () => {
      lastTurnCompleteRef.current = new Date();
    };

    client.on('turncomplete', handleTurnComplete);

    return () => {
      client.off('log', log);
      client.off('turncomplete', handleTurnComplete);
    };
  }, [client, log]);

  // Process logs to create chat messages
  useEffect(() => {
    if (!logs) return;

    const processedMessageIds = new Set<string>();
    const chatMessages: ChatMessage[] = [];
    let hasDetectedVoiceMessage = false;

    // Store voice input timestamps and whether they've been matched to a text message
    const voiceMessagesInfo = new Map<number, { date: Date; matched: boolean }>();
    logs.forEach((log) => {
      // Check if the message is the simple string "audio"
      if (log.message === 'audio') {
        const timestamp = log.date.getTime(); // Use precise timestamp
        // console.log('[ChatPanel] Detected voice input (audio string) at:', timestamp, log.date); // Keep commented out for now
        voiceMessagesInfo.set(timestamp, { date: log.date, matched: false });
        hasDetectedVoiceMessage = true;
      }
    });

    setHasVoiceMessage(hasDetectedVoiceMessage);

    // Process text messages and try to match them with voice inputs
    logs.forEach((log) => {
      // Log the raw message structure for debugging
      // console.log('[ChatPanel] Processing log:', log.date, JSON.stringify(log.message)); // Keep commented out

      if (isClientContentMessage(log.message)) {
        const clientContent = (log.message as ClientContentMessage).clientContent;
        const parts = clientContent.turns.flatMap((turn) => turn.parts);
        const text = parts
          .filter((part) => part.text)
          .map((part) => part.text)
          .join('');

        const messageTimestamp = log.date.getTime();

        // console.log('[ChatPanel] Processing user text message:', { timestamp: messageTimestamp, text }); // Keep commented out

        let isVoiceMessage = false;
        let associatedVoiceTimestamp: number | null = null;

        // Find the closest *unmatched* voice message timestamp within a window (e.g., 2 seconds)
        const closestVoiceTimestamp = [...voiceMessagesInfo.keys()]
          .filter((t) => !voiceMessagesInfo.get(t)?.matched) // Only consider unmatched
          .sort((a, b) => Math.abs(a - messageTimestamp) - Math.abs(b - messageTimestamp))[0]; // Find closest

        if (
          closestVoiceTimestamp !== undefined &&
          Math.abs(closestVoiceTimestamp - messageTimestamp) < 2000 // Within 2 seconds
        ) {
          isVoiceMessage = true;
          associatedVoiceTimestamp = closestVoiceTimestamp;
          const voiceInfo = voiceMessagesInfo.get(associatedVoiceTimestamp);
          if (voiceInfo) {
            // console.log(`[ChatPanel] Matched text message at ${messageTimestamp} with voice input at ${associatedVoiceTimestamp}`); // Keep commented out
            voiceInfo.matched = true; // Mark as matched
          }
        } else {
          // console.log(`[ChatPanel] No close unmatched voice input found for text message at ${messageTimestamp}`); // Keep commented out
        }

        if (text.trim() || isVoiceMessage) {
          // Create message if it has text OR it's associated with voice
          const messageId = `user-${log.date.getTime()}`;
          if (processedMessageIds.has(messageId)) return;
          processedMessageIds.add(messageId);

          chatMessages.push({
            role: 'user',
            content: text.trim(), // Store only the text content
            timestamp: log.date,
            id: messageId,
            isVoiceMessage: isVoiceMessage // Mark if associated
          });
          // console.log('[ChatPanel] Adding user message:', chatMessages[chatMessages.length - 1]); // Keep commented out
        }
      } else if (isServerContentMessage(log.message)) {
        const serverContent = (log.message as ServerContentMessage).serverContent;
        if (isModelTurn(serverContent)) {
          // Assistant message processing (remains the same)
          const { modelTurn } = serverContent as ModelTurn;
          const text = modelTurn.parts
            .filter((part) => part.text)
            .map((part) => part.text)
            .join('');

          if (text.trim()) {
            const messageId = `assistant-${log.date.getTime()}`;
            const lastTurnCompleteTime = lastTurnCompleteRef.current?.getTime() ?? 0;
            const shouldStartNewMessage = log.date.getTime() > lastTurnCompleteTime;

            const lastAssistantIndex = [...chatMessages].reverse().findIndex((msg) => msg.role === 'assistant');
            const lastAssistantMessage =
              lastAssistantIndex !== -1 ? chatMessages[chatMessages.length - 1 - lastAssistantIndex] : null;

            if (
              lastAssistantMessage &&
              !shouldStartNewMessage &&
              log.date.getTime() - lastAssistantMessage.timestamp.getTime() < 2000 // Append if recent and no turn completion
            ) {
              // Check if already processed to avoid duplicates from rapid logs
              if (!lastAssistantMessage.id.startsWith(`assistant-${Math.floor(log.date.getTime() / 500)}`)) {
                // Mitigate potential rapid duplicates by comparing rounded timestamps if needed
                // Basic append:
                lastAssistantMessage.content += text;
                // Update timestamp to reflect last activity? Optional.
                // lastAssistantMessage.timestamp = log.date;
              }
            } else {
              if (processedMessageIds.has(messageId)) return;
              processedMessageIds.add(messageId);

              chatMessages.push({
                role: 'assistant',
                content: text,
                timestamp: log.date,
                id: messageId // Use precise timestamp for ID
              });
              // console.log('[ChatPanel] Adding new assistant message:', chatMessages[chatMessages.length - 1]); // Keep commented out
            }
          }
        }
      }
      // --- Add handling for other client-sent messages ---
      else if (log.type.startsWith('client.send')) {
        const messageId = `client-action-${log.date.getTime()}`;
        if (processedMessageIds.has(messageId)) return; // Skip if already processed

        let actionContent = '';

        if (isToolResponseMessage(log.message)) {
          actionContent = '[Sent Tool Response]';
          // Could potentially extract more details, like function names, if needed
          // const functionNames = (log.message as ToolResponseMessage).toolResponse.functionResponses.map(fr => fr.id).join(', ');
          // actionContent = `[Sent Tool Response: ${functionNames}]`;
        } else if (isToolCallCancellationMessage(log.message)) {
          actionContent = '[Cancelled Tool Call]';
          // const cancelledIds = (log.message as ToolCallCancellationMessage).toolCallCancellation.ids.join(', ');
          // actionContent = `[Cancelled Tool Call: ${cancelledIds}]`;
        }
        // Add more 'else if' blocks here for other non-text client message types if needed

        if (actionContent) {
          processedMessageIds.add(messageId);
          chatMessages.push({
            role: 'user', // Display as originating from the user side
            content: actionContent,
            timestamp: log.date,
            id: messageId,
            isVoiceMessage: false // Not a voice message in this context
          });
          // console.log('[ChatPanel] Adding client action message:', chatMessages[chatMessages.length - 1]);
        }
      }
      // --- End of added handling ---
    });

    // Get sorted, unmatched voice message info
    const unmatchedVoiceInfos = [...voiceMessagesInfo.entries()]
      .filter(([, info]) => !info.matched)
      .sort(([tsA], [tsB]) => tsA - tsB); // Sort by timestamp

    // Sort the non-voice messages by timestamp initially
    chatMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Integrate grouped voice messages
    const finalMessages: ChatMessage[] = [];
    let voiceInfoIndex = 0;
    let messageIndex = 0;

    while (messageIndex < chatMessages.length || voiceInfoIndex < unmatchedVoiceInfos.length) {
      const currentMessageTimestamp =
        messageIndex < chatMessages.length ? chatMessages[messageIndex].timestamp.getTime() : Infinity;
      const currentVoiceTimestamp =
        voiceInfoIndex < unmatchedVoiceInfos.length ? unmatchedVoiceInfos[voiceInfoIndex][0] : Infinity;

      if (currentVoiceTimestamp < currentMessageTimestamp) {
        // Start of a potential voice group
        const groupStartTime = currentVoiceTimestamp;
        const groupStartDate = unmatchedVoiceInfos[voiceInfoIndex][1].date;
        let groupEndIndex = voiceInfoIndex;

        // Find the end of this consecutive voice group
        while (
          groupEndIndex + 1 < unmatchedVoiceInfos.length &&
          unmatchedVoiceInfos[groupEndIndex + 1][0] < currentMessageTimestamp
        ) {
          groupEndIndex++;
        }

        // Add a single message for the group
        const messageId = `user-voice-group-${groupStartTime}`;
        if (!processedMessageIds.has(messageId)) {
          // Check processedMessageIds to avoid duplicates if logs repeat
          processedMessageIds.add(messageId);
          finalMessages.push({
            role: 'user',
            content: '', // No text content for standalone voice message
            timestamp: groupStartDate, // Use timestamp of the first message in the group
            id: messageId,
            isVoiceMessage: true
          });
          // console.log(`[ChatPanel] Added voice group starting at: ${groupStartDate.toISOString()}`);
        }

        // Move voice index past this group
        voiceInfoIndex = groupEndIndex + 1;
      } else if (messageIndex < chatMessages.length) {
        // Add the next non-voice message
        finalMessages.push(chatMessages[messageIndex]);
        messageIndex++;
      } else {
        // Should not happen if logic is correct, but break just in case
        break;
      }
    }

    // Set the final, integrated messages
    // console.log('[ChatPanel] Final messages before setting state:', JSON.stringify(finalMessages.map(m => ({ id: m.id, role: m.role, ts: m.timestamp.toISOString(), voice: m.isVoiceMessage }))));
    setMessages(finalMessages);
  }, [logs]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={`flex-1 overflow-auto ${className}`} ref={chatRef}>
      {/* Log the messages state right before rendering */}
      {/* {(() => { console.log('[ChatPanel] Rendering messages:', messages); return null; })()} */}
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
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && (
                <Avatar className='h-7 w-7'>
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[80%] rounded-lg p-2 ${
                  message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                {message.isVoiceMessage && (
                  <div className='mb-1 flex items-center gap-1 text-xs'>
                    <Mic className='h-3 w-3' />
                    {/* Show "Voice message" only if there's also text, otherwise imply via icon */}
                    {message.content ? <span>Voice message</span> : <span>Voice Input</span>}
                  </div>
                )}
                {message.content && ( // Only render text div if content exists
                  <div className='text-sm break-words whitespace-pre-wrap'>{message.content}</div>
                )}
                {/* Display placeholder if it's a voice message without text */}
                {!message.content && message.isVoiceMessage && (
                  <div className='text-sm italic opacity-80'>[Voice input]</div>
                )}
                {/* Display placeholder for client actions */}
                {message.content.startsWith('[Sent') || message.content.startsWith('[Cancelled') ? (
                  <div className='text-sm italic opacity-80'>{message.content}</div>
                ) : null}
                <div className='mt-1 text-xs opacity-70'>{message.timestamp.toLocaleTimeString()}</div>
              </div>
              {message.role === 'user' && (
                <Avatar className='h-7 w-7'>
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
