import {
  type ClientContentMessage,
  type ModelTurn,
  type ServerContentMessage,
  type StreamingLog,
  isClientContentMessage,
  isModelTurn,
  isServerContentMessage,
  isToolCallCancellationMessage,
  isToolResponseMessage,
} from "@/types/multimodal-live-types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  id: string;
  isVoiceMessage?: boolean;
}

export interface VoiceMessageInfo {
  date: Date;
  matched: boolean;
}

/**
 * Extracts voice message information from logs
 */
export function extractVoiceMessagesInfo(
  logs: StreamingLog[],
): Map<number, VoiceMessageInfo> {
  const voiceMessagesInfo = new Map<number, VoiceMessageInfo>();

  logs.forEach((logEntry) => {
    if (logEntry.message === "audio") {
      const timestamp = logEntry.date.getTime();
      voiceMessagesInfo.set(timestamp, { date: logEntry.date, matched: false });
    }
  });

  return voiceMessagesInfo;
}

/**
 * Processes a client content message (user message)
 */
export function processClientContentMessage(
  logEntry: StreamingLog,
  voiceMessagesInfo: Map<number, VoiceMessageInfo>,
  processedMessageIds: Set<string>,
): ChatMessage | null {
  if (!isClientContentMessage(logEntry.message)) return null;

  const clientContent = (logEntry.message as ClientContentMessage)
    .clientContent;
  const parts = clientContent.turns.flatMap((turn) => turn.parts);
  const text = parts
    .filter((part) => part.text)
    .map((part) => part.text)
    .join("");

  const messageTimestamp = logEntry.date.getTime();
  const messageId = `user-${messageTimestamp}`;

  if (processedMessageIds.has(messageId)) return null;

  let isVoiceMessage = false;

  // Find the closest unmatched voice message timestamp within a 2-second window
  const closestVoiceTimestamp = [...voiceMessagesInfo.keys()]
    .filter((t) => !voiceMessagesInfo.get(t)?.matched)
    .sort(
      (a, b) => Math.abs(a - messageTimestamp) - Math.abs(b - messageTimestamp),
    )[0];

  if (
    closestVoiceTimestamp !== undefined &&
    Math.abs(closestVoiceTimestamp - messageTimestamp) < 2000
  ) {
    isVoiceMessage = true;
    const voiceInfo = voiceMessagesInfo.get(closestVoiceTimestamp);
    if (voiceInfo) {
      voiceInfo.matched = true; // Mark as matched
    }
  }

  if (text.trim() || isVoiceMessage) {
    processedMessageIds.add(messageId);

    return {
      role: "user",
      content: text.trim(),
      timestamp: logEntry.date,
      id: messageId,
      isVoiceMessage,
    };
  }

  return null;
}

/**
 * Processes a server content message (assistant message)
 */
export function processServerContentMessage(
  logEntry: StreamingLog,
  chatMessages: ChatMessage[],
  processedMessageIds: Set<string>,
  lastTurnCompleteTime: number,
): ChatMessage | null {
  if (!isServerContentMessage(logEntry.message)) return null;

  const serverContent = (logEntry.message as ServerContentMessage)
    .serverContent;
  if (!isModelTurn(serverContent)) return null;

  const { modelTurn } = serverContent as ModelTurn;
  const text = modelTurn.parts
    .filter((part) => part.text)
    .map((part) => part.text)
    .join("");

  if (!text.trim()) return null;

  const messageId = `assistant-${logEntry.date.getTime()}`;
  const shouldStartNewMessage = logEntry.date.getTime() > lastTurnCompleteTime;

  const lastAssistantIndex = [...chatMessages]
    .reverse()
    .findIndex((msg) => msg.role === "assistant");
  const lastAssistantMessage =
    lastAssistantIndex !== -1
      ? chatMessages[chatMessages.length - 1 - lastAssistantIndex]
      : null;

  if (
    lastAssistantMessage &&
    !shouldStartNewMessage &&
    logEntry.date.getTime() - lastAssistantMessage.timestamp.getTime() < 2000
  ) {
    // Basic append
    lastAssistantMessage.content += text;

    return null; // We modified existing message, so no new message to return
  }
  if (processedMessageIds.has(messageId)) return null;

  processedMessageIds.add(messageId);

  return {
    role: "assistant",
    content: text,
    timestamp: logEntry.date,
    id: messageId,
  };
}

/**
 * Processes a client action message (tool response, cancellation)
 */
export function processClientActionMessage(
  logEntry: StreamingLog,
  processedMessageIds: Set<string>,
): ChatMessage | null {
  if (!logEntry.type.startsWith("client.send")) return null;

  const messageId = `client-action-${logEntry.date.getTime()}`;
  if (processedMessageIds.has(messageId)) return null;

  let actionContent = "";

  if (isToolResponseMessage(logEntry.message)) {
    actionContent = "[Sent Tool Response]";
  } else if (isToolCallCancellationMessage(logEntry.message)) {
    actionContent = "[Cancelled Tool Call]";
  }

  if (actionContent) {
    processedMessageIds.add(messageId);

    return {
      role: "user",
      content: actionContent,
      timestamp: logEntry.date,
      id: messageId,
      isVoiceMessage: false,
    };
  }

  return null;
}

/**
 * Gets sorted, unmatched voice message info
 */
export function processUnmatchedVoiceMessages(
  voiceMessagesInfo: Map<number, VoiceMessageInfo>,
): [number, VoiceMessageInfo][] {
  return [...voiceMessagesInfo.entries()]
    .filter(([, info]) => !info.matched)
    .sort(([tsA], [tsB]) => tsA - tsB);
}

/**
 * Integrates all messages in correct chronological order
 */
export function integrateMessages(
  chatMessages: ChatMessage[],
  unmatchedVoiceInfos: [number, VoiceMessageInfo][],
  processedMessageIds: Set<string>,
): ChatMessage[] {
  const finalMessages: ChatMessage[] = [];
  let voiceInfoIndex = 0;
  let messageIndex = 0;

  // Sort the messages by timestamp
  const sortedMessages = [...chatMessages].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );

  while (
    messageIndex < sortedMessages.length ||
    voiceInfoIndex < unmatchedVoiceInfos.length
  ) {
    const currentMessageTimestamp =
      messageIndex < sortedMessages.length
        ? sortedMessages[messageIndex].timestamp.getTime()
        : Number.POSITIVE_INFINITY;
    const currentVoiceTimestamp =
      voiceInfoIndex < unmatchedVoiceInfos.length
        ? unmatchedVoiceInfos[voiceInfoIndex][0]
        : Number.POSITIVE_INFINITY;

    if (currentVoiceTimestamp < currentMessageTimestamp) {
      // Process voice message group
      const groupStartTime = currentVoiceTimestamp;
      const groupStartDate = unmatchedVoiceInfos[voiceInfoIndex][1].date;
      let groupEndIndex = voiceInfoIndex;

      while (
        groupEndIndex + 1 < unmatchedVoiceInfos.length &&
        unmatchedVoiceInfos[groupEndIndex + 1][0] < currentMessageTimestamp
      ) {
        groupEndIndex++;
      }

      const messageId = `user-voice-group-${groupStartTime}`;
      if (!processedMessageIds.has(messageId)) {
        processedMessageIds.add(messageId);
        finalMessages.push({
          role: "user",
          content: "",
          timestamp: groupStartDate,
          id: messageId,
          isVoiceMessage: true,
        });
      }

      voiceInfoIndex = groupEndIndex + 1;
    } else if (messageIndex < sortedMessages.length) {
      finalMessages.push(sortedMessages[messageIndex]);
      messageIndex++;
    } else {
      break;
    }
  }

  return finalMessages;
}
