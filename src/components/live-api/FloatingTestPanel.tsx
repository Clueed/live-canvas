'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { EditorService } from '@/lib/editor-service';

import { ToolCallTestPanel } from './ToolCallTestPanel';
import { Move, X } from 'lucide-react';

interface FloatingTestPanelProps {
  show: boolean;
  onClose: () => void;
  editorService: EditorService;
}

export function FloatingTestPanel({ show, onClose, editorService }: FloatingTestPanelProps) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const dragRef = useRef<{ isDragging: boolean; startX: number; startY: number }>({
    isDragging: false,
    startX: 0,
    startY: 0
  });

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    dragRef.current = {
      isDragging: true,
      startX: e.clientX - position.x,
      startY: e.clientY - position.y
    };
  };

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current.isDragging) return;
    setPosition({
      x: e.clientX - dragRef.current.startX,
      y: e.clientY - dragRef.current.startY
    });
  };

  const handleDragEnd = () => {
    dragRef.current.isDragging = false;
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (dragRef.current.isDragging) {
        setPosition({
          x: e.clientX - dragRef.current.startX,
          y: e.clientY - dragRef.current.startY
        });
      }
    };

    const onMouseUp = () => {
      dragRef.current.isDragging = false;
    };

    if (show) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [show]);

  if (!show) return null;

  return (
    <div
      className='bg-background border-border fixed z-40 rounded-lg border shadow-lg'
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '360px'
      }}>
      <div
        className='bg-muted/50 flex cursor-move items-center justify-between border-b p-2'
        onMouseDown={handleDragStart}
        onMouseMove={handleDrag}
        onMouseUp={handleDragEnd}>
        <div className='flex items-center gap-2'>
          <Move className='text-muted-foreground h-4 w-4' />
          <h3 className='text-sm font-medium'>Tool Call Test Panel</h3>
        </div>
        <Button variant='ghost' size='icon' onClick={onClose} className='h-6 w-6'>
          <X className='h-4 w-4' />
          <span className='sr-only'>Close</span>
        </Button>
      </div>
      <div className='max-h-[400px] overflow-y-auto p-3'>
        <ToolCallTestPanel editorService={editorService} />
      </div>
    </div>
  );
}
