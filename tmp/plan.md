# Plan: Implement `performComplexEdit` AI Function

This plan outlines the steps to create a new AI function, `performComplexEdit`, which will leverage the Gemini API for complex text manipulation tasks and utilize a dedicated list of existing AI functions as tools.

## 1. Initial Setup and Prerequisite Tool List Definition

*   **Action:** In `src/lib/ai-functions/index.ts`:
    *   Define and export a new array, `PERFORM_COMPLEX_EDIT_TOOLS`.
    *   Populate this list with suitable `AiFunction` objects from the existing AI functions (e.g., `getEditorArtifactOperation`, `replaceTextOperation`, `getSelectionOperation`, `setSelectionOperation`, etc.).
    *   **Crucially, ensure `performComplexEditOperation` (which doesn't exist yet) is NOT included in this list.** This list is for the tools `performComplexEditOperation` will *call*.
*   **Action:** Create a new file: `src/lib/ai-functions/perform-complex-edit-ai-function.ts`.
*   **Action:** Inside `perform-complex-edit-ai-function.ts`, import necessary modules:
    *   `GoogleGenAI`, `FunctionDeclaration`, `Tool`, `Type` from `"@google/generai"`.
    *   `PlateEditor` from `"@udecode/plate/react"`.
    *   `z` from `"zod"`.
    *   `defineAiFunction`, `AiFunction`, `AiFunctionResponse` from `"./helpers"`.
    *   The `PERFORM_COMPLEX_EDIT_TOOLS` array from `"./index"`.
    *   Relevant types for function call handling (e.g., from `src/lib/tool-call-handlers` or `@google/genai`).

## 2. Define `performComplexEditOperation` Structure

*   **Action:** In `perform-complex-edit-ai-function.ts`, define the basic structure for `performComplexEditOperation` using `defineAiFunction`:
    *   **Name:** `perform_complex_edit` (or a similar descriptive name).
    *   **Description:** "Performs complex editing tasks based on a user prompt by leveraging other available editor functions. It can understand the user's intent and orchestrate calls to other tools like text replacement, selection manipulation, or content retrieval to achieve the desired outcome. It manages a multi-turn conversation with the Gemini model to achieve this."
    *   **Parameters (for `perform_complex_edit` itself):**
        *   `prompt`: `Type.STRING` (User's instruction for the complex edit).
    *   **`paramsSchema` (for `perform_complex_edit`):**
        *   `prompt`: `z.string().min(1)`

## 3. Implement Core Logic of `performComplexEditOperation`

*   **Action:** Inside the `create` method of `performComplexEditOperation` (in `perform-complex-edit-ai-function.ts`):
    *   **Initialize Gemini Client:**
        *   Use `new GoogleGenAI(process.env.NEXT_PUBLIC_GCP_API_KEY)`.
    *   **Prepare Tools for Gemini:**
        *   Map the `declaration` property of each `AiFunction` in the imported `PERFORM_COMPLEX_EDIT_TOOLS` to create an array of `FunctionDeclaration` objects.
        *   Construct the `tools` object for the Gemini API (e.g., `[{ functionDeclarations: [...] }]` or `new Types.Tool({ functionDeclarations: [...] })` - verify exact SDK usage).
    *   **Initial API Call:**
        *   Get the generative model (e.g., `gemini-1.5-flash` or as appropriate).
        *   Start a chat session or make the first `generateContent` call using the user's `prompt` (from args) and the prepared `tools`.
        *   Initialize a `history` array for the conversation, starting with the user's prompt and the model's first response.
    *   **Multi-Turn Function Calling Loop:**
        *   Loop while the latest Gemini response (from `chat.sendMessage` or `model.generateContent`) indicates a `functionCall`.
            *   **Process Function Call(s):**
                *   The Gemini response might contain one or more `functionCall` parts.
                *   For each `functionCall` (`fc`):
                    *   **Utilize Shared Handler Logic:** Adapt or directly use a handler mechanism similar to `createFunctionCallHandler(editor)` (from `src/lib/tool-call-handlers`). This handler will operate on the `PERFORM_COMPLEX_EDIT_TOOLS` list.
                    *   Pass `fc.name` and `fc.args` to this handler. The handler is responsible for:
                        *   Finding the corresponding `AiFunction` in `PERFORM_COMPLEX_EDIT_TOOLS`.
                        *   Validating `fc.args` against the `AiFunction`'s `paramsSchema`.
                        *   Calling the `AiFunction`'s `create(editor)` method and then executing it with the validated arguments.
                    *   The handler should return a result that can be formatted into a `FunctionResponsePart` for Gemini (e.g., `{ functionResponse: { name: fc.name, response: { success: true, ...data } or { success: false, error: '...' } } }`).
                *   Collect all such `FunctionResponsePart`s.
            *   **Send Tool Responses back to Gemini:**
                *   If using `chat.sendMessageStream` or `chat.sendMessage`, the history is managed by the chat object. Send the array of `FunctionResponsePart`s.
                *   If making direct `generateContent` calls, add the model's `functionCall` part and your `FunctionResponsePart`(s) to the `history` array.
                *   Make the next call to Gemini (`chat.sendMessage(functionResponseParts)` or `model.generateContent({ contents: history, tools })`).
                *   Update the current Gemini response and add it to history if managing manually.
        *   **If no `functionCall` (i.e., a final text response from Gemini):**
            *   The loop terminates. The last text response from Gemini is the result.
            *   Return this as a successful `AiFunctionResponse` (e.g., `{ success: true, text: geminiResponseText }`).
    *   **Error Handling:**
        *   Implement `try-catch` blocks around API calls and sub-function executions.
        *   If a sub-function execution fails, its error should be packaged as part of its `FunctionResponse` and sent back to Gemini, allowing Gemini to potentially handle or report it.
        *   If the overall `performComplexEditOperation` fails, return an `AiFunctionResponse` with `{ success: false, error: '...' }`.

## 4. Final Integration of `performComplexEditOperation`

*   **Action:** In `perform-complex-edit-ai-function.ts`:
    *   Ensure `performComplexEditOperation` is correctly defined and ready for export.
*   **Action:** In `src/lib/ai-functions/index.ts`:
    *   Import `performComplexEditOperation` from `./perform-complex-edit-ai-function`.
    *   Add `performComplexEditOperation` to the main `AI_FUNCTIONS` array (this makes it callable by other parts of the system, not as a tool for itself).
    *   Add `export * from "./perform-complex-edit-ai-function";` to re-export it.

## 5. Refinements and API Key Management

*   **Action:** Review and verify the exact structure for providing tools to the `@google/genai` Node.js SDK (e.g., `tools: [{ functionDeclarations }]` in `GenerateContentRequest` or `StartChatParams`).
*   **Action:** Confirm `process.env.NEXT_PUBLIC_GCP_API_KEY` is the correct and secure way to access the API key. For server-side operations, "public" keys are generally discouraged if they have broad permissions. Double-check if this key is intended for client-side or if a more secure server-side-only key should be used by this backend function.
*   **Action:** Define a clear contract for what `performComplexEditOperation` returns as its `AiFunctionResponse`. If Gemini's final response is text, it could be `{ success: true, resultText: '...' }` or similar.

This plan should provide a solid foundation for implementing the `performComplexEdit` AI function.