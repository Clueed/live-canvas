import { redoOperation, undoOperation } from "./history-operations";
import {
  getSelectionOperation,
  setSelectionOperation,
} from "./selection-operations";
import {
  getEditorArtifactOperation,
  setEditorArtifactOperation,
} from "./text-operations";

export const TOOL_CALL_FUNCTIONS = [
  getEditorArtifactOperation,
  setEditorArtifactOperation,
  undoOperation,
  redoOperation,
  getSelectionOperation,
  setSelectionOperation,
] as const;

export * from "./history-operations";
export * from "./selection-operations";
export * from "./text-operations";
