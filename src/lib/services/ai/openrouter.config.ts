/**
 * Konfiguracja i inicjalizacja serwisu OpenRouter dla generowania fiszek
 */

import { OpenRouterService, type ResponseFormat } from "../openrouter.service";

/**
 * Schemat JSON dla odpowiedzi z fiszkami
 */
export const FLASHCARDS_RESPONSE_FORMAT: ResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "flashcardsResponse",
    strict: true,
    schema: {
      type: "object",
      properties: {
        flashcards: {
          type: "array",
          description: "Lista wygenerowanych fiszek edukacyjnych",
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
 * Domyślny komunikat systemowy dla generowania fiszek
 */
const SYSTEM_MESSAGE = `Jesteś ekspertem w tworzeniu fiszek edukacyjnych.

Twoim zadaniem jest przekształcenie dostarczonego tekstu w zestaw wysokiej jakości fiszek do nauki.

Zasady tworzenia fiszek:
1. Każda fiszka powinna zawierać jasne, konkretne pytanie na przedniej stronie (front)
2. Odpowiedź na tylnej stronie (back) powinna być zwięzła i precyzyjna
3. Jedna fiszka = jedno zagadnienie (unikaj łączenia wielu konceptów)
4. Pytania powinny być sformułowane w sposób testujący zrozumienie, a nie tylko pamięć
5. Odpowiedzi powinny być kompletne, ale nie za długie (2-3 zdania maksymalnie)
6. Unikaj pytań typu "tak/nie" - preferuj pytania otwarte
7. Używaj prostego, zrozumiałego języka
8. Zachowaj kontekst i terminologię z oryginalnego tekstu

Generuj od 3 do 10 fiszek, w zależności od długości i złożoności tekstu.
Priorytetyzuj jakość nad ilością - lepiej mniej fiszek, ale lepszych.`;

/**
 * Domyślna konfiguracja modelu
 */
const DEFAULT_MODEL_CONFIG = {
  model: "openai/gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 4096,
};

/**
 * Tworzy i konfiguruje instancję serwisu OpenRouter dla generowania fiszek
 *
 * @returns Skonfigurowana instancja OpenRouterService
 * @throws {Error} Gdy brak klucza API w zmiennych środowiskowych
 */
export function createFlashcardsOpenRouterService(): OpenRouterService {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Brak klucza OPENROUTER_API_KEY w zmiennych środowiskowych. " +
        "Upewnij się, że zmienna jest ustawiona w pliku .env"
    );
  }

  const service = new OpenRouterService({
    apiKey,
    systemMessage: SYSTEM_MESSAGE,
    modelOptions: DEFAULT_MODEL_CONFIG,
  });

  // Konfiguracja formatu odpowiedzi
  service.setResponseFormat(FLASHCARDS_RESPONSE_FORMAT);

  return service;
}

/**
 * Singleton instancji serwisu (opcjonalne - dla optymalizacji)
 */
let serviceInstance: OpenRouterService | null = null;

/**
 * Zwraca singleton instancji serwisu OpenRouter
 * Używaj tej funkcji jeśli chcesz współdzielić jedną instancję w całej aplikacji
 *
 * @returns Instancja OpenRouterService
 */
export function getFlashcardsOpenRouterService(): OpenRouterService {
  if (!serviceInstance) {
    serviceInstance = createFlashcardsOpenRouterService();
  }
  return serviceInstance;
}

/**
 * Resetuje singleton instancji (przydatne w testach)
 */
export function resetFlashcardsOpenRouterService(): void {
  serviceInstance = null;
}
