"use client";

import React, { type ReactNode, useEffect, useRef, useState } from "react";

import AudioPulse from "@/components/audio-pulse/AudioPulse";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLiveAPIContext } from "@/contexts/LiveAPIContext";
import { AudioRecorder } from "@/lib/audio-recorder";
import { cn } from "@/lib/utils";
import type { GenerativeContentBlob } from "@google/generative-ai";

import { Beaker, ListFilter, Mic, MicOff, Pause, Play } from "lucide-react";

export type ControlTrayProps = {
  children?: ReactNode;
  sendRealtimeInput: (chunks: GenerativeContentBlob[]) => void;
  onToggleTestPanel: () => void;
  onToggleLoggerPanel: () => void;
  isTestPanelOpen: boolean;
  isLoggerPanelOpen: boolean;
};

interface MediaStreamButtonProps {
  isStreaming: boolean;
  start: () => Promise<void>;
  stop: () => void | Promise<void>;
  onIcon: React.ElementType;
  offIcon: React.ElementType;
  tooltipOn: string;
  tooltipOff: string;
  disabled?: boolean;
}

const MediaStreamButton = React.memo(
  ({
    isStreaming,
    start,
    stop,
    onIcon: OnIcon,
    offIcon: OffIcon,
    tooltipOn,
    tooltipOff,
    disabled = false,
  }: MediaStreamButtonProps) => (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={isStreaming ? stop : start}
            disabled={disabled}
            className="h-9 w-9"
          >
            {isStreaming ? (
              <OnIcon className="h-5 w-5" />
            ) : (
              <OffIcon className="h-5 w-5" />
            )}
            <span className="sr-only">
              {isStreaming ? tooltipOn : tooltipOff}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{isStreaming ? tooltipOn : tooltipOff}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
);

function ControlTrayComponent({
  children,
  sendRealtimeInput,
  onToggleTestPanel,
  onToggleLoggerPanel,
  isTestPanelOpen,
  isLoggerPanelOpen,
}: ControlTrayProps) {
  const [inVolume, setInVolume] = useState(0);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(true);
  const connectButtonRef = useRef<HTMLButtonElement>(null);

  const {
    connected,
    connect,
    disconnect,
    volume: outVolume,
  } = useLiveAPIContext();

  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  useEffect(() => {
    const onData = (base64: string) => {
      sendRealtimeInput([
        {
          mimeType: "audio/pcm;rate=16000",
          data: base64,
        },
      ]);
    };

    if (connected && !muted && audioRecorder) {
      audioRecorder.on("data", onData).on("volume", setInVolume).start();
    } else {
      audioRecorder.stop();
      setInVolume(0);
    }

    return () => {
      audioRecorder.off("data", onData).off("volume", setInVolume).stop();
    };
  }, [connected, muted, audioRecorder, sendRealtimeInput]);

  return (
    <section className="bg-background flex h-16 items-center justify-between border-t px-4">
      <nav className={cn("flex items-center gap-1")}>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMuted(!muted)}
                className="h-9 w-9"
              >
                {muted ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
                <span className="sr-only">
                  {muted ? "Unmute Microphone" : "Mute Microphone"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{muted ? "Unmute Microphone" : "Mute Microphone"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div
          className="flex h-9 w-9 items-center justify-center"
          title={`Mic Volume: ${inVolume.toFixed(2)}`}
        >
          <AudioPulse volume={inVolume} active={connected && !muted} />
        </div>

        <div
          className="flex h-9 w-9 items-center justify-center"
          title={`Speaker Volume: ${outVolume.toFixed(2)}`}
        >
          <AudioPulse volume={outVolume} active={connected} />
        </div>

        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isLoggerPanelOpen ? "secondary" : "ghost"}
                size="icon"
                onClick={onToggleLoggerPanel}
                className="h-9 w-9"
              >
                <ListFilter className="h-5 w-5" />
                <span className="sr-only">
                  {isLoggerPanelOpen ? "Hide" : "Show"} Logger Panel
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{isLoggerPanelOpen ? "Hide" : "Show"} Logger Panel</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isTestPanelOpen ? "secondary" : "ghost"}
                size="icon"
                onClick={onToggleTestPanel}
                className="h-9 w-9"
              >
                <Beaker className="h-5 w-5" />
                <span className="sr-only">
                  {isTestPanelOpen ? "Hide" : "Show"} Test Panel
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{isTestPanelOpen ? "Hide" : "Show"} Test Panel</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {children}
      </nav>

      <div className="flex items-center gap-2">
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                ref={connectButtonRef}
                variant={connected ? "outline" : "default"}
                size="icon"
                onClick={connected ? disconnect : connect}
                className="h-9 w-9"
              >
                {connected ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
                <span className="sr-only">
                  {connected ? "Disconnect Stream" : "Connect Stream"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{connected ? "Disconnect Stream" : "Connect Stream"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </section>
  );
}

export default ControlTrayComponent;
