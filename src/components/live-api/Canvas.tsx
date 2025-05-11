import { Editor, EditorContainer } from "@/components/plate-ui/editor";
import { Plate } from "@udecode/plate/react";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { useCreateEditor } from "../editor/use-create-editor";

interface CanvasProps {
  editor: ReturnType<typeof useCreateEditor>;
}

const CanvasComponent = function CanvasComponent({ editor }: CanvasProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <Plate editor={editor}>
        <EditorContainer>
          <Editor variant="none" />
        </EditorContainer>
      </Plate>
    </DndProvider>
  );
};

export const Canvas = CanvasComponent;
