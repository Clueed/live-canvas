'use client';

import { useEffect, useRef, useState } from 'react';

import {
  type ClientContentMessage,
  type ModelTurn,
  type ServerContentMessage,
  type StreamingLog,
  type ToolCallCancellationMessage,
  type ToolResponseMessage,
  isClientContentMessage,
  isModelTurn,
  isServerContentMessage,
  isToolCallCancellationMessage,
  isToolResponseMessage
} from '@/types/multimodal-live-types';

// Simple interface that captures the minimum needed functionality
interface LiveClient {
  on(event: string, listener: any): any;
  off(event: string, listener: any): any;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  id: string; // Unique message ID
  isVoiceMessage?: boolean; // Flag for voice messages
}

interface UseChatMessagesProps {
  client: LiveClient;
  log: (log: StreamingLog) => void;
  logs: StreamingLog[];
}

export function useChatMessages({ client, log, logs }: UseChatMessagesProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const lastTurnCompleteRef = useRef<Date | null>(null);

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
    if (!logs) {
      setMessages([]);

      return;
    }

    const processedMessageIds = new Set<string>();
    const chatMessages: ChatMessage[] = [];

    // Store voice input timestamps and whether they've been matched to a text message
    const voiceMessagesInfo = new Map<number, { date: Date; matched: boolean }>();
    logs.forEach((logEntry) => {
      if (logEntry.message === 'audio') {
        const timestamp = logEntry.date.getTime(); // Use precise timestamp
        voiceMessagesInfo.set(timestamp, { date: logEntry.date, matched: false });
      }
    });

    // Process text messages and try to match them with voice inputs
    logs.forEach((logEntry) => {
      if (isClientContentMessage(logEntry.message)) {
        const clientContent = (logEntry.message as ClientContentMessage).clientContent;
        const parts = clientContent.turns.flatMap((turn) => turn.parts);
        const text = parts
          .filter((part) => part.text)
          .map((part) => part.text)
          .join('');

        const messageTimestamp = logEntry.date.getTime();

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
            voiceInfo.matched = true; // Mark as matched
          }
        }

        if (text.trim() || isVoiceMessage) {
          // Create message if it has text OR it's associated with voice
          const messageId = `user-${logEntry.date.getTime()}`;
          if (processedMessageIds.has(messageId)) return;
          processedMessageIds.add(messageId);

          chatMessages.push({
            role: 'user',
            content: text.trim(), // Store only the text content
            timestamp: logEntry.date,
            id: messageId,
            isVoiceMessage: isVoiceMessage // Mark if associated
          });
        }
      } else if (isServerContentMessage(logEntry.message)) {
        const serverContent = (logEntry.message as ServerContentMessage).serverContent;
        if (isModelTurn(serverContent)) {
          // Assistant message processing
          const { modelTurn } = serverContent as ModelTurn;
          const text = modelTurn.parts
            .filter((part) => part.text)
            .map((part) => part.text)
            .join('');

          if (text.trim()) {
            const messageId = `assistant-${logEntry.date.getTime()}`;
            const lastTurnCompleteTime = lastTurnCompleteRef.current?.getTime() ?? 0;
            const shouldStartNewMessage = logEntry.date.getTime() > lastTurnCompleteTime;

            const lastAssistantIndex = [...chatMessages].reverse().findIndex((msg) => msg.role === 'assistant');
            const lastAssistantMessage =
              lastAssistantIndex !== -1 ? chatMessages[chatMessages.length - 1 - lastAssistantIndex] : null;

            if (
              lastAssistantMessage &&
              !shouldStartNewMessage &&
              logEntry.date.getTime() - lastAssistantMessage.timestamp.getTime() < 2000 // Append if recent and no turn completion
            ) {
              // Basic append:
              lastAssistantMessage.content += text;
            } else {
              if (processedMessageIds.has(messageId)) return;
              processedMessageIds.add(messageId);

              chatMessages.push({
                role: 'assistant',
                content: text,
                timestamp: logEntry.date,
                id: messageId // Use precise timestamp for ID
              });
            }
          }
        }
      }
      // --- Add handling for other client-sent messages ---
      else if (logEntry.type.startsWith('client.send')) {
        const messageId = `client-action-${logEntry.date.getTime()}`;
        if (processedMessageIds.has(messageId)) return; // Skip if already processed

        let actionContent = '';

        if (isToolResponseMessage(logEntry.message)) {
          actionContent = '[Sent Tool Response]';
        } else if (isToolCallCancellationMessage(logEntry.message)) {
          actionContent = '[Cancelled Tool Call]';
        }

        if (actionContent) {
          processedMessageIds.add(messageId);
          chatMessages.push({
            role: 'user',
            content: actionContent,
            timestamp: logEntry.date,
            id: messageId,
            isVoiceMessage: false
          });
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
          processedMessageIds.add(messageId);
          finalMessages.push({
            role: 'user',
            content: '',
            timestamp: groupStartDate,
            id: messageId,
            isVoiceMessage: true
          });
        }

        voiceInfoIndex = groupEndIndex + 1;
      } else if (messageIndex < chatMessages.length) {
        finalMessages.push(chatMessages[messageIndex]);
        messageIndex++;
      } else {
        break;
      }
    }

    setMessages(finalMessages);
  }, [logs, client, log]);

  return { messages };
}
