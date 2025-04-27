# Editor Selection Functionality

## Purpose

This documentation outlines how the application programmatically retrieves and sets the user's text selection within the editor artifact. This is primarily used by the AI agent to understand the user's context (what they have selected) or to draw the user's attention to a specific part of the artifact by selecting it.

## Components Involved

- **`src/lib/prompts.ts`**: Defines the `getEditorSelection` and `setEditorSelection` function declarations, specifying their names, descriptions, and expected parameters (`startParagraphIndex`, `endParagraphIndex`, `selectedText` for setting) for the AI agent.
- **`src/lib/tool-call-handlers.ts`**: Contains the `createFunctionCallHandler`, which receives tool calls from the AI agent. It handles the `get_editor_selection` and `set_editor_selection` calls, parses arguments, invokes the appropriate `EditorService` method, and formats the response.
- **`src/lib/editor-service.ts`**: Provides the core implementation (`getReadableSelection` and `setSelection` methods) for interacting with the PlateEditor instance. It translates between the high-level paragraph/text-based selection requests and the underlying Slate.js selection model (Paths and Offsets).

## Functionality Breakdown

### 1. Getting the Selection (`getEditorSelection`)

- **Purpose:** To allow the AI agent to determine what text (if any) the user currently has selected in the editor.
- **Flow:**
  1.  Agent calls the `get_editor_selection` tool.
  2.  `tool-call-handlers.ts` receives the call and invokes `editorService.getReadableSelection()`.
  3.  `editor-service.ts` accesses the editor's current `selection` (a Slate `BaseRange`).
  4.  It calculates the corresponding start and end paragraph indices and extracts the selected text content.
  5.  It returns an `EditorOperationResult` containing `{ success: true, selection: { startParagraphIndex, endParagraphIndex, selectedText } }` or `{ success: false, error: '...' }`.
  6.  `tool-call-handlers.ts` sends this result back to the agent.

### 2. Setting the Selection (`setEditorSelection`)

- **Purpose:** To allow the AI agent to programmatically select a specific piece of text within the editor, guiding the user's focus.
- **Flow:**
  1.  Agent calls the `set_editor_selection` tool with `startParagraphIndex`, `endParagraphIndex`, and the exact `selectedText` to highlight.
  2.  `tool-call-handlers.ts` receives the call, validates arguments, and invokes `editorService.setSelection(startParagraphIndex, endParagraphIndex, selectedText)`.
  3.  `editor-service.ts` performs the following:
      a. Validates the input parameters (indices, non-empty text).
      b. Extracts the combined text content from the paragraphs between `startParagraphIndex` and `endParagraphIndex`.
      c. Finds the first occurrence of `selectedText` within the extracted content.
      d. Calculates the precise Slate `Point` (Path and Offset) corresponding to the start and end of the found `selectedText`. This involves mapping the character index back to the editor's node structure.
      e. Uses `editor.tf.select()` to apply the calculated `BaseRange` to the editor.
      f. Returns an `EditorOperationResult` indicating success or failure (`{ success: true }` or `{ success: false, error: '...' }`).
  4.  `tool-call-handlers.ts` sends this result back to the agent.

## Interactions

- The selection tools bridge the gap between the AI agent's high-level understanding (paragraphs, text content) and the editor's low-level representation (Slate nodes, paths, offsets).
- `EditorService` encapsulates the complexities of interacting with the PlateEditor/Slate API for selection manipulation.
