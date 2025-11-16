/**
 * Przykłady użycia OpenRouterService
 *
 * Ten plik zawiera przykłady integracji serwisu OpenRouter
 * w kontekście generowania fiszek dla aplikacji 10xCards.
 */

/* eslint-disable no-console */
import { OpenRouterService, type ResponseFormat } from "../openrouter.service";
import type { FlashcardProposalDto } from "../../../types";

// ============================================================================
// Przykład 1: Podstawowa konfiguracja
// ============================================================================

/**
 * Tworzy instancję serwisu z podstawową konfiguracją
 */
export function createBasicService(): OpenRouterService {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("Brak klucza OPENROUTER_API_KEY w zmiennych środowiskowych");
  }

  return new OpenRouterService({
    apiKey,
  });
}

// ============================================================================
// Przykład 2: Zaawansowana konfiguracja
// ============================================================================

/**
 * Tworzy instancję serwisu z zaawansowaną konfiguracją
 */
export function createAdvancedService(): OpenRouterService {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("Brak klucza OPENROUTER_API_KEY w zmiennych środowiskowych");
  }

  const systemMessage = `Jesteś ekspertem w tworzeniu fiszek edukacyjnych.
Twoim zadaniem jest przekształcenie dostarczonego tekstu w zestaw wysokiej jakości fiszek.
Każda fiszka powinna:
- Zawierać jasne, konkretne pytanie
- Mieć zwięzłą, precyzyjną odpowiedź
- Skupiać się na jednym konkretnym zagadnieniu
- Być przydatna do nauki i zapamiętywania`;

  return new OpenRouterService({
    apiKey,
    systemMessage,
    modelOptions: {
      model: "openai/gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 4096,
    },
  });
}

// ============================================================================
// Przykład 3: Konfiguracja formatu odpowiedzi dla fiszek
// ============================================================================

/**
 * Schemat JSON dla odpowiedzi z fiszkami
 */
const FLASHCARDS_RESPONSE_FORMAT: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "flashcardsResponse",
    strict: true,
    schema: {
      type: "object",
      properties: {
        flashcards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              front: {
                type: "string",
                description: "Pytanie lub termin na przedniej stronie fiszki",
              },
              back: {
                type: "string",
                description: "Odpowiedź lub definicja na tylnej stronie fiszki",
              },
            },
            required: ["front", "back"],
            additionalProperties: false,
          },
        },
      },
      required: ["flashcards"],
      additionalProperties: false,
    },
  },
};

/**
 * Typ odpowiedzi z API dla fiszek
 */
type FlashcardsApiResponse = {
  flashcards: {
    front: string;
    back: string;
  }[];
};

/**
 * Tworzy serwis skonfigurowany do generowania fiszek
 */
export function createFlashcardsService(): OpenRouterService {
  const service = createAdvancedService();
  service.setResponseFormat(FLASHCARDS_RESPONSE_FORMAT);
  return service;
}

// ============================================================================
// Przykład 4: Generowanie fiszek z tekstu
// ============================================================================

/**
 * Generuje fiszki z dostarczonego tekstu
 *
 * @param sourceText - Tekst źródłowy do przekształcenia w fiszki
 * @returns Tablica propozycji fiszek
 */
export async function generateFlashcardsFromText(sourceText: string): Promise<FlashcardProposalDto[]> {
  const service = createFlashcardsService();

  const prompt = `Na podstawie poniższego tekstu wygeneruj zestaw fiszek edukacyjnych.
Każda fiszka powinna zawierać pytanie (front) i odpowiedź (back).
Wygeneruj od 3 do 10 fiszek, w zależności od długości i złożoności tekstu.

Tekst źródłowy:
${sourceText}`;

  try {
    const response = await service.sendMessage<FlashcardsApiResponse>(prompt);

    // Mapowanie odpowiedzi API na DTO aplikacji
    return response.content.flashcards.map((card) => ({
      front: card.front,
      back: card.back,
      source: "ai-full" as const,
    }));
  } catch (error) {
    console.error("Błąd podczas generowania fiszek:", error);
    throw error;
  }
}

// ============================================================================
// Przykład 5: Generowanie fiszek z opcjami
// ============================================================================

/**
 * Opcje generowania fiszek
 */
export type GenerateFlashcardsOptions = {
  /** Liczba fiszek do wygenerowania */
  count?: number;
  /** Poziom trudności (łatwy, średni, trudny) */
  difficulty?: "easy" | "medium" | "hard";
  /** Język fiszek */
  language?: string;
  /** Dodatkowe instrukcje */
  additionalInstructions?: string;
};

/**
 * Generuje fiszki z opcjami
 *
 * @param sourceText - Tekst źródłowy
 * @param options - Opcje generowania
 * @returns Tablica propozycji fiszek
 */
export async function generateFlashcardsWithOptions(
  sourceText: string,
  options: GenerateFlashcardsOptions = {}
): Promise<FlashcardProposalDto[]> {
  const service = createFlashcardsService();

  const { count = 5, difficulty = "medium", language = "polski", additionalInstructions = "" } = options;

  const difficultyInstructions = {
    easy: "Twórz proste, podstawowe pytania odpowiednie dla początkujących.",
    medium: "Twórz pytania o średnim poziomie trudności, wymagające zrozumienia tematu.",
    hard: "Twórz zaawansowane pytania wymagające głębokiej analizy i syntezy wiedzy.",
  };

  const prompt = `Na podstawie poniższego tekstu wygeneruj ${count} fiszek edukacyjnych w języku ${language}.

Poziom trudności: ${difficulty}
${difficultyInstructions[difficulty]}

${additionalInstructions ? `Dodatkowe instrukcje: ${additionalInstructions}\n` : ""}

Tekst źródłowy:
${sourceText}`;

  const response = await service.sendMessage<FlashcardsApiResponse>(prompt);

  return response.content.flashcards.map((card) => ({
    front: card.front,
    back: card.back,
    source: "ai-full" as const,
  }));
}

// ============================================================================
// Przykład 6: Obsługa błędów
// ============================================================================

/**
 * Generuje fiszki z pełną obsługą błędów
 *
 * @param sourceText - Tekst źródłowy
 * @returns Tablica propozycji fiszek lub null w przypadku błędu
 */
export async function generateFlashcardsSafely(sourceText: string): Promise<FlashcardProposalDto[] | null> {
  try {
    // Walidacja wejścia
    if (!sourceText || sourceText.trim().length === 0) {
      console.error("Tekst źródłowy jest pusty");
      return null;
    }

    if (sourceText.length < 50) {
      console.warn("Tekst źródłowy jest bardzo krótki, może nie wystarczyć do wygenerowania fiszek");
    }

    // Generowanie fiszek
    const flashcards = await generateFlashcardsFromText(sourceText);

    // Walidacja wyniku
    if (flashcards.length === 0) {
      console.warn("Nie wygenerowano żadnych fiszek");
      return null;
    }

    return flashcards;
  } catch (error) {
    console.error("Błąd podczas generowania fiszek:", error);
    return null;
  }
}

// ============================================================================
// Przykład 7: Dynamiczna konfiguracja modelu
// ============================================================================

/**
 * Generuje fiszki z możliwością wyboru modelu
 *
 * @param sourceText - Tekst źródłowy
 * @param model - Nazwa modelu OpenRouter
 * @returns Tablica propozycji fiszek
 */
export async function generateFlashcardsWithModel(sourceText: string, model: string): Promise<FlashcardProposalDto[]> {
  const service = createFlashcardsService();

  // Dynamiczna zmiana modelu
  service.configureModel({ model });

  const prompt = `Wygeneruj fiszki edukacyjne z poniższego tekstu:\n\n${sourceText}`;

  const response = await service.sendMessage<FlashcardsApiResponse>(prompt);

  return response.content.flashcards.map((card) => ({
    front: card.front,
    back: card.back,
    source: "ai-full" as const,
  }));
}

// ============================================================================
// Przykład 8: Monitorowanie użycia tokenów
// ============================================================================

/**
 * Generuje fiszki i zwraca informacje o użyciu tokenów
 *
 * @param sourceText - Tekst źródłowy
 * @returns Fiszki i statystyki użycia
 */
export async function generateFlashcardsWithUsage(sourceText: string): Promise<{
  flashcards: FlashcardProposalDto[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}> {
  const service = createFlashcardsService();

  const prompt = `Wygeneruj fiszki edukacyjne z poniższego tekstu:\n\n${sourceText}`;

  const response = await service.sendMessage<FlashcardsApiResponse>(prompt);

  const flashcards = response.content.flashcards.map((card) => ({
    front: card.front,
    back: card.back,
    source: "ai-full" as const,
  }));

  return {
    flashcards,
    usage: response.usage,
  };
}
