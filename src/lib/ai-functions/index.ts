import { redoOperation, undoOperation } from "./editor-history-ai-functions";
import {
  getSelectionOperation,
  setSelectionOperation,
} from "./editor-selection-ai-functions";
import {
  getEditorArtifactOperation,
  replaceTextOperation,
} from "./editor-text-ai-functions";

export const AI_FUNCTIONS = [
  getEditorArtifactOperation,
  // setEditorArtifactOperation,
  undoOperation,
  redoOperation,
  getSelectionOperation,
  setSelectionOperation,
  replaceTextOperation,
] as const;

export * from "./editor-history-ai-functions";
export * from "./editor-selection-ai-functions";
export * from "./editor-text-ai-functions";
