'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { EditorService } from '@/lib/editor-service';
import { cn } from '@/lib/utils';
import type { Part } from '@google/generative-ai';

import { FloatingLoggerPanel } from './FloatingLoggerPanel';
import { FloatingTestPanel } from './FloatingTestPanel';
import { Beaker, ListFilter, PanelLeftClose, PanelLeftOpen, Send } from 'lucide-react';

interface SidePanelProps {
  send: (parts: Part | Part[]) => void;
  editorService: EditorService;
}

export default function SidePanel({ send, editorService }: SidePanelProps) {
  const { connected } = useLiveAPIContext();
  const [open, setOpen] = useState(true);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [showLoggerPanel, setShowLoggerPanel] = useState(false);
  const [textInput, setTextInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  const toggleLoggerPanel = () => {
    setShowLoggerPanel((prev) => !prev);
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
              onClick={toggleLoggerPanel}
              className='flex-shrink-0'
              title='Toggle Logger Panel'>
              <ListFilter className='h-5 w-5' />
              <span className='sr-only'>Toggle Logger Panel</span>
            </Button>
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

        <div className='flex-1'></div>

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
      <FloatingLoggerPanel show={showLoggerPanel} onClose={toggleLoggerPanel} />
    </>
  );
}
