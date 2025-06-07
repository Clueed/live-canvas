"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import { AI_FUNCTIONS } from "@/lib/ai-functions/helpers";
import { createFunctionCallHandler } from "@/lib/tool-call-handlers";
import { cn } from "@/utils/cn";
import type { FunctionCall } from "@google/genai";
import type { PlateEditor } from "@udecode/plate/react";
import { type ChangeEvent, type FocusEvent, useEffect, useState } from "react";

// Define ParameterSchema locally as it's not exported from the types file
interface ParameterSchema {
  type: "string" | "number" | "integer" | "boolean" | "array" | "object";
  description?: string;
  enum?: Array<string | number | boolean>;
  default?: string | number | boolean | object | Array<unknown>;
  items?: ParameterSchema; // For array type
  properties?: Record<string, ParameterSchema>; // For object type
  required?: string[];
}

interface ToolCallTestPanelProps {
  editor: PlateEditor;
}

export function ToolCallTestPanel({ editor }: ToolCallTestPanelProps) {
  const [selectedFunction, setSelectedFunction] = useState(
    AI_FUNCTIONS[0].declaration.name,
  );
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [resultText, setResultText] = useState("");
  const [showResult, setShowResult] = useState(false);

  const functionCallHandler = createFunctionCallHandler(editor, AI_FUNCTIONS);

  const currentFunction = AI_FUNCTIONS.find(
    (func) => func.declaration.name === selectedFunction,
  );

  useEffect(() => {
    const newFormValues: Record<string, unknown> = {};
    if (currentFunction?.declaration.parameters?.properties) {
      for (const paramName in currentFunction.declaration.parameters
        .properties) {
        const paramDetails = currentFunction.declaration.parameters.properties[
          paramName
        ] as ParameterSchema;
        if (typeof paramDetails === "object" && paramDetails !== null) {
          if (paramDetails.default !== undefined) {
            newFormValues[paramName] = paramDetails.default;
          } else if (paramDetails.type === "boolean") {
            newFormValues[paramName] = false;
          } else if (
            paramDetails.type === "number" ||
            paramDetails.type === "integer"
          ) {
            newFormValues[paramName] = 0;
          } else {
            newFormValues[paramName] = "";
          }
        }
      }
    }
    setFormValues(newFormValues);
    setShowResult(false);
    setResultText("");
  }, [currentFunction]);

  const handleInputChange = (paramName: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [paramName]: value }));
  };

  const handleExecuteFunction = () => {
    const functionCall: FunctionCall = {
      name: selectedFunction,
      args: { ...formValues }, // Args are now taken from formValues
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
  };

  const renderFormField = (
    paramName: string,
    paramDetails: ParameterSchema,
  ) => {
    if (typeof paramDetails !== "object" || paramDetails === null) {
      return null;
    }

    const paramLabel = paramDetails.description || paramName;

    if (paramDetails.enum && Array.isArray(paramDetails.enum)) {
      return (
        <div key={paramName} className="space-y-2">
          <Label htmlFor={`param-${paramName}`}>{paramLabel}</Label>
          <Select
            value={(formValues[paramName] as string) || ""}
            onValueChange={(value: string) =>
              handleInputChange(paramName, value)
            }
          >
            <SelectTrigger id={`param-${paramName}`} className="w-full">
              <SelectValue placeholder={`Select ${paramName}`} />
            </SelectTrigger>
            <SelectContent>
              {paramDetails.enum.map((enumValue: string | number | boolean) => (
                <SelectItem key={String(enumValue)} value={String(enumValue)}>
                  {String(enumValue)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    switch (paramDetails.type) {
      case "string":
        return (
          <div key={paramName} className="space-y-2">
            <Label htmlFor={`param-${paramName}`}>{paramLabel}</Label>
            <Textarea
              id={`param-${paramName}`}
              className="min-h-[60px] resize-none"
              placeholder={paramDetails.description || `Enter ${paramName}`}
              value={(formValues[paramName] as string) || ""}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                handleInputChange(paramName, e.target.value)
              }
            />
          </div>
        );
      case "number":
      case "integer":
        return (
          <div key={paramName} className="space-y-2">
            <Label htmlFor={`param-${paramName}`}>{paramLabel}</Label>
            <Input
              id={`param-${paramName}`}
              type="number"
              placeholder={paramDetails.description || `Enter ${paramName}`}
              value={(formValues[paramName] as number) || 0}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleInputChange(
                  paramName,
                  Number.parseFloat(e.target.value) || 0,
                )
              }
            />
          </div>
        );
      case "boolean":
        return (
          <div key={paramName} className="flex items-center space-x-2 py-2">
            <Checkbox
              id={`param-${paramName}`}
              checked={!!formValues[paramName]}
              onCheckedChange={
                (checked: boolean | "indeterminate") =>
                  handleInputChange(paramName, !!checked) // Ensure it's always boolean
              }
            />
            <Label htmlFor={`param-${paramName}`} className="cursor-pointer">
              {paramLabel}
            </Label>
          </div>
        );
      case "object":
      case "array":
        return (
          <div key={paramName} className="space-y-2">
            <Label htmlFor={`param-${paramName}`}>{paramLabel} (JSON)</Label>
            <Textarea
              id={`param-${paramName}`}
              className="min-h-[100px] resize-none font-mono text-xs"
              placeholder={
                paramDetails.description || `Enter JSON for ${paramName}`
              }
              value={
                typeof formValues[paramName] === "string"
                  ? (formValues[paramName] as string)
                  : JSON.stringify(formValues[paramName], null, 2) || ""
              }
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                handleInputChange(paramName, e.target.value)
              }
              onBlur={(e: FocusEvent<HTMLTextAreaElement>) => {
                try {
                  if (typeof e.target.value === "string") {
                    const parsed = JSON.parse(e.target.value);
                    handleInputChange(
                      paramName,
                      JSON.stringify(parsed, null, 2),
                    );
                  }
                } catch (error) {
                  // If not valid JSON, keep as is, or provide user feedback
                }
              }}
            />
          </div>
        );
      default:
        // Fallback for other/unknown types, treat as text input
        return (
          <div key={paramName} className="space-y-2">
            <Label htmlFor={`param-${paramName}`}>{paramLabel} (Text)</Label>
            <Input
              id={`param-${paramName}`}
              placeholder={paramDetails.description || `Enter ${paramName}`}
              value={(formValues[paramName] as string) || ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleInputChange(paramName, e.target.value)
              }
            />
          </div>
        );
    }
  };

  return (
    <Card className={cn("w-full")}>
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
                {AI_FUNCTIONS.map((func) => (
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

        {currentFunction?.declaration.parameters?.properties &&
          Object.entries(currentFunction.declaration.parameters.properties).map(
            ([paramName, paramDetails]) =>
              renderFormField(paramName, paramDetails as ParameterSchema),
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

        {showResult && (
          <div className="space-y-2">
            <Label htmlFor="resultOutput">Result</Label>
            <div className="bg-muted/20 min-h-[100px] overflow-auto rounded-md border p-2 whitespace-pre-wrap">
              {resultText || "No content returned"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
