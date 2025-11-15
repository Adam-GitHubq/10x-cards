# OpenRouter Service

Serwis do integracji z API OpenRouter dla generowania fiszek edukacyjnych w aplikacji 10xCards.

## Spis treści

- [Opis](#opis)
- [Instalacja i konfiguracja](#instalacja-i-konfiguracja)
- [Podstawowe użycie](#podstawowe-użycie)
- [API Reference](#api-reference)
- [Przykłady](#przykłady)
- [Obsługa błędów](#obsługa-błędów)
- [Bezpieczeństwo](#bezpieczeństwo)
- [Testowanie](#testowanie)

## Opis

`OpenRouterService` to serwis odpowiedzialny za:

- Wysyłanie sformatowanych zapytań do API OpenRouter
- Walidację i przetwarzanie odpowiedzi zgodnie z JSON Schema
- Konfigurację parametrów modelu LLM
- Obsługę błędów z mechanizmem retry
- Zarządzanie komunikatami systemowymi i formatem odpowiedzi

## Instalacja i konfiguracja

### Zmienne środowiskowe

Dodaj do pliku `.env`:

```env
OPENROUTER_API_KEY=sk-or-v1-...
```

### Podstawowa inicjalizacja

```typescript
import { OpenRouterService } from './lib/services/openrouter.service';

const service = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
});
```

### Zaawansowana konfiguracja

```typescript
const service = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  baseUrl: 'https://openrouter.ai/api/v1', // opcjonalny
  systemMessage: 'Jesteś ekspertem w tworzeniu fiszek edukacyjnych.',
  modelOptions: {
    model: 'openai/gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 4096,
  },
});
```

## Podstawowe użycie

### Wysyłanie wiadomości

```typescript
const response = await service.sendMessage('Wygeneruj fiszki z tego tekstu...');
console.log(response.content);
```

### Konfiguracja formatu odpowiedzi

```typescript
service.setResponseFormat({
  type: 'json_schema',
  json_schema: {
    name: 'flashcardsResponse',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        flashcards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              front: { type: 'string' },
              back: { type: 'string' },
            },
            required: ['front', 'back'],
          },
        },
      },
      required: ['flashcards'],
    },
  },
});
```

### Wysyłanie z typowaną odpowiedzią

```typescript
type FlashcardsResponse = {
  flashcards: Array<{
    front: string;
    back: string;
  }>;
};

const response = await service.sendMessage<FlashcardsResponse>(
  'Wygeneruj 5 fiszek z tego tekstu...'
);

// response.content jest typowane jako FlashcardsResponse
response.content.flashcards.forEach(card => {
  console.log(`Q: ${card.front}`);
  console.log(`A: ${card.back}`);
});
```

## API Reference

### Konstruktor

```typescript
new OpenRouterService(config: OpenRouterServiceConfig)
```

**Parametry:**

- `config.apiKey` (string, wymagany) - Klucz API OpenRouter
- `config.baseUrl` (string, opcjonalny) - Adres bazowy API
- `config.systemMessage` (string, opcjonalny) - Domyślny komunikat systemowy
- `config.responseFormat` (ResponseFormat, opcjonalny) - Format odpowiedzi
- `config.modelOptions` (Partial<ModelOptions>, opcjonalny) - Opcje modelu

**Rzuca:** `OpenRouterServiceError` gdy brak klucza API

### Metody publiczne

#### `sendMessage<T>(message: string, options?: RequestOptions): Promise<ResponseData<T>>`

Wysyła wiadomość do API OpenRouter.

**Parametry:**

- `message` - Treść wiadomości użytkownika
- `options` - Opcjonalne parametry żądania
  - `model` - Nadpisanie domyślnego modelu
  - `temperature` - Nadpisanie domyślnej temperatury
  - `maxTokens` - Nadpisanie domyślnej liczby tokenów
  - `timeout` - Timeout żądania w ms

**Zwraca:** `Promise<ResponseData<T>>` z polami:

- `content` - Sparsowana zawartość odpowiedzi (typ T)
- `model` - Model użyty do generowania
- `usage` - Statystyki użycia tokenów (opcjonalne)

**Rzuca:** `OpenRouterServiceError` w przypadku błędu

#### `setSystemMessage(systemMessage: string): void`

Ustawia komunikat systemowy.

**Parametry:**

- `systemMessage` - Nowy komunikat systemowy

**Rzuca:** `OpenRouterServiceError` gdy komunikat jest pusty

#### `setResponseFormat(responseFormat: ResponseFormat): void`

Ustawia format odpowiedzi zgodny z JSON Schema.

**Parametry:**

- `responseFormat` - Format odpowiedzi

**Rzuca:** `OpenRouterServiceError` gdy format jest nieprawidłowy

#### `configureModel(options: Partial<ModelOptions>): void`

Konfiguruje opcje modelu.

**Parametry:**

- `options` - Opcje modelu do zaktualizowania
  - `model` - Nazwa modelu
  - `temperature` - Temperatura (0.0 - 2.0)
  - `maxTokens` - Maksymalna liczba tokenów
  - `topP` - Top-p próbkowanie
  - `frequencyPenalty` - Frequency penalty
  - `presencePenalty` - Presence penalty

**Rzuca:** `OpenRouterServiceError` gdy parametry są nieprawidłowe

#### `getConfiguration(): ServiceConfiguration`

Zwraca aktualną konfigurację serwisu.

**Zwraca:** Kopię aktualnej konfiguracji

## Przykłady

### Przykład 1: Generowanie fiszek z tekstu

```typescript
import { OpenRouterService } from './lib/services/openrouter.service';

async function generateFlashcards(text: string) {
  const service = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
  });

  // Konfiguracja formatu odpowiedzi
  service.setResponseFormat({
    type: 'json_schema',
    json_schema: {
      name: 'flashcardsResponse',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          flashcards: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                front: { type: 'string' },
                back: { type: 'string' },
              },
              required: ['front', 'back'],
            },
          },
        },
        required: ['flashcards'],
      },
    },
  });

  const prompt = `Wygeneruj 5 fiszek edukacyjnych z poniższego tekstu:\n\n${text}`;

  type Response = {
    flashcards: Array<{ front: string; back: string }>;
  };

  const response = await service.sendMessage<Response>(prompt);

  return response.content.flashcards;
}
```

### Przykład 2: Dynamiczna zmiana modelu

```typescript
const service = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
});

// Użyj Claude dla złożonych tekstów
service.configureModel({
  model: 'openai/gpt-4o-mini',
  temperature: 0.7,
});

const complexResponse = await service.sendMessage('Złożony tekst...');

// Przełącz na GPT-4 dla prostszych zadań
service.configureModel({
  model: 'openai/gpt-4-turbo',
  temperature: 0.5,
});

const simpleResponse = await service.sendMessage('Prosty tekst...');
```

### Przykład 3: Obsługa błędów

```typescript
import { OpenRouterService, OpenRouterServiceError } from './lib/services/openrouter.service';

async function safeGenerate(text: string) {
  const service = new OpenRouterService({
    apiKey: import.meta.env.OPENROUTER_API_KEY,
  });

  try {
    const response = await service.sendMessage(text);
    return { success: true, data: response.content };
  } catch (error) {
    if (error instanceof OpenRouterServiceError) {
      console.error(`Błąd OpenRouter [${error.code}]:`, error.message);
      
      // Obsługa specyficznych błędów
      switch (error.code) {
        case 'INVALID_API_KEY':
          return { success: false, error: 'Nieprawidłowy klucz API' };
        case 'RATE_LIMIT_ERROR':
          return { success: false, error: 'Przekroczono limit zapytań' };
        case 'TIMEOUT_ERROR':
          return { success: false, error: 'Przekroczono czas oczekiwania' };
        default:
          return { success: false, error: 'Nieznany błąd' };
      }
    }
    
    throw error;
  }
}
```

### Przykład 4: Monitorowanie użycia tokenów

```typescript
const service = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
});

const response = await service.sendMessage('Wygeneruj fiszki...');

if (response.usage) {
  console.log(`Użyto tokenów:`);
  console.log(`- Prompt: ${response.usage.promptTokens}`);
  console.log(`- Completion: ${response.usage.completionTokens}`);
  console.log(`- Razem: ${response.usage.totalTokens}`);
}
```

## Obsługa błędów

### Typy błędów

Serwis rzuca `OpenRouterServiceError` z następującymi kodami:

- `INVALID_API_KEY` - Nieprawidłowy klucz API (status 401/403)
- `INVALID_REQUEST` - Nieprawidłowe dane żądania (status 400)
- `NETWORK_ERROR` - Błąd połączenia sieciowego
- `TIMEOUT_ERROR` - Przekroczono limit czasu (status 408)
- `RATE_LIMIT_ERROR` - Przekroczono limit zapytań (status 429)
- `API_ERROR` - Ogólny błąd API
- `VALIDATION_ERROR` - Błąd walidacji danych wejściowych
- `RESPONSE_PARSE_ERROR` - Nie udało się sparsować odpowiedzi
- `INVALID_RESPONSE_FORMAT` - Odpowiedź nie jest zgodna z formatem

### Mechanizm retry

Serwis automatycznie ponawia żądania w przypadku:

- Błędów sieciowych
- Błędów rate limit (429)
- Błędów serwera (5xx)

**Parametry retry:**

- Maksymalna liczba prób: 3
- Początkowe opóźnienie: 1 sekunda
- Strategia: exponential backoff (1s, 2s, 4s)

**Brak retry dla:**

- Błędów autoryzacji (401, 403)
- Błędów walidacji (400)
- Błędów konfiguracji

## Bezpieczeństwo

### Przechowywanie klucza API

✅ **Dobrze:**

```typescript
// Użyj zmiennych środowiskowych
const service = new OpenRouterService({
  apiKey: import.meta.env.OPENROUTER_API_KEY,
});
```

❌ **Źle:**

```typescript
// NIE hardkoduj klucza w kodzie
const service = new OpenRouterService({
  apiKey: 'sk-or-v1-...',
});
```

### Walidacja danych

Serwis automatycznie waliduje:

- Klucz API (wymagany, niepusty)
- Wiadomości (wymagane, niepuste)
- Parametry modelu (zakresy wartości)
- Format odpowiedzi (struktura JSON Schema)

### HTTPS

Wszystkie połączenia z API używają HTTPS (TLS 1.2+).

### Logowanie

Serwis nie loguje wrażliwych danych:

- Klucz API nie jest logowany
- Treść wiadomości nie jest domyślnie logowana
- Błędy są logowane bez szczegółów autoryzacji

## Testowanie

### Testy jednostkowe

```bash
npm run test src/lib/services/__tests__/openrouter.service.test.ts
```

### Mockowanie w testach

```typescript
import { vi } from 'vitest';

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      choices: [{ message: { content: 'test' } }],
      model: 'test-model',
    }),
  })
);

const service = new OpenRouterService({
  apiKey: 'test-key',
});

const response = await service.sendMessage('test');
expect(response.content).toBe('test');
```

### Testy integracyjne

Dla testów integracyjnych użyj prawdziwego klucza API w środowisku testowym:

```typescript
// test.env
OPENROUTER_API_KEY=sk-or-v1-test-key
```

## Więcej przykładów

Zobacz pełne przykłady użycia w:

- `src/lib/services/examples/openrouter.example.ts` - Zaawansowane przykłady
- `src/lib/services/ai/flashcardsGenerator.ts` - Integracja z generatorem fiszek
- `src/lib/services/__tests__/openrouter.service.test.ts` - Testy jednostkowe

## Wsparcie

W przypadku problemów:

1. Sprawdź dokumentację API OpenRouter: https://openrouter.ai/docs
2. Sprawdź logi błędów w konsoli
3. Zweryfikuj klucz API i limity
4. Sprawdź status API: https://status.openrouter.ai

