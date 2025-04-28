"use client";

import React, { type ReactNode } from "react";

import { useLoggerStore } from "@/lib/store-logger";
import { cn } from "@/lib/utils";
import type {
  ClientContentMessage,
  ModelTurn,
  ServerContentMessage,
  StreamingLog,
  ToolCallCancellationMessage,
  ToolCallMessage,
  ToolResponseMessage,
} from "@/types/multimodal-live-types";
import {
  isClientContentMessage,
  isInterrupted,
  isModelTurn,
  isServerContentMessage,
  isToolCallCancellationMessage,
  isToolCallMessage,
  isToolResponseMessage,
  isTurnComplete,
} from "@/types/multimodal-live-types";
import type { Part } from "@google/generative-ai";

import SyntaxHighlighter from "react-syntax-highlighter";
import { vs2015 as dark } from "react-syntax-highlighter/dist/esm/styles/hljs";

const formatTime = (d: Date) =>
  d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }); // Simplified format

const LogEntry = ({
  log,
  MessageComponent,
}: {
  log: StreamingLog;
  MessageComponent: ({
    message,
  }: { message: StreamingLog["message"] }) => ReactNode;
}) => {
  const source = log.type.slice(0, log.type.indexOf("."));
  const direction = log.type.includes("receive")
    ? "receive"
    : log.type.includes("send")
      ? "send"
      : "";

  return (
    <li
      className={cn(
        "mb-2 max-w-full items-start gap-2 overflow-x-auto text-xs",
        `source-${source}`, // e.g., source-client, source-server
        direction === "receive" && "text-blue-600 dark:text-blue-400",
        direction === "send" && "text-green-600 dark:text-green-400",
      )}
    >
      <div className="flex justify-between">
        <span
          className="w-40 flex-shrink-0 truncate font-medium"
          title={log.type}
        >
          {log.type}
        </span>
        <span className="w-16 flex-shrink-0 font-mono text-xs text-gray-500 dark:text-gray-400">
          {formatTime(log.date)}
        </span>
      </div>

      <span className="message flex-1 overflow-hidden break-words">
        <MessageComponent message={log.message} />
      </span>
      {log.count && (
        <span className="ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-xs dark:bg-gray-700">
          {log.count}
        </span>
      )}
    </li>
  );
};

const PlainTextMessage = ({
  message,
}: { message: StreamingLog["message"] }) => <span>{message as string}</span>;

type Message = { message: StreamingLog["message"] };

const AnyMessage = ({ message }: Message) => (
  <pre className="rounded bg-gray-100 p-2 text-xs whitespace-pre-wrap dark:bg-gray-800">
    {JSON.stringify(message, null, 2)}
  </pre>
);

function tryParseCodeExecutionResult(output: string) {
  try {
    const json = JSON.parse(output);

    return JSON.stringify(json, null, 2);
  } catch (e) {
    return output; // Added newline for ESLint
  }
}

const RenderPart = ({ part }: { part: Part }) => {
  if (part.text?.trim().length) {
    return (
      <p className="part part-text my-1 whitespace-pre-wrap">{part.text}</p>
    );
  }
  if (part.executableCode) {
    return (
      <div className="part part-executableCode my-1 rounded border border-yellow-300 bg-yellow-50 p-2 dark:border-yellow-700 dark:bg-yellow-900/30">
        <h5 className="mb-1 text-xs font-semibold text-yellow-800 dark:text-yellow-200">
          Executable Code: {part.executableCode.language}
        </h5>
        <SyntaxHighlighter
          language={part.executableCode.language.toLowerCase()}
          style={dark}
          customStyle={{ background: "transparent", padding: "0.5rem" }}
          wrapLongLines={true}
        >
          {part.executableCode.code}
        </SyntaxHighlighter>
      </div>
    );
  }
  if (part.codeExecutionResult) {
    return (
      <div className="part part-codeExecutionResult my-1 rounded border border-purple-300 bg-purple-50 p-2 dark:border-purple-700 dark:bg-purple-900/30">
        <h5 className="mb-1 text-xs font-semibold text-purple-800 dark:text-purple-200">
          Code Execution Result: {part.codeExecutionResult.outcome}
        </h5>
        <SyntaxHighlighter
          language="json" // Assuming JSON output, adjust if needed
          style={dark}
          customStyle={{ background: "transparent", padding: "0.5rem" }}
          wrapLongLines={true}
        >
          {tryParseCodeExecutionResult(part.codeExecutionResult.output)}
        </SyntaxHighlighter>
      </div>
    );
  }
  if (part.inlineData) {
    return (
      <div className="part part-inlinedata my-1 text-gray-500">
        <h5 className="text-xs italic">
          Inline Data: {part.inlineData.mimeType}
        </h5>
      </div>
    );
  }

  return null;
};

const ClientContentLog = ({ message }: Message) => {
  const { turns, turnComplete } = (message as ClientContentMessage)
    .clientContent;

  return (
    <div className="rich-log client-content user my-1 rounded border border-green-300 bg-green-50 p-2 dark:border-green-700 dark:bg-green-900/30">
      <h4 className="mb-1 text-xs font-semibold text-green-800 dark:text-green-200">
        User
      </h4>
      {turns.map((turn, i) => (
        <div key={`message-turn-${i}`}>
          {turn.parts
            .filter((part) => !(part.text && part.text.trim() === "")) // Filter empty text parts
            .map((part, j) => (
              <RenderPart part={part} key={`message-turn-${i}-part-${j}`} />
            ))}
        </div>
      ))}
      {!turnComplete && (
        <span className="mt-1 block text-xs text-gray-500 italic">
          turnComplete: false
        </span>
      )}
    </div>
  );
};

const ToolCallLog = ({ message }: Message) => {
  const { toolCall } = message as ToolCallMessage;

  return (
    <div className="rich-log tool-call my-1 rounded border border-indigo-300 bg-indigo-50 p-2 dark:border-indigo-700 dark:bg-indigo-900/30">
      {toolCall.functionCalls.map((fc) => (
        <div key={fc.id} className="part part-functioncall mb-2 last:mb-0">
          <h5 className="mb-1 text-xs font-semibold text-indigo-800 dark:text-indigo-200">
            Function Call: {fc.name} (ID: {fc.id})
          </h5>
          <SyntaxHighlighter
            language="json"
            style={dark}
            customStyle={{ background: "transparent", padding: "0.5rem" }}
            wrapLongLines={true}
          >
            {JSON.stringify(fc.args, null, 2)}
          </SyntaxHighlighter>
        </div>
      ))}
    </div>
  );
};

const ToolCallCancellationLog = (
  { message }: Message, // Removed : JSX.Element
) => (
  <div className="rich-log tool-call-cancellation my-1 rounded border border-red-300 bg-red-50 p-2 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300">
    <span className="text-xs font-semibold">Tool Call Cancellation IDs: </span>
    {(message as ToolCallCancellationMessage).toolCallCancellation.ids.map(
      (id, index) => (
        <React.Fragment key={`cancel-${id}`}>
          <code className="mx-1 rounded bg-red-100 px-1 py-0.5 text-xs dark:bg-red-800">
            {id}
          </code>
          {index <
          (message as ToolCallCancellationMessage).toolCallCancellation.ids
            .length -
            1
            ? ", "
            : ""}
        </React.Fragment>
      ),
    )}
  </div>
);

const ToolResponseLog = (
  { message }: Message, // Removed : JSX.Element
) => (
  <div className="rich-log tool-response my-1 rounded border border-cyan-300 bg-cyan-50 p-2 dark:border-cyan-700 dark:bg-cyan-900/30">
    {(message as ToolResponseMessage).toolResponse.functionResponses.map(
      (fr) => (
        <div key={`tool-response-${fr.id}`} className="part mb-2 last:mb-0">
          <h5 className="mb-1 text-xs font-semibold text-cyan-800 dark:text-cyan-200">
            Function Response (ID: {fr.id})
          </h5>
          <SyntaxHighlighter
            language="json"
            style={dark}
            customStyle={{ background: "transparent", padding: "0.5rem" }}
            wrapLongLines={true}
          >
            {JSON.stringify(fr.response, null, 2)}
          </SyntaxHighlighter>
        </div>
      ),
    )}
  </div>
);

const ModelTurnLog = ({ message }: Message) => {
  // Removed : JSX.Element
  const serverContent = (message as ServerContentMessage).serverContent;
  const { modelTurn } = serverContent as ModelTurn;
  const { parts } = modelTurn;

  return (
    <div className="rich-log model-turn model my-1 rounded border border-blue-300 bg-blue-50 p-2 dark:border-blue-700 dark:bg-blue-900/30">
      <h4 className="mb-1 text-xs font-semibold text-blue-800 dark:text-blue-200">
        Model
      </h4>
      {parts
        .filter((part) => !(part.text && part.text.trim() === "")) // Filter empty text parts
        .map((part, j) => (
          <RenderPart part={part} key={`model-turn-part-${j}`} />
        ))}
    </div>
  );
};

const CustomPlainTextLog = (msg: string) => () => (
  <PlainTextMessage message={msg} />
);

// --- Main Logger Component ---

export type LoggerFilterType = "conversations" | "tools" | "none";

export type LoggerProps = {
  filter: LoggerFilterType;
};

const filters: Record<LoggerFilterType, (log: StreamingLog) => boolean> = {
  tools: (log: StreamingLog) =>
    isToolCallMessage(log.message) ||
    isToolResponseMessage(log.message) ||
    isToolCallCancellationMessage(log.message),
  conversations: (log: StreamingLog) =>
    isClientContentMessage(log.message) || isServerContentMessage(log.message),
  none: () => true,
};

const getMessageComponent = (
  log: StreamingLog,
): (({ message }: Message) => ReactNode) => {
  if (typeof log.message === "string") {
    return PlainTextMessage;
  }
  if (isClientContentMessage(log.message)) {
    return ClientContentLog;
  }
  if (isToolCallMessage(log.message)) {
    return ToolCallLog;
  }
  if (isToolCallCancellationMessage(log.message)) {
    return ToolCallCancellationLog;
  }
  if (isToolResponseMessage(log.message)) {
    return ToolResponseLog;
  }
  if (isServerContentMessage(log.message)) {
    const { serverContent } = log.message;
    if (isInterrupted(serverContent)) {
      return CustomPlainTextLog("interrupted");
    }
    if (isTurnComplete(serverContent)) {
      return CustomPlainTextLog("turnComplete");
    }
    if (isModelTurn(serverContent)) {
      return ModelTurnLog;
    }
  }
  // Fallback for unknown message types
  console.warn("Unknown log message type:", log.message);

  return AnyMessage; // Added newline for ESLint
};

export function Logger({ filter = "none" }: LoggerProps) {
  const { logs } = useLoggerStore();
  const filterFn = filters[filter];

  const filteredLogs = React.useMemo(
    () => logs.filter(filterFn),
    [logs, filterFn],
  );

  return (
    <div className="max-w-full">
      <ul className="max-w-full list-none p-0">
        {filteredLogs.map((log: StreamingLog, index: number) => {
          // Use index as key for simplicity, consider stable IDs if logs can be reordered/deleted
          const MessageComponent = getMessageComponent(log);

          return (
            <LogEntry
              MessageComponent={MessageComponent}
              log={log}
              key={index}
            />
          );
        })}
      </ul>
    </div>
  );
}
