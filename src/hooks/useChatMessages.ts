"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { MultimodalLiveClient } from "@/lib/multimodal-live-client";
import type { StreamingLog } from "@/types/multimodal-live-types";
import {
  type ChatMessage,
  extractVoiceMessagesInfo,
  integrateMessages,
  processClientActionMessage,
  processClientContentMessage,
  processServerContentMessage,
  processUnmatchedVoiceMessages,
} from "@/utils/chatMessageUtils";

interface UseChatMessagesProps {
  client: MultimodalLiveClient;
  log: (log: StreamingLog) => void;
  logs: StreamingLog[];
}

export function useChatMessages({ client, log, logs }: UseChatMessagesProps) {
  const lastTurnCompleteRef = useRef<Date | null>(null);

  // Subscribe to logs and turn completion events
  useEffect(() => {
    client.on("log", log);

    // Direct listener for turn completion events
    const handleTurnComplete = () => {
      lastTurnCompleteRef.current = new Date();
    };

    client.on("turncomplete", handleTurnComplete);

    return () => {
      client.off("log", log);
      client.off("turncomplete", handleTurnComplete);
    };
  }, [client, log]);

  // Derive messages from logs using useMemo instead of useEffect + useState
  const messages = useMemo(() => {
    if (!logs) {
      return [];
    }

    const processedMessageIds = new Set<string>();
    const chatMessages: ChatMessage[] = [];
    const lastTurnCompleteTime = lastTurnCompleteRef.current?.getTime() ?? 0;

    // Extract voice message information
    const voiceMessagesInfo = extractVoiceMessagesInfo(logs);

    // Process all messages
    logs.forEach((logEntry) => {
      // Process user messages
      const userMessage = processClientContentMessage(
        logEntry,
        voiceMessagesInfo,
        processedMessageIds,
      );
      if (userMessage) {
        chatMessages.push(userMessage);
      }

      // Process assistant messages
      const assistantMessage = processServerContentMessage(
        logEntry,
        chatMessages,
        processedMessageIds,
        lastTurnCompleteTime,
      );
      if (assistantMessage) {
        chatMessages.push(assistantMessage);
      }

      // Process client action messages
      const actionMessage = processClientActionMessage(
        logEntry,
        processedMessageIds,
      );
      if (actionMessage) {
        chatMessages.push(actionMessage);
      }
    });

    // Process unmatched voice messages
    const unmatchedVoiceInfos =
      processUnmatchedVoiceMessages(voiceMessagesInfo);

    // Integrate all messages with correct order
    return integrateMessages(
      chatMessages,
      unmatchedVoiceInfos,
      processedMessageIds,
    );
  }, [logs, lastTurnCompleteRef]);

  return { messages };
}
