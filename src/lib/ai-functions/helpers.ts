import type { FunctionDeclaration } from "@google/generative-ai";
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
} from "./editor-text-ai-functions";
import { performComplexEditOperation } from "./perform-complex-edit-ai-function";

export const AI_FUNCTIONS = [
  getEditorArtifactOperation,
  undoOperation,
  redoOperation,
  getSelectionOperation,
  setSelectionOperation,
  replaceTextOperation,
  performComplexEditOperation,
];

export type AiFunctionDeclaration = FunctionDeclaration;

export type AiFunctionResponse<Response = unknown | undefined> =
  | ({
      success: true;
    } & Response)
  | { success: false; error: string };

export type AiFunctionConfig<
  TSchema extends ZodTypeAny,
  TResult = unknown,
  Success extends boolean = true,
> = {
  declaration: AiFunctionDeclaration;
  create: (
    editor: PlateEditor,
  ) => (
    args: InferSchema<TSchema>,
  ) => OptionalPromise<AiFunctionResponse<TResult>>;
  paramsSchema?: TSchema;
};

export type AiFunction<
  TSchema extends ZodTypeAny,
  TResult = unknown,
  Success extends boolean = true,
> = {
  declaration: AiFunctionDeclaration;
  create: (
    editor: PlateEditor,
  ) => (
    args: InferSchema<TSchema>,
  ) => OptionalPromise<AiFunctionResponse<TResult>>;
  paramsSchema: TSchema;
};

export function defineAiFunction<
  TSchema extends ZodTypeAny,
  TResult = unknown,
  Success extends boolean = true,
>(
  config: AiFunctionConfig<TSchema, TResult, Success>,
): AiFunction<TSchema, TResult, Success> {
  return {
    declaration: config.declaration,
    create: config.create,
    paramsSchema: (config.paramsSchema ?? z.object({}).strict()) as TSchema,
  };
}

type InferSchema<T extends ZodTypeAny | undefined> = T extends ZodTypeAny
  ? z.infer<T>
  : undefined;

type OptionalPromise<T> = T | Promise<T>;
