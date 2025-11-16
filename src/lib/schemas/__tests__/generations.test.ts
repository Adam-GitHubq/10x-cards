import { describe, expect, it } from "vitest";
import { PostGenerationBodySchema, ListGenerationsQuerySchema, GenerationIdParamSchema } from "../generations";

describe("Schematy walidacji Zod - Generations", () => {
  // ============================================================================
  // PostGenerationBodySchema
  // ============================================================================

  describe("PostGenerationBodySchema", () => {
    describe("Walidacja poprawnego tekstu źródłowego", () => {
      it("should accept valid source text with 5000 characters", () => {
        const input = {
          sourceText: "A".repeat(5000),
        };

        const result = PostGenerationBodySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.sourceText).toBe(input.sourceText);
        }
      });
    });

    describe("Walidacja minimalnej długości (1000 znaków)", () => {
      it("should reject text with 999 characters", () => {
        const input = {
          sourceText: "A".repeat(999),
        };

        const result = PostGenerationBodySchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Tekst źródłowy musi mieć co najmniej 1000 znaków.");
        }
      });

      it("should accept text with exactly 1000 characters", () => {
        const input = {
          sourceText: "A".repeat(1000),
        };

        const result = PostGenerationBodySchema.safeParse(input);

        expect(result.success).toBe(true);
      });

      it("should accept text with 1001 characters", () => {
        const input = {
          sourceText: "A".repeat(1001),
        };

        const result = PostGenerationBodySchema.safeParse(input);

        expect(result.success).toBe(true);
      });
    });

    describe("Walidacja maksymalnej długości (10000 znaków)", () => {
      it("should accept text with 9999 characters", () => {
        const input = {
          sourceText: "A".repeat(9999),
        };

        const result = PostGenerationBodySchema.safeParse(input);

        expect(result.success).toBe(true);
      });

      it("should accept text with exactly 10000 characters", () => {
        const input = {
          sourceText: "A".repeat(10000),
        };

        const result = PostGenerationBodySchema.safeParse(input);

        expect(result.success).toBe(true);
      });

      it("should reject text with 10001 characters", () => {
        const input = {
          sourceText: "A".repeat(10001),
        };

        const result = PostGenerationBodySchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Tekst źródłowy może mieć maksymalnie 10000 znaków.");
        }
      });
    });

    describe("Trimming białych znaków", () => {
      it("should trim whitespace from beginning and end", () => {
        const input = {
          sourceText: "   " + "A".repeat(1000) + "   ",
        };

        const result = PostGenerationBodySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.sourceText).toBe("A".repeat(1000));
          expect(result.data.sourceText.startsWith(" ")).toBe(false);
          expect(result.data.sourceText.endsWith(" ")).toBe(false);
        }
      });

      it("should reject text that becomes too short after trimming", () => {
        const input = {
          sourceText: "   " + "A".repeat(500) + "   ",
        };

        const result = PostGenerationBodySchema.safeParse(input);

        expect(result.success).toBe(false);
      });
    });

    describe("Walidacja pustego tekstu", () => {
      it("should reject empty string", () => {
        const input = {
          sourceText: "",
        };

        const result = PostGenerationBodySchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it("should reject string with only spaces", () => {
        const input = {
          sourceText: "   ",
        };

        const result = PostGenerationBodySchema.safeParse(input);

        expect(result.success).toBe(false);
      });
    });

    describe("Walidacja typów danych", () => {
      it("should reject sourceText as number", () => {
        const input = {
          sourceText: 12345,
        };

        const result = PostGenerationBodySchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it("should reject sourceText as object", () => {
        const input = {
          sourceText: { text: "A".repeat(1000) },
        };

        const result = PostGenerationBodySchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it("should reject missing sourceText field", () => {
        const input = {};

        const result = PostGenerationBodySchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].code).toBe("invalid_type");
        }
      });
    });
  });

  // ============================================================================
  // ListGenerationsQuerySchema
  // ============================================================================

  describe("ListGenerationsQuerySchema", () => {
    describe("Walidacja domyślnych wartości", () => {
      it("should apply default values for empty input", () => {
        const input = {};

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({
            page: 1,
            pageSize: 10,
            sort: "createdAt",
            order: "desc",
          });
        }
      });
    });

    describe("Walidacja page (min: 1)", () => {
      it("should reject page: 0", () => {
        const input = { page: 0 };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it("should reject page: -1", () => {
        const input = { page: -1 };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it("should accept page: 1", () => {
        const input = { page: 1 };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(1);
        }
      });

      it("should accept page: 100", () => {
        const input = { page: 100 };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(100);
        }
      });

      it("should coerce string to number for page", () => {
        const input = { page: "5" };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.page).toBe(5);
        }
      });
    });

    describe("Walidacja pageSize (min: 1, max: 100)", () => {
      it("should reject pageSize: 0", () => {
        const input = { pageSize: 0 };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it("should accept pageSize: 1", () => {
        const input = { pageSize: 1 };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.pageSize).toBe(1);
        }
      });

      it("should accept pageSize: 50", () => {
        const input = { pageSize: 50 };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.pageSize).toBe(50);
        }
      });

      it("should accept pageSize: 100", () => {
        const input = { pageSize: 100 };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.pageSize).toBe(100);
        }
      });

      it("should reject pageSize: 101", () => {
        const input = { pageSize: 101 };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it("should coerce string to number for pageSize", () => {
        const input = { pageSize: "25" };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.pageSize).toBe(25);
        }
      });
    });

    describe("Walidacja sort", () => {
      it("should use default value when sort is missing", () => {
        const input = {};

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.sort).toBe("createdAt");
        }
      });

      it("should accept sort: 'createdAt'", () => {
        const input = { sort: "createdAt" };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.sort).toBe("createdAt");
        }
      });

      it("should trim whitespace from sort value", () => {
        const input = { sort: "  createdAt  " };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.sort).toBe("createdAt");
        }
      });

      it("should reject empty string for sort", () => {
        const input = { sort: "" };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it("should accept any non-empty string for sort (validation in service)", () => {
        const input = { sort: "invalidField" };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.sort).toBe("invalidField");
        }
      });
    });

    describe("Walidacja order", () => {
      it("should use default value 'desc' when order is missing", () => {
        const input = {};

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.order).toBe("desc");
        }
      });

      it("should accept order: 'asc'", () => {
        const input = { order: "asc" };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.order).toBe("asc");
        }
      });

      it("should accept order: 'desc'", () => {
        const input = { order: "desc" };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.order).toBe("desc");
        }
      });

      it("should reject invalid order value", () => {
        const input = { order: "invalid" };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it("should reject uppercase order value (case-sensitive)", () => {
        const input = { order: "ASC" };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(false);
      });
    });

    describe("Walidacja opcjonalnych filtrów", () => {
      it("should accept valid model filter", () => {
        const input = { model: "openai/gpt-4o-mini" };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.model).toBe("openai/gpt-4o-mini");
        }
      });

      it("should reject empty string for model", () => {
        const input = { model: "" };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it("should accept valid createdFrom datetime", () => {
        const input = { createdFrom: "2024-01-01T00:00:00.000Z" };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.createdFrom).toBe("2024-01-01T00:00:00.000Z");
        }
      });

      it("should reject invalid date format for createdFrom", () => {
        const input = { createdFrom: "invalid-date" };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it("should accept valid createdTo datetime", () => {
        const input = { createdTo: "2024-12-31T23:59:59.999Z" };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.createdTo).toBe("2024-12-31T23:59:59.999Z");
        }
      });

      it("should reject incomplete datetime format for createdTo", () => {
        const input = { createdTo: "2024-12-31" };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(false);
      });
    });

    describe("Walidacja kombinacji filtrów", () => {
      it("should accept all filters combined", () => {
        const input = {
          page: 2,
          pageSize: 20,
          sort: "generatedCount",
          order: "asc",
          model: "openai/gpt-4o-mini",
          createdFrom: "2024-01-01T00:00:00.000Z",
          createdTo: "2024-12-31T23:59:59.999Z",
        };

        const result = ListGenerationsQuerySchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(input);
        }
      });
    });
  });

  // ============================================================================
  // GenerationIdParamSchema
  // ============================================================================

  describe("GenerationIdParamSchema", () => {
    describe("Walidacja poprawnego ID", () => {
      it("should accept id: 1", () => {
        const input = { id: 1 };

        const result = GenerationIdParamSchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.id).toBe(1);
        }
      });

      it("should accept id: 999", () => {
        const input = { id: 999 };

        const result = GenerationIdParamSchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.id).toBe(999);
        }
      });

      it("should coerce string to number for id", () => {
        const input = { id: "123" };

        const result = GenerationIdParamSchema.safeParse(input);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.id).toBe(123);
        }
      });
    });

    describe("Walidacja niepoprawnego ID", () => {
      it("should reject id: 0", () => {
        const input = { id: 0 };

        const result = GenerationIdParamSchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it("should reject id: -1", () => {
        const input = { id: -1 };

        const result = GenerationIdParamSchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it("should reject float number for id", () => {
        const input = { id: 1.5 };

        const result = GenerationIdParamSchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it("should reject non-numeric string for id", () => {
        const input = { id: "abc" };

        const result = GenerationIdParamSchema.safeParse(input);

        expect(result.success).toBe(false);
      });

      it("should reject missing id field", () => {
        const input = {};

        const result = GenerationIdParamSchema.safeParse(input);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].code).toBe("invalid_type");
        }
      });
    });
  });
});
