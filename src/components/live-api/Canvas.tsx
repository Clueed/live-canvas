import React, { useCallback, useEffect, useState } from 'react';

import { useCreateEditor } from '@/components/editor/use-create-editor';
import { Editor, EditorContainer } from '@/components/plate-ui/editor';
import { MarkdownPlugin } from '@udecode/plate-markdown';
import { Plate } from '@udecode/plate/react';

import { Descendant } from 'slate';

const initialValue: Descendant[] = [
    {
        type: 'paragraph',
        children: [{ text: 'A line of text in a paragraph.' }]
    }
];

interface CanvasProps {
    text: string;
    onChange: (newText: string) => void;
}

const CanvasComponent = React.memo(function CanvasComponent({ text, onChange }: CanvasProps) {
    const editor = useCreateEditor();

    useEffect(() => {
        // Serialize the current editor value to compare
        const currentSerializedValue = editor.getApi(MarkdownPlugin).markdown.serialize();

        // Only deserialize and reset if the incoming text is different
        if (text !== currentSerializedValue) {
            const deserializedValue = editor.getApi(MarkdownPlugin).markdown.deserialize(text);
            // @ts-expect-error -- editor.reset is not correctly typed by default Plate hooks,
            // but it exists and is the recommended way to replace content.
            editor.reset({ nodes: deserializedValue });
        }
    }, [text, editor]); // Rerun when text prop or editor instance changes

    return (
        <Plate
            editor={editor}
            onChange={() => {
                const markdown = editor.getApi(MarkdownPlugin).markdown.serialize();
                onChange(markdown);
            }}>
            <EditorContainer>
                <Editor variant='demo' placeholder='Type...' />
            </EditorContainer>
        </Plate>
    );
});

export const Canvas = CanvasComponent;
