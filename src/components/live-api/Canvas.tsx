import React, { useCallback, useEffect, useState } from 'react';

import { useCreateEditor } from '@/components/editor/use-create-editor';
import { Editor, EditorContainer } from '@/components/plate-ui/editor';
import { StrikethroughPlugin } from '@udecode/plate-basic-marks/react';
import { MarkdownPlugin } from '@udecode/plate-markdown';
import { Plate } from '@udecode/plate/react';

import remarkGfm from 'remark-gfm';
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
    // Use the default editor configuration from useCreateEditor
    // which already includes StrikethroughPlugin and other needed plugins
    const editor = useCreateEditor();

    useEffect(() => {
        try {
            // Serialize the current editor value to compare
            const currentSerializedValue = editor.api.markdown.serialize();

            // Only deserialize and reset if the incoming text is different
            if (text !== currentSerializedValue) {
                const deserializedValue = editor.api.markdown.deserialize(text);
            }
        } catch (error) {
            console.error('Error handling markdown:', error);
        }
    }, [text, editor]); // Rerun when text prop or editor instance changes

    return (
        <Plate
            editor={editor}
            onChange={() => {
                try {
                    const markdown = editor.api.markdown.serialize();
                    onChange(markdown);
                } catch (error) {
                    console.error('Error serializing markdown:', error);
                }
            }}>
            <EditorContainer>
                <Editor variant='demo' placeholder='Type...' />
            </EditorContainer>
        </Plate>
    );
});

export const Canvas = CanvasComponent;
