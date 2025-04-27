'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Logger, type LoggerFilterType } from '@/components/logger/Logger';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { useLoggerStore } from '@/lib/store-logger';

import { Move, X } from 'lucide-react';

const filterOptions = [
  { value: 'conversations', label: 'Conversations' },
  { value: 'tools', label: 'Tool Use' },
  { value: 'none', label: 'All' }
];

interface FloatingLoggerPanelProps {
  show: boolean;
  onClose: () => void;
}

export function FloatingLoggerPanel({ show, onClose }: FloatingLoggerPanelProps) {
  const { client } = useLiveAPIContext();
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [selectedFilter, setSelectedFilter] = useState<LoggerFilterType>('none');
  const { log, logs } = useLoggerStore();
  const loggerRef = useRef<HTMLDivElement>(null);
  const loggerLastHeightRef = useRef<number>(-1);

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

  useEffect(() => {
    if (loggerRef.current) {
      const el = loggerRef.current;
      const scrollHeight = el.scrollHeight;
      if (Math.abs(scrollHeight - loggerLastHeightRef.current) > 5) {
        el.scrollTop = scrollHeight;
        loggerLastHeightRef.current = scrollHeight;
      }
    }
  }, [logs]);

  useEffect(() => {
    client.on('log', log);

    return () => {
      client.off('log', log);
    };
  }, [client, log]);

  if (!show) return null;

  return (
    <div
      className='bg-background border-border fixed z-40 rounded-lg border shadow-lg'
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '400px'
      }}>
      <div
        className='bg-muted/50 flex cursor-move items-center justify-between border-b p-2'
        onMouseDown={handleDragStart}
        onMouseMove={handleDrag}
        onMouseUp={handleDragEnd}>
        <div className='flex items-center gap-2'>
          <Move className='text-muted-foreground h-4 w-4' />
          <h3 className='text-sm font-medium'>Console Logger</h3>
        </div>
        <Button variant='ghost' size='icon' onClick={onClose} className='h-6 w-6'>
          <X className='h-4 w-4' />
          <span className='sr-only'>Close</span>
        </Button>
      </div>
      <div className='border-b p-2'>
        <Select defaultValue='none' onValueChange={(value) => setSelectedFilter(value as LoggerFilterType)}>
          <SelectTrigger className='h-9 w-full'>
            <SelectValue placeholder='Filter logs' />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className='max-h-[400px] overflow-y-auto p-3' ref={loggerRef}>
        <Logger filter={selectedFilter} />
      </div>
    </div>
  );
}
