import { z } from "zod";

import type { FlashcardSource } from "../../types";

const flashcardSources: readonly [FlashcardSource, ...FlashcardSource[]] = ["manual", "ai-full", "ai-edited"];

const frontSchema = z
  .string()
  .trim()
  .min(1, "Awers fiszki nie może być pusty.")
  .max(200, "Awers fiszki może zawierać maksymalnie 200 znaków.");

const backSchema = z
  .string()
  .trim()
  .min(1, "Rewers fiszki nie może być pusty.")
  .max(500, "Rewers fiszki może zawierać maksymalnie 500 znaków.");

const sourceSchema = z.enum(flashcardSources);

const generationIdSchema = z.union([z.coerce.number().int().min(1), z.literal(null)]).optional();

const createFlashcardItemSchema = z.object({
  front: frontSchema,
  back: backSchema,
  source: sourceSchema.default("manual"),
  generationId: generationIdSchema,
});

export const PostFlashcardsBodySchema = z
  .object({
    cards: z.array(createFlashcardItemSchema).min(1, "Należy podać co najmniej jedną fiszkę do utworzenia."),
  })
  .superRefine((value, ctx) => {
    value.cards.forEach((card, cardIndex) => {
      const { source, generationId } = card;
      const path = ["cards", cardIndex, "generationId"];

      if (source === "manual") {
        if (generationId !== undefined && generationId !== null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Fiszka ręczna nie może posiadać powiązania z generacją.",
            path,
          });
        }
        return;
      }

      if (generationId === undefined || generationId === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Fiszka wygenerowana przez AI wymaga poprawnego generationId.",
          path,
        });
      }
    });
  });

export const ListFlashcardsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sort: z
    .string()
    .min(1)
    .transform((value) => value.trim())
    .refine((value) => value === "createdAt", 'Parametr sort może przyjmować wyłącznie wartość "createdAt".')
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  source: sourceSchema.optional(),
  generationId: z.coerce.number().int().min(1).optional(),
});

export const FlashcardIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
});

export const PutFlashcardBodySchema = z.object({
  front: frontSchema,
  back: backSchema,
});

export type PostFlashcardsBodyInput = z.infer<typeof PostFlashcardsBodySchema>;
export type ListFlashcardsQueryInput = z.infer<typeof ListFlashcardsQuerySchema>;
export type FlashcardIdParamInput = z.infer<typeof FlashcardIdParamSchema>;
export type PutFlashcardBodyInput = z.infer<typeof PutFlashcardBodySchema>;
