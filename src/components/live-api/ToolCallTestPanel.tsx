'use client';

import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { getEditorArtifact, setEditorArtifact } from '@/lib/prompts';
import { LiveFunctionCall } from '@/types/multimodal-live-types';

interface ToolCallTestPanelProps {
    canvasText: string;
    updateCanvasText: (text: string, isUserUpdate: boolean) => void;
}

export function ToolCallTestPanel({ canvasText, updateCanvasText }: ToolCallTestPanelProps) {
    const [newCanvasText, setNewCanvasText] = useState('');

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
        const response = handleToolCall(setEditorCall);

        console.log(response.success ? 'Set Editor Success:' : 'Set Editor Failed:', response.message);
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
        const response = handleToolCall(getEditorCall);

        if (response.success) {
            setNewCanvasText(response.data || '');
        }

        console.log(response.success ? 'Get Editor Success:' : 'Get Editor Failed:', response.message);
    };

    // Function to handle the tool calls
    const handleToolCall = (functionCall: LiveFunctionCall) => {
        try {
            switch (functionCall.name) {
                case setEditorArtifact.name: {
                    const args = functionCall.args as { text?: string };
                    if (typeof args?.text === 'string') {
                        updateCanvasText(args.text, false);
                        return {
                            success: true,
                            message: 'Canvas text updated successfully',
                            data: null
                        };
                    } else {
                        return {
                            success: false,
                            message: 'Invalid arguments: text is required',
                            data: null
                        };
                    }
                }
                case getEditorArtifact.name: {
                    return {
                        success: true,
                        message: 'Retrieved current canvas text',
                        data: canvasText
                    };
                }
                default: {
                    return {
                        success: false,
                        message: `Unknown function call: ${functionCall.name}`,
                        data: null
                    };
                }
            }
        } catch (error) {
            console.error('Error handling tool call:', error);
            return {
                success: false,
                message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                data: null
            };
        }
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
