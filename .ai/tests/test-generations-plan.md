# Plan Testów Jednostkowych – Moduł Generations

## 1. Wprowadzenie

Niniejszy dokument przedstawia szczegółowy plan testów jednostkowych dla modułu generowania fiszek (generations) w aplikacji 10xCards. Plan obejmuje testowanie warstwy walidacji (schematy Zod), funkcji pomocniczych (hash), serwisu aplikacyjnego oraz logiki generowania fiszek przy użyciu AI.

## 2. Zakres testów jednostkowych

### 2.1. Komponenty objęte testami

1. **Schematy walidacji Zod** (`src/lib/schemas/generations.ts`)
   - `PostGenerationBodySchema`
   - `ListGenerationsQuerySchema`
   - `GenerationIdParamSchema`

2. **Funkcje pomocnicze** (`src/lib/utils/hash.ts`)
   - `computeMD5()`

3. **Generator fiszek AI** (`src/lib/services/ai/flashcardsGenerator.ts`)
   - `generateFlashcardProposals()`
   - Walidacja wejścia
   - Obsługa błędów

4. **Serwis aplikacyjny** (`src/lib/services/generations.service.ts`)
   - `createGeneration()`
   - `listGenerations()`
   - `getGenerationById()`
   - `deleteGeneration()`
   - `logGenerationError()` (helper)
   - Funkcje pomocnicze (mapowanie, resolveUserId)

5. **Logika biznesowa**
   - Hashowanie tekstu źródłowego
   - Mierzenie czasu generacji
   - Mapowanie danych (snake_case ↔ camelCase)
   - Obsługa błędów (GenerationServiceError)
   - Logowanie błędów generacji

## 3. Szczegółowe scenariusze testowe

### 3.1. Testy schematów Zod – `PostGenerationBodySchema`

**Lokalizacja:** `src/lib/schemas/__tests__/generations.test.ts`

#### TC-SCHEMA-POST-GEN-01: Walidacja poprawnego tekstu źródłowego
- **Wejście:**
  ```typescript
  {
    sourceText: "A".repeat(5000) // 5000 znaków
  }
  ```
- **Oczekiwany wynik:** Sukces walidacji

#### TC-SCHEMA-POST-GEN-02: Walidacja minimalnej długości (1000 znaków)
- **Testy:**
  - 999 znaków → błąd: "Tekst źródłowy musi mieć co najmniej 1000 znaków."
  - 1000 znaków → sukces
  - 1001 znaków → sukces

#### TC-SCHEMA-POST-GEN-03: Walidacja maksymalnej długości (10000 znaków)
- **Testy:**
  - 9999 znaków → sukces
  - 10000 znaków → sukces
  - 10001 znaków → błąd: "Tekst źródłowy może mieć maksymalnie 10000 znaków."

#### TC-SCHEMA-POST-GEN-04: Trimming białych znaków
- **Wejście:**
  ```typescript
  {
    sourceText: "   " + "A".repeat(1000) + "   "
  }
  ```
- **Oczekiwany wynik:** Sukces, białe znaki usunięte z początku i końca

#### TC-SCHEMA-POST-GEN-05: Walidacja pustego tekstu
- **Testy:**
  - Pusty string → błąd
  - String z samymi spacjami (po trim < 1000) → błąd
  - `null` → błąd typowania

#### TC-SCHEMA-POST-GEN-06: Walidacja typów danych
- **Testy:**
  - `sourceText` jako liczba → błąd typowania
  - `sourceText` jako obiekt → błąd typowania
  - Brak pola `sourceText` → błąd: pole wymagane

### 3.2. Testy schematów Zod – `ListGenerationsQuerySchema`

**Lokalizacja:** `src/lib/schemas/__tests__/generations.test.ts`

#### TC-SCHEMA-LIST-GEN-01: Walidacja domyślnych wartości
- **Wejście:** `{}`
- **Oczekiwany wynik:**
  ```typescript
  {
    page: 1,
    pageSize: 10,
    sort: "createdAt",
    order: "desc"
  }
  ```

#### TC-SCHEMA-LIST-GEN-02: Walidacja page (min: 1)
- **Testy:**
  - `page: 0` → błąd
  - `page: -1` → błąd
  - `page: 1` → sukces
  - `page: 100` → sukces
  - `page: "5"` → sukces (coercion do 5)

#### TC-SCHEMA-LIST-GEN-03: Walidacja pageSize (min: 1, max: 100)
- **Testy:**
  - `pageSize: 0` → błąd
  - `pageSize: 1` → sukces
  - `pageSize: 50` → sukces
  - `pageSize: 100` → sukces
  - `pageSize: 101` → błąd
  - `pageSize: "25"` → sukces (coercion do 25)

#### TC-SCHEMA-LIST-GEN-04: Walidacja sort
- **Testy:**
  - Brak pola `sort` → domyślnie "createdAt"
  - `sort: "createdAt"` → sukces
  - `sort: "  createdAt  "` → sukces (trim)
  - `sort: ""` → błąd (min: 1)
  - `sort: "invalidField"` → sukces (walidacja pola odbywa się w serwisie)

#### TC-SCHEMA-LIST-GEN-05: Walidacja order
- **Testy:**
  - Brak pola `order` → domyślnie "desc"
  - `order: "asc"` → sukces
  - `order: "desc"` → sukces
  - `order: "invalid"` → błąd
  - `order: "ASC"` → błąd (case-sensitive)

#### TC-SCHEMA-LIST-GEN-06: Walidacja opcjonalnych filtrów
- **Testy:**
  - `model: "openai/gpt-4o-mini"` → sukces
  - `model: ""` → błąd (min: 1)
  - `createdFrom: "2024-01-01T00:00:00.000Z"` → sukces
  - `createdFrom: "invalid-date"` → błąd
  - `createdTo: "2024-12-31T23:59:59.999Z"` → sukces
  - `createdTo: "2024-12-31"` → błąd (niepełny format datetime)

#### TC-SCHEMA-LIST-GEN-07: Walidacja kombinacji filtrów
- **Wejście:**
  ```typescript
  {
    page: 2,
    pageSize: 20,
    sort: "generatedCount",
    order: "asc",
    model: "openai/gpt-4o-mini",
    createdFrom: "2024-01-01T00:00:00.000Z",
    createdTo: "2024-12-31T23:59:59.999Z"
  }
  ```
- **Oczekiwany wynik:** Sukces walidacji

### 3.3. Testy schematów Zod – `GenerationIdParamSchema`

**Lokalizacja:** `src/lib/schemas/__tests__/generations.test.ts`

#### TC-SCHEMA-PARAM-GEN-01: Walidacja poprawnego ID
- **Testy:**
  - `id: 1` → sukces
  - `id: 999` → sukces
  - `id: "123"` → sukces (coercion do 123)

#### TC-SCHEMA-PARAM-GEN-02: Walidacja niepoprawnego ID
- **Testy:**
  - `id: 0` → błąd (min: 1)
  - `id: -1` → błąd
  - `id: 1.5` → błąd (musi być int)
  - `id: "abc"` → błąd (coercion nie powiedzie się)
  - Brak pola `id` → błąd: pole wymagane

### 3.4. Testy funkcji `computeMD5`

**Lokalizacja:** `src/lib/utils/__tests__/hash.test.ts`

#### TC-HASH-01: Hashowanie poprawnego tekstu
- **Wejście:** `"Hello World"`
- **Oczekiwany wynik:**
  ```typescript
  {
    output: "b10a8db164e0754105b7a99be72e3fe5"
  }
  ```

#### TC-HASH-02: Hashowanie pustego stringa
- **Wejście:** `""`
- **Oczekiwany wynik:** Błąd: "input cannot be empty"

#### TC-HASH-03: Hashowanie długiego tekstu
- **Wejście:** String 10000 znaków
- **Oczekiwany wynik:** Hash MD5 (32 znaki hex)

#### TC-HASH-04: Hashowanie tekstu z polskimi znakami
- **Wejście:** `"Zażółć gęślą jaźń"`
- **Oczekiwany wynik:** Prawidłowy hash (UTF-8)

#### TC-HASH-05: Walidacja typu wejścia
- **Testy:**
  - Liczba → błąd: "input must be a string"
  - Obiekt → błąd: "input must be a string"
  - `null` → błąd: "input must be a string"
  - `undefined` → błąd: "input must be a string"

#### TC-HASH-06: Deterministyczność hashowania
- **Test:** Hashowanie tego samego tekstu dwukrotnie zwraca identyczne wyniki

#### TC-HASH-07: Unikalne hasze dla różnych tekstów
- **Test:** Hashowanie różnych tekstów zwraca różne hasze

### 3.5. Testy generatora fiszek AI – `generateFlashcardProposals`

**Lokalizacja:** `src/lib/services/ai/__tests__/flashcardsGenerator.unit.test.ts`

**UWAGA:** W tych testach mockujemy serwis OpenRouter, aby nie zużywać tokenów.

#### TC-AI-GEN-01: Generowanie fiszek z poprawnego tekstu (mock)
- **Setup:** Mock `createFlashcardsOpenRouterService().sendMessage()` zwraca:
  ```typescript
  {
    content: {
      flashcards: [
        { front: "Pytanie 1", back: "Odpowiedź 1" },
        { front: "Pytanie 2", back: "Odpowiedź 2" },
        { front: "Pytanie 3", back: "Odpowiedź 3" }
      ]
    }
  }
  ```
- **Wejście:** `sourceText: "A".repeat(100)` (100 znaków)
- **Oczekiwany wynik:**
  ```typescript
  [
    { front: "Pytanie 1", back: "Odpowiedź 1", source: "ai-full" },
    { front: "Pytanie 2", back: "Odpowiedź 2", source: "ai-full" },
    { front: "Pytanie 3", back: "Odpowiedź 3", source: "ai-full" }
  ]
  ```

#### TC-AI-GEN-02: Walidacja minimalnej długości tekstu (50 znaków)
- **Testy:**
  - 49 znaków → błąd: "TEXT_TOO_SHORT"
  - 50 znaków → sukces (mock)
  - Pusty string → błąd: "INVALID_INPUT"
  - String z samymi spacjami → błąd: "INVALID_INPUT"

#### TC-AI-GEN-03: Walidacja typu wejścia
- **Testy:**
  - Liczba → błąd: "INVALID_INPUT"
  - Obiekt → błąd: "INVALID_INPUT"
  - `null` → błąd: "INVALID_INPUT"
  - `undefined` → błąd: "INVALID_INPUT"

#### TC-AI-GEN-04: Trimming tekstu źródłowego
- **Wejście:** `"   " + "A".repeat(100) + "   "`
- **Oczekiwany wynik:** Sukces, tekst przycięty przed walidacją długości

#### TC-AI-GEN-05: Obsługa pustej odpowiedzi z API (mock)
- **Setup:** Mock zwraca:
  ```typescript
  {
    content: {
      flashcards: []
    }
  }
  ```
- **Oczekiwany wynik:** Błąd: "NO_FLASHCARDS_GENERATED"

#### TC-AI-GEN-06: Obsługa braku pola flashcards w odpowiedzi (mock)
- **Setup:** Mock zwraca:
  ```typescript
  {
    content: {}
  }
  ```
- **Oczekiwany wynik:** Błąd: "NO_FLASHCARDS_GENERATED"

#### TC-AI-GEN-07: Obsługa błędu OpenRouterServiceError (mock)
- **Setup:** Mock rzuca `OpenRouterServiceError`
- **Oczekiwany wynik:** Błąd: "API_ERROR" z opakowanym błędem OpenRouter

#### TC-AI-GEN-08: Obsługa nieoczekiwanego błędu (mock)
- **Setup:** Mock rzuca `Error("Unexpected error")`
- **Oczekiwany wynik:** Błąd: "API_ERROR"

#### TC-AI-GEN-09: Trimming treści fiszek w odpowiedzi (mock)
- **Setup:** Mock zwraca fiszki z białymi znakami:
  ```typescript
  {
    content: {
      flashcards: [
        { front: "  Pytanie  ", back: "  Odpowiedź  " }
      ]
    }
  }
  ```
- **Oczekiwany wynik:**
  ```typescript
  [
    { front: "Pytanie", back: "Odpowiedź", source: "ai-full" }
  ]
  ```

#### TC-AI-GEN-10: Generowanie wielu fiszek (3-10)
- **Setup:** Mock zwraca 10 fiszek
- **Oczekiwany wynik:** Tablica 10 propozycji z `source: "ai-full"`

### 3.6. Testy serwisu – `createGeneration`

**Lokalizacja:** `src/lib/services/__tests__/generations.service.test.ts`

**UWAGA:** W tych testach mockujemy:
- `ctx.locals.supabase` (klient Supabase)
- `ctx.locals.user` (zalogowany użytkownik)
- `generateFlashcardProposals()` (generator AI)

#### TC-SERVICE-CREATE-01: Pomyślne utworzenie generacji
- **Setup:**
  - Mock `ctx.locals.user = { id: "user-123" }`
  - Mock `generateFlashcardProposals()` zwraca 5 propozycji
  - Mock `supabase.from("generations").insert().select().single()` zwraca:
    ```typescript
    {
      data: {
        id: 1,
        user_id: "user-123",
        model: "openai/gpt-4o-mini",
        source_text_hash: "abc123...",
        source_text_length: 5000,
        generated_count: 5,
        generation_duration: 1500,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z"
      },
      error: null
    }
    ```
- **Wejście:**
  ```typescript
  {
    sourceText: "A".repeat(5000)
  }
  ```
- **Oczekiwany wynik:**
  - `CreateGenerationResponseDto` z `generation` i `flashcardsProposals`
  - `generation.generatedCount === 5`
  - `generation.generationDuration > 0`
  - `generation.sourceTextHash` to MD5 hash
  - `generation.sourceTextLength === 5000`

#### TC-SERVICE-CREATE-02: Brak uwierzytelnionego użytkownika
- **Setup:** Mock `ctx.locals.user = null`
- **Oczekiwany wynik:** Błąd: "USER_NOT_AUTHENTICATED" (status 401)

#### TC-SERVICE-CREATE-03: Brak klienta Supabase
- **Setup:** Mock `ctx.locals.supabase = undefined`
- **Oczekiwany wynik:** Błąd: "SUPABASE_NOT_AVAILABLE" (status 500)

#### TC-SERVICE-CREATE-04: Błąd generowania AI (walidacja)
- **Setup:**
  - Mock `generateFlashcardProposals()` rzuca `FlashcardGenerationError` z kodem "TEXT_TOO_SHORT"
  - Mock `supabase.from("generation_error_logs").insert()` zwraca sukces
- **Oczekiwany wynik:**
  - Błąd: "AI_GENERATION_FAILED" (status 400)
  - Wywołanie `logGenerationError()` z odpowiednimi parametrami

#### TC-SERVICE-CREATE-05: Błąd generowania AI (API)
- **Setup:**
  - Mock `generateFlashcardProposals()` rzuca `FlashcardGenerationError` z kodem "API_ERROR"
  - Mock `supabase.from("generation_error_logs").insert()` zwraca sukces
- **Oczekiwany wynik:**
  - Błąd: "AI_GENERATION_FAILED" (status 500)
  - Wywołanie `logGenerationError()`

#### TC-SERVICE-CREATE-06: Błąd zapisu do bazy danych
- **Setup:**
  - Mock `generateFlashcardProposals()` zwraca 3 propozycje
  - Mock `supabase.from("generations").insert()` zwraca `{ data: null, error: { message: "DB error" } }`
  - Mock `supabase.from("generation_error_logs").insert()` zwraca sukces
- **Oczekiwany wynik:**
  - Błąd: "GENERATION_PERSIST_FAILED" (status 500)
  - Wywołanie `logGenerationError()`

#### TC-SERVICE-CREATE-07: Pomiar czasu generacji
- **Setup:**
  - Mock `generateFlashcardProposals()` z opóźnieniem 100ms
- **Oczekiwany wynik:**
  - `generation.generationDuration >= 100` (tolerancja ±10ms)

#### TC-SERVICE-CREATE-08: Hashowanie tekstu źródłowego
- **Setup:**
  - Mock zwraca sukces
- **Wejście:** Konkretny tekst źródłowy
- **Weryfikacja:**
  - `generation.sourceTextHash` to poprawny MD5 hash wejścia
  - Deterministyczność: ten sam tekst → ten sam hash

#### TC-SERVICE-CREATE-09: Logowanie błędu przy nieudanym zapisie logu
- **Setup:**
  - Mock `generateFlashcardProposals()` rzuca błąd
  - Mock `supabase.from("generation_error_logs").insert()` zwraca błąd
- **Oczekiwany wynik:**
  - Główny błąd: "AI_GENERATION_FAILED"
  - Błąd logowania nie eskaluje (silent fail)

### 3.7. Testy serwisu – `listGenerations`

**Lokalizacja:** `src/lib/services/__tests__/generations.service.test.ts`

#### TC-SERVICE-LIST-01: Listowanie generacji z domyślnymi parametrami
- **Setup:**
  - Mock `ctx.locals.user = { id: "user-123" }`
  - Mock `supabase.from("generations").select()` zwraca 3 rekordy
  - Mock `count: 3`
- **Wejście:**
  ```typescript
  {
    page: 1,
    pageSize: 10,
    sort: "createdAt",
    order: "desc"
  }
  ```
- **Oczekiwany wynik:**
  ```typescript
  {
    items: [/* 3 GenerationBaseDto */],
    pagination: {
      page: 1,
      pageSize: 10,
      total: 3
    }
  }
  ```
- **Weryfikacja:**
  - Wywołanie `.eq("user_id", "user-123")`
  - Wywołanie `.order("created_at", { ascending: false })`
  - Wywołanie `.range(0, 9)`

#### TC-SERVICE-LIST-02: Paginacja (strona 2, rozmiar 5)
- **Setup:** Mock zwraca 5 rekordów, `count: 12`
- **Wejście:**
  ```typescript
  {
    page: 2,
    pageSize: 5,
    sort: "createdAt",
    order: "desc"
  }
  ```
- **Weryfikacja:**
  - Wywołanie `.range(5, 9)` (offset: 5, rangeEnd: 9)
  - `pagination.total === 12`

#### TC-SERVICE-LIST-03: Sortowanie po różnych kolumnach
- **Testy:**
  - `sort: "createdAt"` → `.order("created_at", ...)`
  - `sort: "updatedAt"` → `.order("updated_at", ...)`
  - `sort: "generatedCount"` → `.order("generated_count", ...)`
  - `sort: "model"` → `.order("model", ...)`
  - `sort: "invalidField"` → `.order("created_at", ...)` (fallback do domyślnego)

#### TC-SERVICE-LIST-04: Sortowanie rosnące/malejące
- **Testy:**
  - `order: "asc"` → `.order(..., { ascending: true })`
  - `order: "desc"` → `.order(..., { ascending: false })`

#### TC-SERVICE-LIST-05: Filtrowanie po modelu
- **Setup:** Mock `query.model = "openai/gpt-4o-mini"`
- **Weryfikacja:**
  - Wywołanie `.eq("model", "openai/gpt-4o-mini")`

#### TC-SERVICE-LIST-06: Filtrowanie po zakresie dat
- **Setup:**
  ```typescript
  query.createdFrom = "2024-01-01T00:00:00.000Z"
  query.createdTo = "2024-12-31T23:59:59.999Z"
  ```
- **Weryfikacja:**
  - Wywołanie `.gte("created_at", "2024-01-01T00:00:00.000Z")`
  - Wywołanie `.lte("created_at", "2024-12-31T23:59:59.999Z")`

#### TC-SERVICE-LIST-07: Kombinacja filtrów
- **Setup:**
  ```typescript
  {
    page: 2,
    pageSize: 20,
    sort: "generatedCount",
    order: "asc",
    model: "openai/gpt-4o-mini",
    createdFrom: "2024-01-01T00:00:00.000Z",
    createdTo: "2024-12-31T23:59:59.999Z"
  }
  ```
- **Weryfikacja:**
  - Wszystkie filtry i sortowanie zastosowane
  - Poprawny offset i range

#### TC-SERVICE-LIST-08: Pusta lista (brak rekordów)
- **Setup:** Mock zwraca `{ data: [], count: 0 }`
- **Oczekiwany wynik:**
  ```typescript
  {
    items: [],
    pagination: {
      page: 1,
      pageSize: 10,
      total: 0
    }
  }
  ```

#### TC-SERVICE-LIST-09: Błąd pobierania z bazy danych
- **Setup:** Mock zwraca `{ data: null, error: { message: "DB error" } }`
- **Oczekiwany wynik:** Błąd: "GENERATION_LIST_FAILED" (status 500)

#### TC-SERVICE-LIST-10: Brak uwierzytelnionego użytkownika
- **Setup:** Mock `ctx.locals.user = null`
- **Oczekiwany wynik:** Błąd: "USER_NOT_AUTHENTICATED" (status 401)

#### TC-SERVICE-LIST-11: Mapowanie pól snake_case → camelCase
- **Setup:** Mock zwraca rekord z polami snake_case
- **Weryfikacja:**
  - `source_text_hash` → `sourceTextHash`
  - `source_text_length` → `sourceTextLength`
  - `generated_count` → `generatedCount`
  - `generation_duration` → `generationDuration`
  - `created_at` → `createdAt`
  - `updated_at` → `updatedAt`

### 3.8. Testy serwisu – `getGenerationById`

**Lokalizacja:** `src/lib/services/__tests__/generations.service.test.ts`

#### TC-SERVICE-GET-01: Pobranie istniejącej generacji
- **Setup:**
  - Mock `ctx.locals.user = { id: "user-123" }`
  - Mock `supabase.from("generations").select().eq("user_id", ...).eq("id", 1).maybeSingle()` zwraca rekord
- **Wejście:** `id: 1`
- **Oczekiwany wynik:** `GenerationBaseDto` z ID=1

#### TC-SERVICE-GET-02: Próba pobrania nieistniejącej generacji
- **Setup:** Mock zwraca `{ data: null, error: null }`
- **Oczekiwany wynik:** `null` (nie rzuca błędu)

#### TC-SERVICE-GET-03: Próba pobrania generacji innego użytkownika
- **Setup:**
  - Mock `ctx.locals.user = { id: "user-123" }`
  - Mock `.eq("user_id", "user-123")` w zapytaniu
  - Mock zwraca `{ data: null }` (brak rekordu dla tego użytkownika)
- **Oczekiwany wynik:** `null`

#### TC-SERVICE-GET-04: Błąd bazy danych (inny niż PGRST116)
- **Setup:** Mock zwraca `{ data: null, error: { code: "UNKNOWN", message: "DB error" } }`
- **Oczekiwany wynik:** Błąd: "GENERATION_FETCH_FAILED" (status 500)

#### TC-SERVICE-GET-05: Błąd PGRST116 (nie znaleziono)
- **Setup:** Mock zwraca `{ data: null, error: { code: "PGRST116" } }`
- **Oczekiwany wynik:** `null` (nie eskaluje błędu)

#### TC-SERVICE-GET-06: Brak uwierzytelnionego użytkownika
- **Setup:** Mock `ctx.locals.user = null`
- **Oczekiwany wynik:** Błąd: "USER_NOT_AUTHENTICATED" (status 401)

#### TC-SERVICE-GET-07: Mapowanie pól
- **Setup:** Mock zwraca rekord z polami snake_case
- **Weryfikacja:** Poprawne mapowanie do camelCase

### 3.9. Testy serwisu – `deleteGeneration`

**Lokalizacja:** `src/lib/services/__tests__/generations.service.test.ts`

#### TC-SERVICE-DELETE-01: Pomyślne usunięcie generacji
- **Setup:**
  - Mock `ctx.locals.user = { id: "user-123" }`
  - Mock `supabase.from("generations").delete().eq("user_id", ...).eq("id", 1).select("id")` zwraca:
    ```typescript
    {
      data: [{ id: 1 }],
      error: null
    }
    ```
- **Wejście:** `id: 1`
- **Oczekiwany wynik:** `true`

#### TC-SERVICE-DELETE-02: Próba usunięcia nieistniejącej generacji
- **Setup:** Mock zwraca `{ data: [], error: null }`
- **Oczekiwany wynik:** `false` (nie rzuca błędu)

#### TC-SERVICE-DELETE-03: Próba usunięcia generacji innego użytkownika
- **Setup:**
  - Mock `.eq("user_id", "user-123")` w zapytaniu
  - Mock zwraca `{ data: [] }` (brak usuniętych rekordów)
- **Oczekiwany wynik:** `false`

#### TC-SERVICE-DELETE-04: Błąd bazy danych
- **Setup:** Mock zwraca `{ data: null, error: { message: "DB error" } }`
- **Oczekiwany wynik:** Błąd: "GENERATION_DELETE_FAILED" (status 500)

#### TC-SERVICE-DELETE-05: Brak uwierzytelnionego użytkownika
- **Setup:** Mock `ctx.locals.user = null`
- **Oczekiwany wynik:** Błąd: "USER_NOT_AUTHENTICATED" (status 401)

#### TC-SERVICE-DELETE-06: Weryfikacja kaskadowego ustawiania NULL w fiszkach
- **UWAGA:** To testowane na poziomie integracyjnym/bazy danych
- **Scenariusz:** Po usunięciu generacji, pola `generation_id` w `flashcards` ustawiane są na `NULL` (FK ON DELETE SET NULL)

### 3.10. Testy funkcji pomocniczych

**Lokalizacja:** `src/lib/services/__tests__/generations.service.test.ts`

#### TC-SERVICE-HELPER-01: `resolveUserId()` z poprawnym użytkownikiem
- **Setup:** Mock `ctx.locals.user = { id: "user-123" }`
- **Oczekiwany wynik:** `"user-123"`

#### TC-SERVICE-HELPER-02: `resolveUserId()` z brakiem użytkownika
- **Testy:**
  - `ctx.locals.user = null` → błąd
  - `ctx.locals.user = undefined` → błąd
  - `ctx.locals.user = { id: null }` → błąd
  - `ctx.locals.user = { id: "" }` → błąd

#### TC-SERVICE-HELPER-03: `getSupabaseClient()` z poprawnym klientem
- **Setup:** Mock `ctx.locals.supabase = { /* mock client */ }`
- **Oczekiwany wynik:** Zwrócony mock client

#### TC-SERVICE-HELPER-04: `getSupabaseClient()` z brakiem klienta
- **Testy:**
  - `ctx.locals.supabase = null` → błąd
  - `ctx.locals.supabase = undefined` → błąd

#### TC-SERVICE-HELPER-05: `mapGenerationRowToDto()` mapuje wszystkie pola
- **Wejście:**
  ```typescript
  {
    id: 1,
    user_id: "user-123",
    model: "openai/gpt-4o-mini",
    source_text_hash: "abc123",
    source_text_length: 5000,
    generated_count: 7,
    generation_duration: 1234,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z"
  }
  ```
- **Oczekiwany wynik:**
  ```typescript
  {
    id: 1,
    model: "openai/gpt-4o-mini",
    sourceTextHash: "abc123",
    sourceTextLength: 5000,
    generatedCount: 7,
    generationDuration: 1234,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  }
  ```
- **Weryfikacja:** Brak pola `user_id` w DTO (nie jest publiczne)

#### TC-SERVICE-HELPER-06: `extractErrorMessage()` obsługuje różne typy błędów
- **Testy:**
  - String → zwraca string
  - Obiekt z `message` → zwraca `message`
  - Obiekt bez `message` → zwraca "Nieznany błąd"
  - `null` → zwraca "Nieznany błąd"
  - `undefined` → zwraca "Nieznany błąd"
  - Liczba → zwraca "Nieznany błąd"

#### TC-SERVICE-HELPER-07: `logGenerationError()` wstawia rekord
- **Setup:**
  - Mock `supabase.from("generation_error_logs").insert()`
- **Wejście:**
  ```typescript
  {
    user_id: "user-123",
    model: "openai/gpt-4o-mini",
    source_text_hash: "abc123",
    source_text_length: 5000,
    error_code: "AI_GENERATION_FAILED",
    error_message: "Timeout"
  }
  ```
- **Weryfikacja:**
  - Wywołanie `insert()` z odpowiednimi parametrami
  - Brak pola `created_at` (ustawiane przez DB)

#### TC-SERVICE-HELPER-08: `logGenerationError()` silent fail przy błędzie
- **Setup:** Mock `insert()` zwraca błąd
- **Oczekiwany wynik:** Funkcja nie rzuca błędu (tylko console.log, jeśli zaimplementowano)

#### TC-SERVICE-HELPER-09: `isPostgrestNotFoundError()` rozpoznaje błąd PGRST116
- **Testy:**
  - `{ code: "PGRST116" }` → `true`
  - `{ code: "OTHER" }` → `false`
  - `null` → `false`
  - `undefined` → `false`

## 4. Strategie mockowania

### 4.1. Mockowanie klienta Supabase

Każdy test serwisu powinien mockować klienta Supabase:

```typescript
const mockSupabase = {
  from: vi.fn().mockReturnValue({
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { /* ... */ }, error: null })
      })
    }),
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { /* ... */ }, error: null })
    }),
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null })
    })
  })
};

const mockContext = {
  locals: {
    supabase: mockSupabase,
    user: { id: "user-123", email: "test@example.com" }
  }
};
```

### 4.2. Mockowanie generatora AI

```typescript
import { vi } from 'vitest';

// Mock modułu flashcardsGenerator
vi.mock('../ai/flashcardsGenerator', () => ({
  generateFlashcardProposals: vi.fn(),
  FlashcardGenerationError: class FlashcardGenerationError extends Error {
    constructor(message: string, public code: string) {
      super(message);
    }
  }
}));

// W teście:
import { generateFlashcardProposals } from '../ai/flashcardsGenerator';

(generateFlashcardProposals as any).mockResolvedValue([
  { front: "Q1", back: "A1", source: "ai-full" },
  { front: "Q2", back: "A2", source: "ai-full" }
]);
```

### 4.3. Mockowanie serwisu OpenRouter

W testach `flashcardsGenerator.unit.test.ts`:

```typescript
import { vi } from 'vitest';

// Mock konfiguracji OpenRouter
vi.mock('./openrouter.config', () => ({
  createFlashcardsOpenRouterService: vi.fn(() => ({
    sendMessage: vi.fn()
  }))
}));

// W teście:
import { createFlashcardsOpenRouterService } from './openrouter.config';

const mockSendMessage = vi.fn().mockResolvedValue({
  content: {
    flashcards: [
      { front: "Q1", back: "A1" },
      { front: "Q2", back: "A2" }
    ]
  }
});

(createFlashcardsOpenRouterService as any).mockReturnValue({
  sendMessage: mockSendMessage
});
```

### 4.4. Mockowanie funkcji hash

W testach integracyjnych (opcjonalnie):

```typescript
import { vi } from 'vitest';

vi.mock('../../utils/hash', () => ({
  computeMD5: vi.fn(async (input: string) => ({
    output: `mock-hash-${input.length}`
  }))
}));
```

## 5. Kryteria akceptacji testów

### 5.1. Pokrycie kodu (Code Coverage)

- **Schematy walidacji:** 100% (wszystkie ścieżki walidacji)
- **Funkcja hash:** 100%
- **Generator AI:** 90%+ (z mockami)
- **Serwis:** 85%+ (funkcje biznesowe, obsługa błędów)

### 5.2. Jakość testów

- Każdy test jest niezależny (nie dzieli stanu z innymi testami)
- Używamy wzorca Arrange-Act-Assert
- Asercje są jasne i precyzyjne
- Mocki są resetowane przed każdym testem (`beforeEach(() => vi.clearAllMocks())`)

### 5.3. Dokumentacja

- Każdy test ma opisową nazwę (scenariusz biznesowy, nie implementacja)
- Grupy testów są logicznie organizowane w bloki `describe()`
- Komentarze wyjaśniają nietypowe przypadki

## 6. Narzędzia i konfiguracja

### 6.1. Framework testowy

- **Vitest** – szybkie testy jednostkowe i integracyjne
- **Konfiguracja:** `vitest.config.ts`, `vitest.workspace.ts`

### 6.2. Biblioteki pomocnicze

- **@vitest/spy** – mocki i spies
- **Zod** – walidacja schematów

### 6.3. Komendy

```bash
# Uruchomienie wszystkich testów generations
npm run test -- generations

# Uruchomienie testów w trybie watch
npm run test:watch -- generations

# Raport pokrycia
npm run test:coverage -- generations

# Uruchomienie konkretnego pliku
npm run test -- generations.service.test.ts
```

## 7. Harmonogram implementacji testów

1. **Faza 1: Fundamenty (1-2 dni)**
   - Testy schematów Zod (`generations.test.ts`)
   - Testy funkcji `computeMD5()` (`hash.test.ts`)

2. **Faza 2: Logika AI (2-3 dni)**
   - Testy `generateFlashcardProposals()` z mockami (`flashcardsGenerator.unit.test.ts`)
   - Setup mocków OpenRouter

3. **Faza 3: Serwis aplikacyjny (3-4 dni)**
   - Testy `createGeneration()` (z mockami AI i Supabase)
   - Testy `listGenerations()`
   - Testy `getGenerationById()`
   - Testy `deleteGeneration()`
   - Testy funkcji pomocniczych

4. **Faza 4: Optymalizacja (1-2 dni)**
   - Refaktoryzacja mocków do wspólnych helperów
   - Uzupełnienie brakujących przypadków brzegowych
   - Przegląd pokrycia kodu

## 8. Zależności między testami

- Testy schematów Zod są niezależne
- Testy `computeMD5()` są niezależne
- Testy generatora AI zależą od mockowania OpenRouter
- Testy serwisu zależą od mockowania:
  - Klienta Supabase
  - Generatora AI (`generateFlashcardProposals`)
  - Funkcji hash (`computeMD5`)

## 9. Dokumentacja dodatkowa

### 9.1. Wzorce błędów

**GenerationServiceError:**
```typescript
{
  message: string,
  status: number (400, 401, 404, 500),
  code: string (ERROR_CODES)
}
```

**FlashcardGenerationError:**
```typescript
{
  message: string,
  code: string ("INVALID_INPUT" | "TEXT_TOO_SHORT" | "API_ERROR" | "NO_FLASHCARDS_GENERATED"),
  originalError?: unknown
}
```

### 9.2. Przykładowe dane testowe

**Minimalny tekst źródłowy (1000 znaków):**
```typescript
const MIN_SOURCE_TEXT = "A".repeat(1000);
```

**Maksymalny tekst źródłowy (10000 znaków):**
```typescript
const MAX_SOURCE_TEXT = "A".repeat(10000);
```

**Mock generacji:**
```typescript
const MOCK_GENERATION: GenerationBaseDto = {
  id: 1,
  model: "openai/gpt-4o-mini",
  sourceTextHash: "d41d8cd98f00b204e9800998ecf8427e",
  sourceTextLength: 5000,
  generatedCount: 5,
  generationDuration: 1234,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
};
```

**Mock propozycji:**
```typescript
const MOCK_PROPOSALS: FlashcardProposalDto[] = [
  { front: "Pytanie 1", back: "Odpowiedź 1", source: "ai-full" },
  { front: "Pytanie 2", back: "Odpowiedź 2", source: "ai-full" },
  { front: "Pytanie 3", back: "Odpowiedź 3", source: "ai-full" }
];
```

## 10. Metryki sukcesu

- **Pokrycie kodu:** ≥85% dla całego modułu generations
- **Liczba testów:** ≥80 scenariuszy testowych
- **Czas wykonania:** <5 sekund dla wszystkich testów jednostkowych
- **Stabilność:** 0 flaky tests (testy deterministyczne)
- **CI/CD:** Wszystkie testy przechodzą przed merge do `main`

## 11. Podsumowanie

Ten plan testów zapewnia kompleksowe pokrycie modułu generations, obejmując:

1. **Walidację wejścia** (schematy Zod)
2. **Logikę pomocniczą** (haszowanie)
3. **Generowanie AI** (z mockami, bez zużycia tokenów)
4. **Operacje biznesowe** (serwis z mockami Supabase)
5. **Obsługę błędów** (logowanie, propagacja)

Implementacja testów zgodnie z tym planem zagwarantuje wysoką jakość, łatwość utrzymania i pewność przy refaktoryzacji kodu w przyszłości.

