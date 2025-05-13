import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { PlateEditor } from "@udecode/plate/react";
import { z } from "zod";
import { endTaskOperation } from "./complete-task-ai-function";
import {
  getEditorArtifactOperation,
  replaceTextOperation,
  setEditorArtifactOperation,
} from "./editor-text-ai-functions";
import { geminiAgent } from "./gemini-agent";
import { defineAiFunction } from "./helpers";

const apiKey = process.env.NEXT_PUBLIC_GCP_API_KEY;
if (!apiKey) {
  throw new Error("NEXT_PUBLIC_GCP_API_KEY is not defined.");
}
const genAI = new GoogleGenerativeAI(apiKey);

const PERFORM_COMPLEX_EDIT_FUNCTIONS = [
  getEditorArtifactOperation,
  setEditorArtifactOperation,
  replaceTextOperation,
  endTaskOperation,
];

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-preview-04-17",
});

const SYSTEM_PROMPT = `
You are an advanced AI agent specialized **exclusively** in complex document structure and formatting transformations. You function as a dedicated tool invoked by a primary control agent. You have access to tools/functions to interact with the application's artifact editor.

**Your Input:** You will receive:
1.  The current text content of an artifact (e.g., a document, notes, or any structured text).
2.  Specific instructions from the primary control agent detailing the complex structural or formatting task required (e.g., "reorder sections 2 and 3 for better logical flow," "apply consistent heading styles (H1, H2, H3) throughout the document," "change all bullet points under the 'Methodology' section to a numbered list and ensure proper indentation," "ensure the entire bibliography section conforms to APA 7th edition formatting guidelines," "reorganize the appendices to appear in alphabetical order by title," "set document margins to 1.5 inches on all sides and adjust the main body text to double line spacing").

**Your Task:**
* Analyze the provided text and the structural/formatting instructions.
* Perform the requested complex modifications to the document's structure and formatting with high fidelity and precision. This may involve deep restructuring of content blocks or sections, meticulous application of formatting rules (such as styles for headings, lists, citations, spacing, or margins), or reorganizing entire parts of the document to meet specific presentational or organizational requirements.
* Leverage your advanced capabilities to ensure the highest quality, structural coherence, and adherence to the formatting instructions in the final, modified text.
* Determine the final, fully edited text content based on the structural and formatting instructions.

**Your Output:**
* **CRITICAL:** Your response MUST be a **tool call**.
* **DO NOT** respond with the edited text directly in a conversational message. Your *only* output should be the function call to apply the changes.
* **DO NOT** attempt to communicate with the end-user or the primary agent through conversational text.

**Focus:** Your sole function is high-quality document structure and formatting manipulation based on the primary agent's request, executed via a tool call to modify the artifact.
`.trim();

export const structuralAndFormattingEditsAiFunction = defineAiFunction({
  declaration: {
    name: "edit_structure_and_formatting",
    description:
      "Modifies a document's overall structure, organization, layout, and formatting based on provided instructions. This function is ideal for tasks such as reordering sections or paragraphs, applying consistent formatting styles (e.g., headings, lists, indentation, citations based on supported standards), adjusting page layout elements, or reorganizing content for enhanced clarity and presentation, especially within large or complex documents. For instance, it can be employed to standardize the formatting of a multi-chapter report or re-sequence the main sections of a lengthy manuscript. This tool focuses on the structural and visual aspects of the document.\n\n**Limitations:** Does not perform linguistic refinement (e.g., summarizing, changing tone, correcting grammar) or generate new substantive content. Its ability to handle extremely complex or non-standard formatting (e.g., intricate table structures, specific niche style guides) may be limited.\n\n**When NOT to use:** Not suitable for minor text corrections, simple find-and-replace tasks, or requests focused on changing the meaning or language style of the content itself.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        instructions: {
          type: SchemaType.STRING,
          description:
            "Detailed natural language instructions specifying the desired structural and formatting changes. These instructions should clearly describe the target elements (e.g., 'Chapter 2', 'all bullet points', 'the bibliography section'), the desired actions (e.g., 'move after Chapter 5', 'format as APA style', 'apply consistent indentation', 'reorganize by date'), and any relevant constraints. The clarity and detail provided in the instructions directly impact the quality of the result. Example: 'Reorder the sections in Chapter 3 to be: Introduction, Methods, Results, Discussion. Ensure all level 1 headings use the 'Heading 1' style and level 2 headings use 'Heading 2'. Format the bibliography section according to APA 7th edition guidelines.'",
        },
      },
      required: ["instructions"],
    },
  },
  paramsSchema: z.object({
    instructions: z.string().min(1, "cannot be empty"),
  }),
  create: (editor: PlateEditor) => async (args) => {
    const { instructions: inputPrompt } = args;
    return geminiAgent({
      editor,
      inputPrompt,
      model,
      aiFunctions: PERFORM_COMPLEX_EDIT_FUNCTIONS,
      systemInstruction: SYSTEM_PROMPT,
    });
  },
});
