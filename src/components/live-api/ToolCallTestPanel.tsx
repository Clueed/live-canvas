'use client';

import React, { useCallback, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EDITOR_FUNCTION_DECLARATIONS } from '@/lib/editor/function-declarations';
import { createFunctionCallHandler } from '@/lib/tool-call-handlers';
import { LiveFunctionCall } from '@/types/multimodal-live-types';
import { type PlateEditor } from '@udecode/plate/react';

import { AlertCircle, X } from 'lucide-react';

interface ToolCallTestPanelProps {
  editor: PlateEditor;
}

export function ToolCallTestPanel({ editor }: ToolCallTestPanelProps) {
  const [selectedFunction, setSelectedFunction] = useState(EDITOR_FUNCTION_DECLARATIONS[0].name);
  const [inputText, setInputText] = useState('');
  const [resultText, setResultText] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const functionCallHandler = useCallback(createFunctionCallHandler(editor), [editor]);

  const currentFunction = EDITOR_FUNCTION_DECLARATIONS.find((func) => func.name === selectedFunction);
  const requiresTextInput = currentFunction?.parameters?.properties?.text !== undefined;

  // Handler for executing the selected function
  const handleExecuteFunction = () => {
    // Clear any previous errors
    setError(null);

    if (requiresTextInput && !inputText.trim()) {
      setError('Please enter required text input');

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

    try {
      // Execute the function call
      const response = functionCallHandler(functionCall);

      // Extract error message from the response, handle different response structures
      let responseError: string | undefined;
      if (typeof response.response === 'object' && response.response && 'error' in response.response) {
        responseError = typeof response.response.error === 'string' ? response.response.error : undefined;
      } else if (
        typeof response.response === 'object' &&
        response.response &&
        'output' in response.response &&
        typeof response.response.output === 'object' &&
        response.response.output &&
        'error' in response.response.output
      ) {
        responseError = typeof response.response.output.error === 'string' ? response.response.output.error : undefined;
      }

      if (responseError) {
        setError(responseError);
        setShowResult(false);

        return;
      }

      // Format the response as JSON for display
      const formattedResult = JSON.stringify(response.response, null, 2);
      setResultText(formattedResult);
      setShowResult(true);

      // Special case for get_editor_artifact to maintain existing functionality
      if (
        selectedFunction === 'get_editor_artifact' &&
        typeof response.response === 'object' &&
        response.response &&
        'artifact' in response.response
      ) {
        if (typeof response.response.artifact === 'string') {
          setInputText(response.response.artifact);
        } else {
          setInputText('');
        }
      }

      // Log the result
      const isSuccess =
        (typeof response.response === 'object' &&
          response.response &&
          'success' in response.response &&
          response.response.success) ||
        (typeof response.response === 'object' &&
          response.response &&
          'output' in response.response &&
          typeof response.response.output === 'object' &&
          response.response.output &&
          'success' in response.response.output &&
          response.response.output.success);

      console.log(
        isSuccess ? `${selectedFunction} Success:` : `${selectedFunction} Failed:`,
        responseError || 'Operation completed successfully',
        response.response
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error executing function:', err);
    }
  };

  // Function to get a readable name from the function name
  const getFunctionDisplayName = (name: string) => {
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Reset the result when changing functions
  const handleSelectFunction = (value: string) => {
    setSelectedFunction(value);
    const currentFunction = EDITOR_FUNCTION_DECLARATIONS.find((func) => func.name === value);
    if (currentFunction && currentFunction.parameters) {
      const initialParams = Object.fromEntries(
        Object.entries(currentFunction.parameters.properties)
          .filter(([key, prop]) => prop.type === 'string')
          .map(([key, prop]) => [key, ''])
      );
      setInputText(JSON.stringify(initialParams));
    }
    setShowResult(false);
    setError(null);
  };

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='text-sm font-medium'>Tool Call Test Panel</CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {error && (
          <Alert variant='destructive' className='relative mb-4'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button variant='ghost' size='icon' className='absolute top-1 right-1' onClick={() => setError(null)}>
              <X className='h-4 w-4' />
              <span className='sr-only'>Dismiss</span>
            </Button>
          </Alert>
        )}

        <div className='space-y-2'>
          <Label htmlFor='function-select'>Select Function</Label>
          <Select value={selectedFunction} onValueChange={handleSelectFunction}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Select a function' />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Editor Tools</SelectLabel>
                {EDITOR_FUNCTION_DECLARATIONS.map((func) => (
                  <SelectItem key={func.name} value={func.name}>
                    {getFunctionDisplayName(func.name)}
                  </SelectItem>
                ))}
              </SelectGroup>
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
