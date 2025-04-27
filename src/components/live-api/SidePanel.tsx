'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Logger, type LoggerFilterType } from '@/components/logger/Logger';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { EditorService } from '@/lib/editor-service';
import { useLoggerStore } from '@/lib/store-logger';
import { cn } from '@/lib/utils';
import type { Part } from '@google/generative-ai';

import { FloatingTestPanel } from './FloatingTestPanel';
import { Beaker, PanelLeftClose, PanelLeftOpen, Send } from 'lucide-react';

const filterOptions = [
  { value: 'conversations', label: 'Conversations' },
  { value: 'tools', label: 'Tool Use' },
  { value: 'none', label: 'All' }
];

interface SidePanelProps {
  send: (parts: Part | Part[]) => void;
  editorService: EditorService;
}

export default function SidePanel({ send, editorService }: SidePanelProps) {
  const { connected, client } = useLiveAPIContext();
  const [open, setOpen] = useState(true);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const loggerRef = useRef<HTMLDivElement>(null);
  const loggerLastHeightRef = useRef<number>(-1);
  const { log, logs } = useLoggerStore();

  const [textInput, setTextInput] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<LoggerFilterType>('none');
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  const handleSubmit = () => {
    if (!textInput.trim() || !connected) return;
    send([{ text: textInput }]);
    setTextInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit();
    }
  };

  const toggleTestPanel = () => {
    setShowTestPanel((prev) => !prev);
  };

  return (
    <>
      <div
        className={cn(
          'bg-muted/40 flex h-full max-h-full flex-col overflow-hidden transition-all duration-300 ease-in-out',
          open ? 'w-80' : 'w-[68px]'
        )}>
        <header className='flex h-14 items-center justify-between border-b px-4'>
          <h2 className={cn('text-lg font-semibold', !open && 'hidden')}>Console</h2>
          <div className='flex items-center gap-1'>
            <Button
              variant='ghost'
              size='icon'
              onClick={toggleTestPanel}
              className='flex-shrink-0'
              title='Toggle Test Panel'>
              <Beaker className='h-5 w-5' />
              <span className='sr-only'>Toggle Test Panel</span>
            </Button>
            <Button variant='ghost' size='icon' onClick={() => setOpen(!open)} className='flex-shrink-0'>
              {open ? <PanelLeftClose className='h-5 w-5' /> : <PanelLeftOpen className='h-5 w-5' />}
              <span className='sr-only'>{open ? 'Collapse Sidebar' : 'Expand Sidebar'}</span>
            </Button>
          </div>
        </header>

        <section className={cn('flex items-center gap-2 border-b p-2', !open && 'flex-col')}>
          <Select defaultValue='none' onValueChange={(value) => setSelectedFilter(value as LoggerFilterType)}>
            <SelectTrigger className={cn('h-9 flex-1', !open && 'w-full')}>
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
          <div
            className={cn(
              'flex h-9 w-full items-center justify-center rounded-md px-3 text-xs font-medium',
              !open && 'mt-1',
              connected
                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
            )}
            title={connected ? 'Streaming Connected' : 'Streaming Paused'}>
            {connected ? '🔵' : '⏸️'}
            <span className={cn('ml-1.5', !open && 'hidden')}>{connected ? 'Streaming' : 'Paused'}</span>
          </div>
        </section>

        <div className='flex-1 overflow-y-auto p-4' ref={loggerRef}>
          <Logger filter={selectedFilter} />
        </div>

        <div className={cn('mt-auto border-t p-3', !connected && 'pointer-events-none opacity-50')}>
          <div className='relative flex items-end gap-2'>
            <Textarea
              ref={inputRef}
              placeholder={connected ? 'Type something...' : 'Connect to send messages'}
              className='min-h-[40px] flex-1 resize-none pr-12'
              rows={1}
              onKeyDown={handleKeyDown}
              onChange={(e) => setTextInput(e.target.value)}
              value={textInput}
              disabled={!connected}
            />
            <Button
              type='submit'
              size='icon'
              className='absolute right-1.5 bottom-1.5 h-7 w-7'
              onClick={handleSubmit}
              disabled={!connected || !textInput.trim()}>
              <Send className='h-4 w-4' />
              <span className='sr-only'>Send message</span>
            </Button>
          </div>
        </div>
      </div>

      <FloatingTestPanel show={showTestPanel} onClose={toggleTestPanel} editorService={editorService} />
    </>
  );
}
