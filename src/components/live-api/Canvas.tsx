import React from 'react';

import { Textarea } from '@/components/ui/textarea';

// Import shadcn Textarea

interface CanvasProps {
    text: string;
    onChange: (newText: string) => void;
}

// Using a functional component directly with memo
const CanvasComponent = React.memo(function CanvasComponent({ text, onChange }: CanvasProps) {
    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(event.target.value);
    };

    return (
        // Assuming the parent container will manage the sizing.
        // Added flex-1 to make it fill available space in a flex container.
        // Added min-h-0 to prevent textarea from overflowing flex container.
        <Textarea
            className='h-full min-h-0 w-full flex-1 resize-none rounded-md border p-4' // Added basic styling and flex behavior
            value={text}
            onChange={handleChange}
            placeholder='AI output will appear here...' // Added placeholder
        />
    );
});

export const Canvas = CanvasComponent; // Exporting the memoized component
