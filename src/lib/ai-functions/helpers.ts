import type { FunctionDeclaration } from "@google/generative-ai";
import type { PlateEditor } from "@udecode/plate/react";
import { type ZodTypeAny, z } from "zod";

export type AiFunctionDeclaration = FunctionDeclaration;

export type AiFunctionResponse<
  Response = unknown,
  Success extends boolean = true,
> = Success extends true
  ? {
      success: Success;
    } & Response
  : {
      success: false;
      error: string;
    };

export type AiFunctionConfig<
  TSchema extends ZodTypeAny,
  TResult = unknown,
  Success extends boolean = true,
> = {
  declaration: AiFunctionDeclaration;
  create: (
    editor: PlateEditor,
  ) => (args: InferSchema<TSchema>) => AiFunctionResponse<TResult, Success>;
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
  ) => (args: InferSchema<TSchema>) => AiFunctionResponse<TResult, Success>;
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
