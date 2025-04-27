import { FunctionDeclaration, SchemaType } from '@google/generative-ai';

export const SYSTEM_PROMPT = `
You're the core logic agent of a web application where users have a chat window and an editor to display an artifact.
Artifacts can be any sort of writing content, emails, code, or other creative writing work. Think of artifacts as content, or writing you might find on a blog, Google doc, or other writing platform.
You interact with the editor through the use of tools provided to you.

Thus, you need to clearly differentiate between the user's primary intention and the artifact they are interacting with. You should always respond in the chat window, and never in the editor.

**When to call editor tools:**  
• For any direct modification of the artifact (insertions, deletions, rewrites, formatting) that should appear in the editor pane.  

**When not to call editor tools:**  
• For general explanations, clarifying questions, or conversational replies—those belong in chat. 

Best practices:
- If you receive directons about the current artifact (change request, feedback, etc.) you should in most cases respond by directly editing the artifact in the editor. Only if absolutely neccessary should you respond in the chat, i.e., ask follow-up questions or ask for confirmation.
- Tailor the level of structure—such as headings, sub-headings, and horizontal lines—to the length of the text: short snippets (up to one page) do not require headings unless explicitly requested; longer documents should leverage headings, sub-headings, and other layout elements for clarity and navigation.
- For long explanations that appear unstructured or brainstorming-like, format each logical topic as a bullet point, facilitating easy rearrangement later.
`.trim();

export const setEditorArtifact: FunctionDeclaration = {
  name: 'set_editor_artifact',
  description: `
Replaces the entire content of the user's artifact in the editor, which supports Markdown formatting (headings, lists, code blocks, etc.).  
Use this when you've generated or revised a complete draft and want to display it. 
Does *not* merge with existing text; always supplies a full artifact string.  
    `.trim(),
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      text: {
        type: SchemaType.STRING,
        description: 'Complete artifact content.'
      }
    },
    required: ['text']
  }
};

export const getEditorArtifact: FunctionDeclaration = {
  name: 'get_editor_artifact',
  description: `
Fetches the current text of the artifact in the editor, including any Markdown syntax.  
Use this to read or reference what's already displayed before deciding edits.  
Returns a single string with the full artifact content (Markdown intact)
`.trim(),
  parameters: {
    type: SchemaType.OBJECT,
    properties: {},
    required: []
  }
};

export const undoLastArtifactChange: FunctionDeclaration = {
  name: 'undo_last_artifact_change',
  description: `
Reverts the most recent modification made to the artifact in the editor, typically when the user explicitly asks to undo.
Returns an operation result with success status, error message if failed, and current content after the undo operation.
`.trim(),
  parameters: {
    type: SchemaType.OBJECT,
    properties: {},
    required: []
  }
};

export const redoLastArtifactUndo: FunctionDeclaration = {
  name: 'redo_last_artifact_undo',
  description: `
Reapplies the last artifact change that was undone, typically when the user explicitly asks to redo.
Returns an operation result with success status, error message if failed, and current content after the redo operation.
`.trim(),
  parameters: {
    type: SchemaType.OBJECT,
    properties: {},
    required: []
  }
};

export const getEditorSelection: FunctionDeclaration = {
  name: 'get_editor_selection',
  description: `
Retrieves the current selection range in the editor in a human-readable format.
Returns a selection object with the following properties:
- startParagraphIndex: The paragraph index at the start of the selection
- endParagraphIndex: The paragraph index at the end of the selection
- selectedText: The actual text content that is selected

Use this when you need to know what text is currently selected by the user or the current cursor position.
`.trim(),
  parameters: {
    type: SchemaType.OBJECT,
    properties: {},
    required: []
  }
};

export const setEditorSelection: FunctionDeclaration = {
  name: 'set_editor_selection',
  description: `
Sets the selection in the editor to span a specific range of paragraphs and select the specified text within that range.
Use this to programmatically select a specific piece of text identified by its content and the paragraphs it spans.
`.trim(),
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      startParagraphIndex: {
        type: SchemaType.NUMBER,
        description: 'The 0-based index of the paragraph where the selection should start.'
      },
      endParagraphIndex: {
        type: SchemaType.NUMBER,
        description: 'The 0-based index of the paragraph where the selection should end (inclusive).'
      },
      selectedText: {
        type: SchemaType.STRING,
        description: 'The exact text content that should be selected within the specified paragraph range.'
      }
    },
    required: ['startParagraphIndex', 'endParagraphIndex', 'selectedText']
  }
};

export const FUNCTION_DECLARATIONS = [
  setEditorArtifact,
  getEditorArtifact,
  undoLastArtifactChange,
  redoLastArtifactUndo,
  getEditorSelection,
  setEditorSelection
];
