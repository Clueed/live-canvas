import { EditorOperationResult } from '@/hooks/use-tool-call-handler';
import { FunctionDeclaration } from '@google/generative-ai';
import { PlateEditor } from '@udecode/plate/react';

import { redoOperation, undoOperation } from './history-operations';
import { getSelectionOperation, setSelectionOperation } from './selection-operations';
import { getEditorArtifactOperation, setEditorArtifactOperation } from './text-operations';
import { EditorService } from './types';
import { ZodSchema, ZodTypeDef } from 'zod';

export interface FunctionOperation {
  declaration: FunctionDeclaration;
  create: (editor: PlateEditor) => (...args: any[]) => EditorOperationResult;
  paramsSchema?: ZodSchema<any, any>;
}

export const TOOL_CALL_FUNCTIONS = [
  getEditorArtifactOperation,
  setEditorArtifactOperation,
  undoOperation,
  redoOperation,
  getSelectionOperation,
  setSelectionOperation
] as FunctionOperation[];

// Re-export all types and modules for easy access
export * from './types';
export * from './text-operations';
export * from './history-operations';
export * from './selection-operations';
