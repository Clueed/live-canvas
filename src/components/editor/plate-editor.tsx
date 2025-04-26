'use client';

import { useCreateEditor } from '@/components/editor/use-create-editor';
import { Editor, EditorContainer } from '@/components/plate-ui/editor';
import { Plate } from '@udecode/plate/react';

export function PlateEditor() {
    const editor = useCreateEditor();

    

    return (
        <Plate editor={editor}>
            <EditorContainer>
                <Editor variant='demo' placeholder='Type...' />
            </EditorContainer>
        </Plate>
    );
}
