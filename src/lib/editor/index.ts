import type { EditorOperationResult } from "@/hooks/use-tool-call-handler";
import type { FunctionDeclaration } from "@google/generative-ai";
import type { PlateEditor } from "@udecode/plate/react";

import { redoOperation, undoOperation } from "./history-operations";
import {
  getSelectionOperation,
  setSelectionOperation,
} from "./selection-operations";
import {
  getEditorArtifactOperation,
  setEditorArtifactOperation,
} from "./text-operations";
import type { ZodSchema, } from "zod";

export interface FunctionOperation {
  declaration: FunctionDeclaration;
  create: (editor: PlateEditor) => (...args: unknown[]) => EditorOperationResult;
  paramsSchema?: ZodSchema<unknown, unknown>;
}

export const TOOL_CALL_FUNCTIONS = [
  getEditorArtifactOperation,
  setEditorArtifactOperation,
  undoOperation,
  redoOperation,
  getSelectionOperation,
  setSelectionOperation,
] as FunctionOperation[];

// Re-export all types and modules for easy access
export * from "./types";
export * from "./text-operations";
export * from "./history-operations";
export * from "./selection-operations";
