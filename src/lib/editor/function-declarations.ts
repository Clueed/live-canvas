import { FunctionDeclaration } from '@google/generative-ai';

import { redoOperation, undoOperation } from './history-operations';
import { getSelectionOperation, setSelectionOperation } from './selection-operations';
import { getEditorArtifactOperation, setEditorArtifactOperation } from './text-operations';

/**
 * Consolidated list of all editor function declarations.
 * Useful for providing all available tools to the AI model.
 */
export const EDITOR_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  getEditorArtifactOperation.declaration,
  setEditorArtifactOperation.declaration,
  undoOperation.declaration,
  redoOperation.declaration,
  getSelectionOperation.declaration,
  setSelectionOperation.declaration
];
