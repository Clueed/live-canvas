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

/**
 * Object map of function declarations by name.
 * Useful for looking up a specific declaration by its name.
 */
export const EDITOR_FUNCTION_MAP: Record<string, FunctionDeclaration> = {
  [setEditorArtifactOperation.declaration.name]: setEditorArtifactOperation.declaration,
  [getEditorArtifactOperation.declaration.name]: getEditorArtifactOperation.declaration,
  [undoOperation.declaration.name]: undoOperation.declaration,
  [redoOperation.declaration.name]: redoOperation.declaration,
  [getSelectionOperation.declaration.name]: getSelectionOperation.declaration,
  [setSelectionOperation.declaration.name]: setSelectionOperation.declaration
};
