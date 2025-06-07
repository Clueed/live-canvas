import type { FunctionDeclaration } from "@google/genai";
import type { PlateEditor } from "@udecode/plate/react";
import { type ZodTypeAny, z } from "zod";
import { redoOperation, undoOperation } from "./editor-history-ai-functions";
import {
  getSelectionOperation,
  setSelectionOperation,
} from "./editor-selection-ai-functions";
import {
  getEditorArtifactOperation,
  replaceTextOperation,
  setEditorArtifactOperation,
} from "./editor-text-ai-functions";

export const AI_FUNCTIONS = [
  getEditorArtifactOperation,
  setEditorArtifactOperation,
  undoOperation,
  redoOperation,
  getSelectionOperation,
  setSelectionOperation,
  replaceTextOperation,
  // structuralAndFormattingEditsAiFunction,
  // advancedCompositionAiFunction,
];

export type AiFunctionDeclaration = FunctionDeclaration;

export type AiFunctionResponse<Response = Record<string, unknown>> = Promise<
  {
    success: boolean;
    error?: string;
  } & Response
>;

export interface AiFunctionConfig<
  TSchema extends ZodTypeAny,
  TResult = Record<string, unknown>,
> {
  declaration: AiFunctionDeclaration;
  create: (
    editor: PlateEditor,
  ) => (args: InferSchema<TSchema>) => AiFunctionResponse<TResult>;
  paramsSchema?: TSchema;
}

export interface AiFunction<
  TSchema extends ZodTypeAny = ZodTypeAny,
  TResult = Record<string, unknown>,
> {
  declaration: AiFunctionDeclaration;
  create: (
    editor: PlateEditor,
  ) => (args: InferSchema<TSchema>) => AiFunctionResponse<TResult>;
  paramsSchema: TSchema;
}

export function defineAiFunction<
  TSchema extends ZodTypeAny,
  TResult = Record<string, unknown>,
>(config: AiFunctionConfig<TSchema, TResult>): AiFunction<TSchema, TResult> {
  return {
    declaration: config.declaration,
    create: config.create,
    paramsSchema: (config.paramsSchema ?? z.object({}).strict()) as TSchema,
  };
}

type InferSchema<T extends ZodTypeAny | undefined> = T extends ZodTypeAny
  ? z.infer<T>
  : undefined;
