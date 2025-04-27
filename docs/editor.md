# Editor Components & Hook (`@udecode/plate`)

This document describes the core UI components and the setup hook used for the rich-text editor based on the `@udecode/plate` library, focusing on the plugin architecture and styling approach.

## UI Components (`src/components/plate-ui/editor.tsx`)

These components provide the main visual structure for the editor.

### `EditorContainer`

A styled wrapper providing the overall container for the editor instance, managing variants (like `default`, `comment`) and focus states using `cva`.

### `Editor`

The main content area where users interact. It renders the editable content via `PlateContent` and applies contextual styling variants (`default`, `ai`, `fullWidth`, etc.) also managed by `cva`.

## Plugin System (`src/components/editor/use-create-editor.ts`)

### `useCreateEditor` Hook

**Purpose:** Initializes and configures the `Plate` editor instance.

**Architecture:**

- **Centralized Configuration:** This hook is the central place where the editor's behavior and features are defined by configuring and combining Plate plugins.
- **Comprehensive Feature Set:** It bundles a wide array of plugins provided by `@udecode/plate` (e.g., basic marks, blocks, media, tables, links) along with custom plugins specific to this application (e.g., AI integration, toolbars).
- **Component Mapping:** Plugins often require corresponding React components for rendering. This hook maps Plate element/leaf types (e.g., `ParagraphPlugin.key`, `BoldPlugin.key`) to specific UI components (e.g., `ParagraphElement`, `PlateLeaf as='strong'`) defined mostly in `src/components/plate-ui/`. It distinguishes between `viewComponents` (for read-only) and `editorComponents` (for interactive elements).
- **Extensibility:** Allows overriding default plugins and component mappings for customization.

**Usage:**

- Called within a component hosting the editor.
- Returns the `editor` object required by the main `<Plate>` provider component.

## Styling Approach

Styling for the editor and its components is primarily handled using:

1.  **Tailwind CSS:** Utility classes are used for the base styling of components.
2.  **`class-variance-authority` (cva):** The `EditorContainer` and `Editor` components use `cva` to define and manage different visual variants (e.g., `variant='comment'`, `focused={true}`). This allows for easy application of conditional styles based on props.
3.  **Component-Specific Styles:** Individual element and leaf components (e.g., `HeadingElement`, `CodeLeaf`, `LinkElement` found in `src/components/plate-ui/`) are responsible for their specific rendering and styling, often using Tailwind CSS directly.

_Note: The detailed list of variants and responsibilities for `Editor` and `EditorContainer` has been condensed for brevity. Refer to the source code (`src/components/plate-ui/editor.tsx`) for specifics._

**Example Usage:**

```typescript
import { Plate } from '@udecode/plate/react';
import { useCreateEditor } from '@/components/editor/use-create-editor';
import { Editor, EditorContainer } from '@/components/plate-ui/editor'; // Assuming Editor component usage

function MyEditorComponent() {
  const editor = useCreateEditor();

  return (
    <Plate editor={editor}>
      <EditorContainer variant="default">
        <Editor />
        {/* Other Plate UI components like Toolbars */}
      </EditorContainer>
    </Plate>
  );
}
```
