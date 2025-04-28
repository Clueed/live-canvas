"use client";

import { useEffect, useMemo, useRef, } from "react";

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

  useEffect(() => {
    client.on("log", log);
    const handleTurnComplete = () => {
      lastTurnCompleteRef.current = new Date();
    };
    client.on("turncomplete", handleTurnComplete);
    return () => {
      client.off("log", log);
      client.off("turncomplete", handleTurnComplete);
    };
  }, [client, log]);

  const messages = useMemo(() => {
    if (!logs) {
      return [];
    }
    const processedMessageIds = new Set<string>();
    const chatMessages: ChatMessage[] = [];
    const lastTurnCompleteTime = lastTurnCompleteRef.current?.getTime() ?? 0;
    const voiceMessagesInfo = extractVoiceMessagesInfo(logs);
    logs.forEach((logEntry) => {
      const userMessage = processClientContentMessage(
        logEntry,
        voiceMessagesInfo,
        processedMessageIds,
      );
      if (userMessage) {
        chatMessages.push(userMessage);
      }
      const assistantMessage = processServerContentMessage(
        logEntry,
        chatMessages,
        processedMessageIds,
        lastTurnCompleteTime,
      );
      if (assistantMessage) {
        chatMessages.push(assistantMessage);
      }
      const actionMessage = processClientActionMessage(
        logEntry,
        processedMessageIds,
      );
      if (actionMessage) {
        chatMessages.push(actionMessage);
      }
    });
    const unmatchedVoiceInfos =
      processUnmatchedVoiceMessages(voiceMessagesInfo);
    return integrateMessages(
      chatMessages,
      unmatchedVoiceInfos,
      processedMessageIds,
    );
  }, [logs]);

  return { messages };
}
