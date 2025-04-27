'use client';

import React, { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EditorOperationResult } from '@/hooks/use-tool-call-handler';
import { EditorService } from '@/lib/editor-service';
import { FUNCTION_DECLARATIONS } from '@/lib/prompts';
import { createFunctionCallHandler } from '@/lib/tool-call-handlers';
import { LiveFunctionCall } from '@/types/multimodal-live-types';

interface ToolCallTestPanelProps {
  editorService: EditorService;
}

export function ToolCallTestPanel({ editorService }: ToolCallTestPanelProps) {
  const { canvasText, updateCanvasText, undo, redo } = editorService;
  const [selectedFunction, setSelectedFunction] = useState(FUNCTION_DECLARATIONS[0].name);
  const [inputText, setInputText] = useState('');
  const [resultText, setResultText] = useState('');
  const [showResult, setShowResult] = useState(false);

  const functionCallHandler = useCallback(
    createFunctionCallHandler({
      canvasText,
      updateCanvasText,
      undo,
      redo
    }),
    [canvasText, updateCanvasText, undo, redo]
  );

  // Get the current function declaration
  const currentFunction = FUNCTION_DECLARATIONS.find((func) => func.name === selectedFunction);

  // Check if the current function requires parameters
  const requiresTextInput = currentFunction?.parameters?.properties?.text !== undefined;

  // Handler for executing the selected function
  const handleExecuteFunction = () => {
    if (requiresTextInput && !inputText.trim()) {
      console.warn('Please enter required text input');

      return;
    }

    // Prepare args based on function requirements
    const args = requiresTextInput ? { text: inputText } : {};

    // Create a function call for the selected function
    const functionCall: LiveFunctionCall = {
      name: selectedFunction,
      args,
      id: Date.now().toString()
    };

    // Execute the function call
    const response = functionCallHandler(functionCall);

    // Handle response based on function type
    if (selectedFunction === 'get_editor_artifact' && response.response.success) {
      const artifact = response.response.artifact || '';
      setInputText(artifact);
      setResultText(artifact);
      setShowResult(true);
    } else {
      setShowResult(false);
    }

    // Log the result
    console.log(
      response.response.success || response.response.output?.success
        ? `${selectedFunction} Success:`
        : `${selectedFunction} Failed:`,
      response.response.error || response.response.output?.error || 'Operation completed successfully'
    );
  };

  // Function to get a readable name from the function name
  const getFunctionDisplayName = (name: string) => {
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Reset the result when changing functions
  const handleFunctionChange = (value: string) => {
    setSelectedFunction(value);
    setShowResult(false);
  };

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='text-sm font-medium'>Tool Call Test Panel</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='function-select'>Select Function</Label>
          <Select value={selectedFunction} onValueChange={handleFunctionChange}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select a function' />
            </SelectTrigger>
            <SelectContent>
              {FUNCTION_DECLARATIONS.map((func) => (
                <SelectItem key={func.name} value={func.name}>
                  {getFunctionDisplayName(func.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {requiresTextInput && (
          <div className='space-y-2'>
            <Label htmlFor='functionInput'>Text Input</Label>
            <Textarea
              id='functionInput'
              className='min-h-[100px] resize-none'
              placeholder='Enter text input'
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>
        )}

        {showResult && (
          <div className='space-y-2'>
            <Label htmlFor='resultOutput'>Result</Label>
            <div className='bg-muted/20 min-h-[100px] overflow-auto rounded-md border p-2 whitespace-pre-wrap'>
              {resultText || 'No content returned'}
            </div>
          </div>
        )}

        <div className='flex'>
          <Button size='sm' variant='default' onClick={handleExecuteFunction} className='flex-1'>
            Execute {getFunctionDisplayName(selectedFunction)}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
