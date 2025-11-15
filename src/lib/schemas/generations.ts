import { z } from "zod";

export const PostGenerationBodySchema = z.object({
  sourceText: z
    .string()
    .min(1000, "Tekst źródłowy musi mieć co najmniej 1000 znaków.")
    .max(10000, "Tekst źródłowy może mieć maksymalnie 10000 znaków.")
    .trim(),
});

export const ListGenerationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sort: z
    .string()
    .min(1)
    .transform((value) => value.trim())
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  model: z.string().min(1).optional(),
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),
});

export const GenerationIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
});

export type PostGenerationBodyInput = z.infer<typeof PostGenerationBodySchema>;
export type ListGenerationsQueryInput = z.infer<typeof ListGenerationsQuerySchema>;
export type GenerationIdParamInput = z.infer<typeof GenerationIdParamSchema>;
