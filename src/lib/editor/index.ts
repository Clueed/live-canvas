import { EditorOperationResult } from '@/hooks/use-tool-call-handler';
import { FunctionDeclaration } from '@google/generative-ai';
import { PlateEditor } from '@udecode/plate/react';

import { redoOperation, undoOperation } from './history-operations';
import { getSelectionOperation, setSelectionOperation } from './selection-operations';
import { getEditorArtifactOperation, setEditorArtifactOperation } from './text-operations';
import { EditorService } from './types';
import { ZodSchema, ZodTypeDef } from 'zod';

interface FunctionOperation<Output, Def extends ZodTypeDef> {
  declaration: FunctionDeclaration;
  create: (editor: PlateEditor) => (...args: any[]) => EditorOperationResult;
  paramsSchema?: ZodSchema<Output, Def>;
}

export const TOOL_CALL_FUNCTIONS: FunctionOperation<any, any>[] = [
  getEditorArtifactOperation,
  setEditorArtifactOperation,
  undoOperation,
  redoOperation,
  getSelectionOperation,
  setSelectionOperation
];

// Re-export all types and modules for easy access
export * from './types';
export * from './text-operations';
export * from './history-operations';
export * from './selection-operations';
export * from './function-declarations';
