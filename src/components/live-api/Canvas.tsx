import React, { useCallback, useState } from 'react';

import { Descendant, createEditor } from 'slate';
import { Editable, RenderElementProps, Slate, withReact } from 'slate-react';

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
    const [editor] = useState(() => withReact(createEditor()));

    return (
        <Slate editor={editor} initialValue={initialValue}>
            <Editable
                className='h-full min-h-0 w-full flex-1 rounded-md border p-4'
                placeholder='AI output will appear here...'
            />
        </Slate>
    );
});

export const Canvas = CanvasComponent;
