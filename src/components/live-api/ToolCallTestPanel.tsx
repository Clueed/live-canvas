"use client";

import React, { useCallback, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TOOL_CALL_FUNCTIONS } from "@/lib/editor";
import { createFunctionCallHandler } from "@/lib/tool-call-handlers";
import type { LiveFunctionCall } from "@/types/multimodal-live-types";
import type { PlateEditor } from "@udecode/plate/react";

interface ToolCallTestPanelProps {
  editor: PlateEditor;
}

export function ToolCallTestPanel({ editor }: ToolCallTestPanelProps) {
  const [selectedFunction, setSelectedFunction] = useState(
    TOOL_CALL_FUNCTIONS[0].declaration.name,
  );
  const [inputText, setInputText] = useState("");
  const [resultText, setResultText] = useState("");
  const [showResult, setShowResult] = useState(false);

  const functionCallHandler = createFunctionCallHandler(editor);

  const currentFunction = TOOL_CALL_FUNCTIONS.find(
    (func) => func.declaration.name === selectedFunction,
  );
  const requiresTextInput = !!(
    currentFunction?.declaration.parameters &&
    typeof currentFunction.declaration.parameters === "object" &&
    "properties" in currentFunction.declaration.parameters &&
    currentFunction.declaration.parameters.properties &&
    "text" in currentFunction.declaration.parameters.properties
  );

  const handleExecuteFunction = () => {
    let args = {};
    if (requiresTextInput) {
      try {
        args = JSON.parse(inputText);
      } catch {
        args = { text: inputText };
      }
    }
    const functionCall: LiveFunctionCall = {
      name: selectedFunction,
      args,
      id: Date.now().toString(),
    };
    const response = functionCallHandler(functionCall);
    setResultText(JSON.stringify(response, null, 2));
    setShowResult(true);
  };

  const getFunctionDisplayName = (name: string) => {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleSelectFunction = (value: string) => {
    setSelectedFunction(value);
    setInputText("");
    setShowResult(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Tool Call Test Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="function-select">Select Function</Label>
          <Select value={selectedFunction} onValueChange={handleSelectFunction}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a function" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Editor Tools</SelectLabel>
                {TOOL_CALL_FUNCTIONS.map((func) => (
                  <SelectItem
                    key={func.declaration.name}
                    value={func.declaration.name}
                  >
                    {getFunctionDisplayName(func.declaration.name)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {requiresTextInput && (
          <div className="space-y-2">
            <Label htmlFor="functionInput">Text Input</Label>
            <Textarea
              id="functionInput"
              className="min-h-[100px] resize-none"
              placeholder="Enter text input (or JSON object if required)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>
        )}

        {showResult && (
          <div className="space-y-2">
            <Label htmlFor="resultOutput">Result</Label>
            <div className="bg-muted/20 min-h-[100px] overflow-auto rounded-md border p-2 whitespace-pre-wrap">
              {resultText || "No content returned"}
            </div>
          </div>
        )}

        <div className="flex">
          <Button
            size="sm"
            variant="default"
            onClick={handleExecuteFunction}
            className="flex-1"
          >
            Execute {getFunctionDisplayName(selectedFunction)}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
