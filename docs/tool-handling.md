# Tool Handling System

## Purpose

The Tool Handling System provides a structured mechanism for processing tool calls from the LiveAPI service to perform operations on the editor canvas. It creates a bridge between the AI/API functionality and the editor, enabling actions like retrieving content, updating content, and managing the edit history through a well-defined interface.

## Key Components

### useToolCallHandler

A React hook that connects the MultimodalLiveClient to the EditorService, enabling the processing of tool calls from the AI service.

**Responsibilities:**

- Registers event listeners for incoming tool calls from the client
- Creates a function call handler using the EditorService
- Processes tool calls and returns appropriate responses
- Manages the lifecycle of event listeners

### createFunctionCallHandler

A factory function that creates a handler for processing function calls based on the EditorService.

**Responsibilities:**

- Maps function names to specific editor operations
- Validates function arguments
- Executes editor operations through the EditorService
- Formats responses according to the API's expected format
- Handles errors consistently

### ToolCallTestPanel

A UI component that allows manual testing of tool calls in the application.

**Responsibilities:**

- Provides a user interface for selecting and executing function calls
- Displays results and errors from tool call execution
- Enables testing of editor functionality without requiring the full AI interaction flow

## Architecture & Data Flow

The Tool Handling System follows this general flow:

```
MultimodalLiveClient (events) → useToolCallHandler → createFunctionCallHandler → EditorService → Editor
```

1. The `MultimodalLiveClient` emits 'toolcall' events when it receives requests from the AI service
2. The `useToolCallHandler` hook captures these events and processes them
3. Each function call is delegated to the handler created by `createFunctionCallHandler`
4. The handler uses the `EditorService` to perform operations on the editor
5. Results flow back through the chain as responses

## Usage Patterns

### In Application Components

The hook is typically used at the application root level, receiving both the client and editorService:

```tsx
// In src/components/app/LiveCanvasView.tsx
useToolCallHandler({
  client,
  editorService
});
```

### Testing Tool Calls

The `ToolCallTestPanel` component provides a UI for manually testing tool calls:

```tsx
// In a component
<ToolCallTestPanel editorService={editorService} />
```

### Supported Function Calls

The system currently supports these function calls:

1. `set_editor_artifact`: Updates the editor content with provided text
2. `get_editor_artifact`: Retrieves the current editor content
3. `undo_last_artifact_change`: Performs an undo operation on the editor
4. `redo_last_artifact_undo`: Performs a redo operation on the editor

## Design Decisions

### Single Service Object

The system accepts the `EditorService` as a single cohesive object rather than individual functions, which:

- Reduces prop drilling
- Keeps related functionality together
- Makes testing and mocking easier
- Provides a clearer interface boundary

**Rationale**: Treating the EditorService as a unified entity provides better encapsulation and modularity compared to passing individual editor functions.

### Function Call Handler Factory

The system uses a factory pattern for creating function call handlers, which:

- Separates the creation logic from usage
- Makes the code more testable
- Allows for dependency injection of the EditorService

**Rationale**: This approach allows for consistent handling of function calls while enabling testing with mocked services.

### Functional Response Pattern

The system uses structured response objects with `success`, `error`, and `content` fields rather than exceptions, which:

- Makes error conditions explicit
- Provides consistent error reporting
- Aligns with the API's expected response format
- Supports functional programming patterns

**Rationale**: This pattern integrates well with the API's expectations and makes error handling more predictable throughout the application.

## Interactions with Other Systems

- **EditorService**: The tool handling system uses the EditorService to perform operations on the editor
- **MultimodalLiveClient**: It receives tool calls from the client and sends responses back
- **UI Components**: The ToolCallTestPanel provides a user interface for testing tool calls

## Future Enhancements

- Add support for more editor operations beyond the basic CRUD and history management
- Implement validation for tool call arguments
- Add more sophisticated error handling and logging
- Extend the test panel with history and advanced testing capabilities
