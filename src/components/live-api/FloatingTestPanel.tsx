"use client";

import React, { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useDraggable } from "@/lib/hooks/useDraggable";
import type { PlateEditor } from "@udecode/plate/react";

import { ToolCallTestPanel } from "./ToolCallTestPanel";
import { Move, X } from "lucide-react";

interface FloatingTestPanelProps {
  show: boolean;
  onClose: () => void;
  editor: PlateEditor;
}

export function FloatingTestPanel({
  show,
  onClose,
  editor,
}: FloatingTestPanelProps) {
  const { position, handleDragStart, handleDrag, handleDragEnd } = useDraggable(
    { x: 100, y: 100 },
    show,
  );

  if (!show) return null;

  return (
    <div
      className="bg-background border-border fixed z-40 rounded-lg border shadow-lg"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: "360px",
      }}
    >
      <div
        className="bg-muted/50 flex cursor-move items-center justify-between border-b p-2"
        onMouseDown={handleDragStart}
        onMouseMove={handleDrag}
        onMouseUp={handleDragEnd}
      >
        <div className="flex items-center gap-2">
          <Move className="text-muted-foreground h-4 w-4" />
          <h3 className="text-sm font-medium">Tool Call Test Panel</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>
      <div className="max-h-[400px] overflow-y-auto p-3">
        <ToolCallTestPanel editor={editor} />
      </div>
    </div>
  );
}
