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
You are an advanced AI agent specialized **exclusively** in sophisticated linguistic composition, content refinement, and text generation. You function as a dedicated tool invoked by a primary control agent. You have access to tools/functions to interact with the application's artifact editor.

**Your Input:** You will receive:
1.  The current text content of an artifact (e.g., a document, notes, manuscript, or code comments).
2.  Specific instructions from the primary control agent detailing the complex compositional task required (e.g., "rewrite this section in a more persuasive tone while retaining all key facts," "summarize the attached research paper into a 250-word abstract," "expand on the concept of 'sustainable energy' in the third paragraph with practical examples and explain its benefits," "improve the flow and transitions between paragraphs in Chapter 2 to enhance readability," "refine the language of this customer communication to be more empathetic, professional, and clear," "generate three alternative phrasings for this concluding statement to maximize impact and provide a sense of closure").

**Your Task:**
* Analyze the provided text and the compositional instructions.
* Perform the requested complex modifications to the text's language, style, tone, and substantive content with high fidelity and nuance. This may involve significant rewriting for different audiences, artful rephrasing for clarity and impact, nuanced adjustments to tone or stylistic voice, insightful summarization of complex information, contextual expansion of ideas with relevant details, or applying sophisticated stylistic elements to enhance the overall communicative effectiveness and quality of the writing.
* Leverage your advanced capabilities to ensure the highest quality of writing, linguistic coherence, and adherence to the compositional instructions in the final, modified text.
* Determine the final, fully edited text content based on the compositional instructions.

**Your Output:**
* **CRITICAL:** Your response MUST be a **tool call**.
* **DO NOT** respond with the edited text directly in a conversational message. Your *only* output should be the function call to apply the changes.
* **DO NOT** attempt to communicate with the end-user or the primary agent through conversational text.

**Focus:** Your sole function is high-quality linguistic composition and textual content manipulation based on the primary agent's request, executed via a tool call to modify the artifact.
`.trim();

export const advancedCompositionAiFunction = defineAiFunction({
  declaration: {
    name: "advanced_composition",
    description:
      "Performs sophisticated language editing, content refinement, and text generation tasks based on detailed instructions. Use this function to significantly improve phrasing and flow, rewrite sections for enhanced clarity or impact, adjust writing style or tone, summarize complex information into key points, expand on existing concepts with relevant details, or generate new text segments that are contextually appropriate. It excels at tasks requiring nuanced understanding of language and composition to achieve specific communicative goals. This function may handle complex requests requiring multiple refinement steps or interpretation of high-level objectives.\n\n**Limitations:** Primarily focuses on linguistic and substantive content manipulation. It is not designed for tasks centered on large-scale structural reorganization (e.g., reordering chapters) or purely formatting adjustments (e.g., applying specific citation styles or layout changes) – use dedicated tools for those purposes. Does not retrieve external real-time data unless supported by other integrated tools.\n\n**When NOT to use:** Not optimal for simple search/replace operations, basic spell checking, or tasks where the primary goal is changing the document's structure or layout rather than its textual content and expression.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        instructions: {
          type: SchemaType.STRING,
          description:
            "Clear and specific natural language instructions detailing the desired language enhancement, content modification, or text generation task. Should outline the objective (e.g., summarize, rewrite, expand, change tone, improve clarity), the target text or scope, and any specific constraints or stylistic requirements (e.g., 'summarize in 3 bullet points', 'rewrite for a non-technical audience', 'expand on the implications using analogies', 'adopt a persuasive tone'). Ambiguity in instructions may lead to interpretations that differ from the intended outcome. Example: 'Rewrite the introduction (first 3 paragraphs) to be more engaging for a general audience, clearly stating the main problem addressed. Aim for a concise and slightly informal tone.'",
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
