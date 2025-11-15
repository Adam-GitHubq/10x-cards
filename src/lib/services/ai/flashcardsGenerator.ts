/**
 * Generator fiszek przy użyciu OpenRouter API
 *
 * Ten moduł odpowiada za generowanie propozycji fiszek edukacyjnych
 * z dostarczonego tekstu źródłowego przy użyciu modeli LLM.
 */

import type { FlashcardProposalDto } from "../../../types";
import { createFlashcardsOpenRouterService } from "./openrouter.config";
import { OpenRouterServiceError } from "../openrouter.service";

/**
 * Parametry generowania fiszek
 */
type GenerateFlashcardProposalsParams = {
  /** Tekst źródłowy do przekształcenia w fiszki */
  sourceText: string;
};

/**
 * Typ odpowiedzi z API OpenRouter
 */
type FlashcardsApiResponse = {
  flashcards: {
    front: string;
    back: string;
  }[];
};

/**
 * Błąd generowania fiszek
 */
export class FlashcardGenerationError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly originalError?: unknown
  ) {
    super(message);
    this.name = "FlashcardGenerationError";
  }
}

const ERROR_CODES = {
  INVALID_INPUT: "INVALID_INPUT",
  TEXT_TOO_SHORT: "TEXT_TOO_SHORT",
  API_ERROR: "API_ERROR",
  NO_FLASHCARDS_GENERATED: "NO_FLASHCARDS_GENERATED",
} as const;

const ERROR_MESSAGES = {
  [ERROR_CODES.INVALID_INPUT]: "Tekst źródłowy jest wymagany i nie może być pusty.",
  [ERROR_CODES.TEXT_TOO_SHORT]: "Tekst źródłowy jest zbyt krótki do wygenerowania fiszek (minimum 50 znaków).",
  [ERROR_CODES.API_ERROR]: "Nie udało się wygenerować fiszek. Spróbuj ponownie później.",
  [ERROR_CODES.NO_FLASHCARDS_GENERATED]: "Model nie wygenerował żadnych fiszek z dostarczonego tekstu.",
} as const;

/**
 * Minimalna długość tekstu źródłowego (w znakach)
 */
const MIN_TEXT_LENGTH = 50;

/**
 * Generuje propozycje fiszek z dostarczonego tekstu źródłowego
 *
 * @param params - Parametry generowania
 * @returns Tablica propozycji fiszek
 * @throws {FlashcardGenerationError} W przypadku błędu walidacji lub generowania
 *
 * @example
 * ```typescript
 * const proposals = await generateFlashcardProposals({
 *   sourceText: "Fotosynteza to proces, w którym rośliny przekształcają światło słoneczne w energię chemiczną."
 * });
 * ```
 */
export async function generateFlashcardProposals({
  sourceText,
}: GenerateFlashcardProposalsParams): Promise<FlashcardProposalDto[]> {
  // Walidacja wejścia
  if (typeof sourceText !== "string" || sourceText.trim().length === 0) {
    throw new FlashcardGenerationError(ERROR_MESSAGES[ERROR_CODES.INVALID_INPUT], ERROR_CODES.INVALID_INPUT);
  }

  const trimmedText = sourceText.trim();

  // Sprawdzenie minimalnej długości tekstu
  if (trimmedText.length < MIN_TEXT_LENGTH) {
    throw new FlashcardGenerationError(ERROR_MESSAGES[ERROR_CODES.TEXT_TOO_SHORT], ERROR_CODES.TEXT_TOO_SHORT);
  }

  try {
    // Inicjalizacja serwisu OpenRouter
    const service = createFlashcardsOpenRouterService();

    // Przygotowanie promptu
    const prompt = buildPrompt(trimmedText);

    // Wywołanie API
    const response = await service.sendMessage<FlashcardsApiResponse>(prompt);

    // Walidacja odpowiedzi
    if (!response.content.flashcards || response.content.flashcards.length === 0) {
      throw new FlashcardGenerationError(
        ERROR_MESSAGES[ERROR_CODES.NO_FLASHCARDS_GENERATED],
        ERROR_CODES.NO_FLASHCARDS_GENERATED
      );
    }

    // Mapowanie odpowiedzi na DTO
    const proposals = response.content.flashcards.map<FlashcardProposalDto>((card) => ({
      front: card.front.trim(),
      back: card.back.trim(),
      source: "ai-full",
    }));

    return proposals;
  } catch (error) {
    // Obsługa błędów OpenRouter
    if (error instanceof OpenRouterServiceError) {
      throw new FlashcardGenerationError(ERROR_MESSAGES[ERROR_CODES.API_ERROR], ERROR_CODES.API_ERROR, error);
    }

    // Przepuszczenie błędów walidacji
    if (error instanceof FlashcardGenerationError) {
      throw error;
    }

    // Obsługa nieznanych błędów
    throw new FlashcardGenerationError(ERROR_MESSAGES[ERROR_CODES.API_ERROR], ERROR_CODES.API_ERROR, error);
  }
}

/**
 * Buduje prompt dla modelu LLM
 *
 * @param sourceText - Tekst źródłowy
 * @returns Sformatowany prompt
 */
function buildPrompt(sourceText: string): string {
  return `Na podstawie poniższego tekstu wygeneruj zestaw fiszek edukacyjnych.

Tekst źródłowy:
${sourceText}

Wygeneruj od 3 do 10 fiszek, w zależności od długości i złożoności tekstu.
Każda fiszka powinna być wartościowa edukacyjnie i testować zrozumienie materiału.`;
}
