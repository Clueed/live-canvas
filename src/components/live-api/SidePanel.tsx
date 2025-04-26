'use client';

// Needed for hooks and event handlers
import React, { useEffect, useRef, useState } from 'react';

import { Logger, type LoggerFilterType } from '@/components/logger/Logger';
// Assuming Logger exists here
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
// Adjusted path
import { useLoggerStore } from '@/lib/store-logger';
// Adjusted path
import { cn } from '@/lib/utils';
import type { Part } from '@google/generative-ai';

import { ToolCallTestPanel } from './ToolCallTestPanel';
import { PanelLeftClose, PanelLeftOpen, Send } from 'lucide-react';

const filterOptions = [
    { value: 'conversations', label: 'Conversations' },
    { value: 'tools', label: 'Tool Use' },
    { value: 'none', label: 'All' }
];

interface SidePanelProps {
    send: (parts: Part | Part[]) => void;
    canvasText: () => string;
    updateCanvasText: (text: string, isUserUpdate: boolean) => void;
    undo: () => void;
    redo: () => void;
}

export default function SidePanel({ send, canvasText, updateCanvasText }: SidePanelProps) {
    const { connected, client } = useLiveAPIContext();
    const [open, setOpen] = useState(true);
    const loggerRef = useRef<HTMLDivElement>(null); // Ref for ScrollArea viewport
    const loggerLastHeightRef = useRef<number>(-1);
    const { log, logs } = useLoggerStore();

    const [textInput, setTextInput] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<LoggerFilterType>('none');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Scroll the log to the bottom when new logs come in
    useEffect(() => {
        if (loggerRef.current) {
            const el = loggerRef.current;
            const scrollHeight = el.scrollHeight;
            // Check if scrollHeight changed significantly to avoid minor fluctuations
            if (Math.abs(scrollHeight - loggerLastHeightRef.current) > 5) {
                el.scrollTop = scrollHeight;
                loggerLastHeightRef.current = scrollHeight;
            }
        }
    }, [logs]);

    // Listen for log events and store them
    useEffect(() => {
        client.on('log', log);

        return () => {
            client.off('log', log);
        };
    }, [client, log]);

    const handleSubmit = () => {
        if (!textInput.trim() || !connected) return; // Prevent sending empty or when disconnected
        send([{ text: textInput }]);
        setTextInput('');
        // No need to manually clear inputRef.innerText for controlled component
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit();
        }
    };

    return (
        <div
            className={cn(
                'bg-muted/40 flex h-full max-h-full flex-col border-r transition-all duration-300 ease-in-out',
                open ? 'w-80' : 'w-[68px]'
            )}>
            {/* Header */}
            <header className='flex h-14 items-center justify-between border-b px-4'>
                <h2 className={cn('text-lg font-semibold', !open && 'hidden')}>Console</h2>
                <Button variant='ghost' size='icon' onClick={() => setOpen(!open)} className='flex-shrink-0'>
                    {open ? <PanelLeftClose className='h-5 w-5' /> : <PanelLeftOpen className='h-5 w-5' />}
                    <span className='sr-only'>{open ? 'Collapse Sidebar' : 'Expand Sidebar'}</span>
                </Button>
            </header>

            {/* Indicators & Filter */}
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
                        !open && 'mt-1', // Add margin top when collapsed
                        connected
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                    )}
                    title={connected ? 'Streaming Connected' : 'Streaming Paused'}>
                    {connected ? '🔵' : '⏸️'}
                    <span className={cn('ml-1.5', !open && 'hidden')}>{connected ? 'Streaming' : 'Paused'}</span>
                </div>
            </section>

            {/* Logger Area */}
            <div className='flex-1 overflow-y-auto p-4' ref={loggerRef}>
                {' '}
                <Logger filter={selectedFilter} />
            </div>

            {/* Tool Call Test Panel */}
            {open && (
                <div className='border-t p-3'>
                    <ToolCallTestPanel canvasText={canvasText} updateCanvasText={updateCanvasText} />
                </div>
            )}

            {/* Input Area */}
            <div className={cn('mt-auto border-t p-3', !connected && 'pointer-events-none opacity-50')}>
                <div className='relative flex items-end gap-2'>
                    <Textarea
                        ref={inputRef}
                        placeholder={connected ? 'Type something...' : 'Connect to send messages'}
                        className='min-h-[40px] flex-1 resize-none pr-12' // Add padding for button
                        rows={1} // Start with 1 row, auto-expands
                        onKeyDown={handleKeyDown}
                        onChange={(e) => setTextInput(e.target.value)}
                        value={textInput}
                        disabled={!connected}
                    />
                    <Button
                        type='submit'
                        size='icon'
                        className='absolute right-1.5 bottom-1.5 h-7 w-7' // Position button
                        onClick={handleSubmit}
                        disabled={!connected || !textInput.trim()}>
                        <Send className='h-4 w-4' />
                        <span className='sr-only'>Send message</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
