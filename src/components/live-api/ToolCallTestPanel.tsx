'use client';

import React, { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getEditorArtifact, setEditorArtifact } from '@/lib/prompts';
import { createFunctionCallHandler } from '@/lib/tool-call-handlers';
import { LiveFunctionCall } from '@/types/multimodal-live-types';

interface ToolCallTestPanelProps {
    canvasText: string;
    updateCanvasText: (text: string, isUserUpdate: boolean) => void;
    undo?: () => void;
    redo?: () => void;
}

export function ToolCallTestPanel({ canvasText, updateCanvasText, undo, redo }: ToolCallTestPanelProps) {
    const [newCanvasText, setNewCanvasText] = useState('');

    const functionCallHandler = useCallback(createFunctionCallHandler({ canvasText, updateCanvasText, undo, redo }), [
        canvasText,
        updateCanvasText,
        undo,
        redo
    ]);

    // Handler for testing setEditorArtifact
    const handleTestSetEditorArtifact = () => {
        if (!newCanvasText.trim()) {
            console.warn('Please enter some text to set');
            return;
        }

        // Create a manual function call
        const setEditorCall: LiveFunctionCall = {
            name: setEditorArtifact.name,
            args: { text: newCanvasText },
            id: Date.now().toString()
        };

        // Simulate the tool call
        const response = functionCallHandler(setEditorCall);

        console.log(
            response.response.output?.success ? 'Set Editor Success:' : 'Set Editor Failed:',
            response.response.output?.error || 'Canvas text updated successfully'
        );
    };

    // Handler for testing getEditorArtifact
    const handleTestGetEditorArtifact = () => {
        // Create a manual function call
        const getEditorCall: LiveFunctionCall = {
            name: getEditorArtifact.name,
            args: {},
            id: Date.now().toString()
        };

        // Simulate the tool call
        const response = functionCallHandler(getEditorCall);

        if (response.response.success) {
            setNewCanvasText(response.response.artifact || '');
        }

        console.log(
            response.response.success ? 'Get Editor Success:' : 'Get Editor Failed:',
            response.response.success ? 'Retrieved current canvas text' : 'Failed to retrieve canvas text'
        );
    };

    return (
        <Card className='w-full'>
            <CardHeader>
                <CardTitle className='text-sm font-medium'>Tool Call Test Panel</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
                <div className='space-y-2'>
                    <Label htmlFor='canvasText'>Canvas Text</Label>
                    <Textarea
                        id='canvasText'
                        className='min-h-[100px] resize-none'
                        placeholder='Enter text to set in canvas'
                        value={newCanvasText}
                        onChange={(e) => setNewCanvasText(e.target.value)}
                    />
                </div>
                <div className='flex gap-2'>
                    <Button size='sm' variant='outline' onClick={handleTestGetEditorArtifact} className='flex-1'>
                        Get Text
                    </Button>
                    <Button size='sm' variant='default' onClick={handleTestSetEditorArtifact} className='flex-1'>
                        Set Text
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
