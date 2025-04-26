import React, { useEffect } from 'react';

import { Editor, EditorContainer } from '@/components/plate-ui/editor';
import { Plate } from '@udecode/plate/react';

import { useCreateEditor } from '../editor/use-create-editor';

interface CanvasProps {
    editor: ReturnType<typeof useCreateEditor>;
}

const CanvasComponent = React.memo(function CanvasComponent({ editor }: CanvasProps) {
    return (
        <Plate editor={editor}>
            <EditorContainer>
                <Editor variant='demo' placeholder='Type...' />
            </EditorContainer>
        </Plate>
    );
});

export const Canvas = CanvasComponent;
