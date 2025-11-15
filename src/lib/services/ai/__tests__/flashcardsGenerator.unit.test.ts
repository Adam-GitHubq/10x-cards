/**
 * Testy jednostkowe dla generatora fiszek (z mockowaniem)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateFlashcardProposals,
  FlashcardGenerationError,
} from "../flashcardsGenerator";

// Mock OpenRouter service
vi.mock("../openrouter.config", () => ({
  createFlashcardsOpenRouterService: vi.fn(() => ({
    sendMessage: vi.fn(),
  })),
}));

describe("FlashcardsGenerator - Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Walidacja wejścia", () => {
    it("powinien rzucić błąd dla pustego stringa", async () => {
      await expect(
        generateFlashcardProposals({ sourceText: "" })
      ).rejects.toThrow(FlashcardGenerationError);
    });

    it("powinien rzucić błąd dla stringa z samymi spacjami", async () => {
      await expect(
        generateFlashcardProposals({ sourceText: "   " })
      ).rejects.toThrow(FlashcardGenerationError);
    });

    it("powinien rzucić błąd dla zbyt krótkiego tekstu", async () => {
      const shortText = "To jest krótki tekst.";

      await expect(
        generateFlashcardProposals({ sourceText: shortText })
      ).rejects.toThrow(FlashcardGenerationError);
    });

    it("powinien rzucić błąd INVALID_INPUT dla pustego tekstu", async () => {
      try {
        await generateFlashcardProposals({ sourceText: "" });
        expect.fail("Powinien rzucić błąd");
      } catch (error) {
        expect(error).toBeInstanceOf(FlashcardGenerationError);
        expect((error as FlashcardGenerationError).code).toBe("INVALID_INPUT");
        expect((error as FlashcardGenerationError).message).toContain(
          "wymagany"
        );
      }
    });

    it("powinien rzucić błąd TEXT_TOO_SHORT dla krótkiego tekstu", async () => {
      try {
        await generateFlashcardProposals({ sourceText: "Krótki" });
        expect.fail("Powinien rzucić błąd");
      } catch (error) {
        expect(error).toBeInstanceOf(FlashcardGenerationError);
        expect((error as FlashcardGenerationError).code).toBe("TEXT_TOO_SHORT");
        expect((error as FlashcardGenerationError).message).toContain(
          "minimum 50"
        );
      }
    });
  });

  describe("Struktura błędów", () => {
    it("FlashcardGenerationError powinien zawierać wymagane pola", () => {
      const error = new FlashcardGenerationError(
        "Test message",
        "TEST_CODE",
        new Error("Original")
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(FlashcardGenerationError);
      expect(error.message).toBe("Test message");
      expect(error.code).toBe("TEST_CODE");
      expect(error.originalError).toBeInstanceOf(Error);
      expect(error.name).toBe("FlashcardGenerationError");
    });

    it("FlashcardGenerationError może być bez originalError", () => {
      const error = new FlashcardGenerationError("Test message", "TEST_CODE");

      expect(error.message).toBe("Test message");
      expect(error.code).toBe("TEST_CODE");
      expect(error.originalError).toBeUndefined();
    });
  });

  describe("Minimalna długość tekstu", () => {
    it("powinien zaakceptować tekst o długości 50 znaków", async () => {
      const text = "A".repeat(50);

      // Mock będzie potrzebny gdy test będzie wywoływał API
      // Na razie test sprawdza tylko walidację
      try {
        await generateFlashcardProposals({ sourceText: text });
      } catch (error) {
        // Oczekujemy błędu API, nie błędu walidacji
        if (error instanceof FlashcardGenerationError) {
          expect(error.code).not.toBe("TEXT_TOO_SHORT");
          expect(error.code).not.toBe("INVALID_INPUT");
        }
      }
    });

    it("powinien odrzucić tekst o długości 49 znaków", async () => {
      const text = "A".repeat(49);

      await expect(
        generateFlashcardProposals({ sourceText: text })
      ).rejects.toThrow(FlashcardGenerationError);
    });
  });

  describe("Trimowanie tekstu", () => {
    it("powinien trimować tekst przed walidacją", async () => {
      const text = "   " + "A".repeat(50) + "   ";

      try {
        await generateFlashcardProposals({ sourceText: text });
      } catch (error) {
        // Nie powinien rzucić błędu TEXT_TOO_SHORT
        if (error instanceof FlashcardGenerationError) {
          expect(error.code).not.toBe("TEXT_TOO_SHORT");
        }
      }
    });
  });
});

