import { Editor, EditorContainer } from "@/components/ui/editor";

import { Plate, type PlateEditor } from "platejs/react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

interface CanvasProps {
  editor: PlateEditor;
}

const CanvasComponent = ({ editor }: CanvasProps) => {
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
