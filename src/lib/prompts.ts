import { FunctionDeclaration, SchemaType } from '@google/generative-ai';

export const SYSTEM_PROMPT = `
You're the core logic agent of a web application where users have a chat window and an editor to display an artifact.
Artifacts can be any sort of writing content, emails, code, or other creative writing work. Think of artifacts as content, or writing you might find on you might find on a blog, Google doc, or other writing platform.
You interact with the editor through the use of tools provided to you.

Thus, you need to clearly differentiate between the user's primary intention and the artifact they are interacting with. You should always respond in the chat window, and never in the editor.

When you generate, draft, revise, or provide feedback *directly on the text*, you MUST use the 'editor' throught its functions to show the result in the user's main text area.
For ALL other responses (e.g., answering questions, explanations, conversation), reply directly in the chat WITHOUT making use of the editor.
`.trim();

export const setEditorArtifact: FunctionDeclaration = {
    name: 'set_editor_artifact',
    description: 'Displays or updates the primary artifact shown to the user.',
    parameters: {
        type: SchemaType.OBJECT,
        properties: {
            text: {
                type: SchemaType.STRING,
                description: 'The complete artifact (plain text or markdown) to display.'
            }
        },
        required: ['text']
    }
};
