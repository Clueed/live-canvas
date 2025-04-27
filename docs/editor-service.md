# Editor Service

## Purpose

The Editor Service provides a unified abstraction layer for interacting with the editor component in the Live Canvas application. It centralizes all editor operations, standardizes error handling, and eliminates prop drilling by offering a single service object that can be passed to components.

## Key Responsibilities

- Provides access to the editor's content as Markdown text
- Enables updating the editor with new Markdown content
- Manages undo/redo operations with consistent error handling
- Returns structured operation results following functional programming principles

## Architecture

The Editor Service follows a factory pattern:

```
Editor Component (Plate.js) → EditorService → Application Components
```

The service wraps the underlying Plate.js editor instance and exposes a simplified, consistent API that:

1. Abstracts away implementation details of the editor
2. Standardizes error handling across all operations
3. Provides a typed interface for components to consume

## Usage Patterns

### Service Creation

The service is created at the application root level and passed to components:

```tsx
// In src/app/page.tsx
const editor = useCreateEditor();
const editorService = createEditorService(editor);

// Pass to components
<SidePanel send={send} editorService={editorService} />;
```

### Component Consumption

Components should use the service through destructuring:

```tsx
// In a component
function MyComponent({ editorService }: { editorService: EditorService }) {
  const { canvasText, updateCanvasText, undo, redo } = editorService;

  // Use the operations...
}
```

### Tool Call Integration

The service connects with the application's tool call system:

```tsx
// In src/hooks/use-tool-call-handler.ts
useToolCallHandler({
  client,
  ...editorService
});
```

## Design Decisions

### Functional Error Handling

The service uses a functional approach to error handling instead of exceptions:

- Operations return `EditorOperationResult` objects with success/error information
- Components can handle errors explicitly without try/catch blocks
- Follows the "errors as values" principle from functional programming

**Rationale**: This approach integrates better with the existing tool call response pattern and makes error handling more explicit.

### Factory Function vs. Class

The service is implemented as a factory function rather than a class:

```typescript
export function createEditorService(editor: PlateEditor): EditorService {
  // Implementation...
}
```

**Rationale**: This aligns with React's functional programming paradigm, creates simpler objects, and makes testing/mocking easier.

### Generic Result Type

The `EditorOperationResult` type is generic to allow for different content types:

```typescript
interface EditorOperationResult<T = string> {
  success: boolean;
  error?: string;
  content?: T;
}
```

**Rationale**: This design provides flexibility for future operations that may return different types of content.

## Known Limitations

- Type definitions for the Plate.js editor are incomplete, resulting in TypeScript errors related to the markdown property
- The service currently doesn't handle advanced editor operations like selection management or formatting

## Future Enhancements

- Add content validation capabilities
- Add formatting operations
- Implement history navigation beyond simple undo/redo
- Add selection and cursor management
- Add search and replace functionality
