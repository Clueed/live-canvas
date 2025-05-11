import { redoOperation, undoOperation } from "./editor-history-ai-functions";
import {
  getSelectionOperation,
  setSelectionOperation,
} from "./editor-selection-ai-functions";
import {
  getEditorArtifactOperation,
  replaceTextOperation,
  setEditorArtifactOperation,
} from "./editor-text-ai-functions";
import { performComplexEditOperation } from "./perform-complex-edit-ai-function";

export type AiFunctionList =
  | typeof PERFORM_COMPLEX_EDIT_FUNCTIONS
  | typeof AI_FUNCTIONS;

export const PERFORM_COMPLEX_EDIT_FUNCTIONS = [
  getEditorArtifactOperation,
  setEditorArtifactOperation,
  replaceTextOperation,
  undoOperation,
  redoOperation,
] as const;

export const AI_FUNCTIONS = [
  getEditorArtifactOperation,
  undoOperation,
  redoOperation,
  getSelectionOperation,
  setSelectionOperation,
  replaceTextOperation,
  performComplexEditOperation,
] as const;

export * from "./editor-history-ai-functions";
export * from "./editor-selection-ai-functions";
export * from "./editor-text-ai-functions";
export * from "./perform-complex-edit-ai-function";
