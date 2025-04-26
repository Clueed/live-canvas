import { BaseEditor } from 'slate';
import { ReactEditor } from 'slate-react';

// Define custom types for Slate as per docts
export type CustomElement = { type: 'paragraph'; children: CustomText[] };
export type CustomText = { text: string };

declare module 'slate' {
    interface CustomTypes {
        Editor: BaseEditor & ReactEditor;
        Element: CustomElement;
        Text: CustomText;
    }
}
