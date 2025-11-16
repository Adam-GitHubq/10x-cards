# Plan Testów Jednostkowych – Moduł Flashcards

## 1. Wprowadzenie

Niniejszy dokument przedstawia szczegółowy plan testów jednostkowych dla modułu zarządzania fiszkami (flashcards) w aplikacji 10xCards. Plan obejmuje testowanie warstwy walidacji (schematy Zod), serwisów aplikacyjnych oraz logiki biznesowej związanej z operacjami CRUD na fiszkach.

## 2. Zakres testów jednostkowych

### 2.1. Komponenty objęte testami

1. **Schematy walidacji Zod** (`src/lib/schemas/flashcards.ts`)
   - `PostFlashcardsBodySchema`
   - `ListFlashcardsQuerySchema`
   - `FlashcardIdParamSchema`
   - `PutFlashcardBodySchema`

2. **Serwis aplikacyjny** (`src/lib/services/flashcards.service.ts`)
   - `createFlashcards()`
   - `listFlashcards()`
   - `getFlashcardById()`
   - `updateFlashcard()`
   - `deleteFlashcard()`
   - Funkcje pomocnicze (mapowanie, resolveUserId)

3. **Logika biznesowa**
   - Walidacje krzyżowe (source ↔ generationId)
   - Mapowanie danych (snake_case ↔ camelCase)
   - Obsługa błędów (FlashcardServiceError)

## 3. Szczegółowe scenariusze testowe

### 3.1. Testy schematów Zod – `PostFlashcardsBodySchema`

**Lokalizacja:** `src/lib/schemas/__tests__/flashcards.test.ts`

#### TC-SCHEMA-POST-01: Walidacja pojedynczej karty z poprawnymi danymi (source: manual)
- **Wejście:**
  ```typescript
  {
    cards: [{
      front: "Pytanie testowe",
      back: "Odpowiedź testowa",
      source: "manual"
    }]
  }
  ```
- **Oczekiwany wynik:** Sukces walidacji, `generationId` undefined/null

#### TC-SCHEMA-POST-02: Walidacja wielu kart z różnymi źródłami
- **Wejście:**
  ```typescript
  {
    cards: [
      { front: "Q1", back: "A1", source: "manual" },
      { front: "Q2", back: "A2", source: "ai-full", generationId: 123 },
      { front: "Q3", back: "A3", source: "ai-edited", generationId: 123 }
    ]
  }
  ```
- **Oczekiwany wynik:** Sukces walidacji

#### TC-SCHEMA-POST-03: Domyślna wartość source (manual)
- **Wejście:**
  ```typescript
  {
    cards: [{
      front: "Pytanie",
      back: "Odpowiedź"
      // brak pola source
    }]
  }
  ```
- **Oczekiwany wynik:** Sukces, `source` ustawione na `"manual"`

#### TC-SCHEMA-POST-04: Walidacja długości front (min: 1, max: 200)
- **Testy:**
  - Pusty string → błąd
  - 1 znak → sukces
  - 200 znaków → sukces
  - 201 znaków → błąd
  - String z samymi spacjami → błąd (po trim)

#### TC-SCHEMA-POST-05: Walidacja długości back (min: 1, max: 500)
- **Testy:**
  - Pusty string → błąd
  - 1 znak → sukces
  - 500 znaków → sukces
  - 501 znaków → błąd

#### TC-SCHEMA-POST-06: Trimming białych znaków
- **Wejście:**
  ```typescript
  {
    cards: [{
      front: "  Pytanie z spacjami  ",
      back: "  Odpowiedź z spacjami  ",
      source: "manual"
    }]
  }
  ```
- **Oczekiwany wynik:** Sukces, front i back oczyszczone ze spacji

#### TC-SCHEMA-POST-07: Walidacja krzyżowa – manual bez generationId
- **Wejście:**
  ```typescript
  {
    cards: [{
      front: "Q",
      back: "A",
      source: "manual",
      generationId: 123  // ZABRONIONE dla manual
    }]
  }
  ```
- **Oczekiwany wynik:** Błąd walidacji krzyżowej

#### TC-SCHEMA-POST-08: Walidacja krzyżowa – ai-full wymaga generationId
- **Wejście:**
  ```typescript
  {
    cards: [{
      front: "Q",
      back: "A",
      source: "ai-full"
      // brak generationId
    }]
  }
  ```
- **Oczekiwany wynik:** Błąd walidacji krzyżowej

#### TC-SCHEMA-POST-09: Walidacja krzyżowa – ai-edited wymaga generationId
- **Wejście:**
  ```typescript
  {
    cards: [{
      front: "Q",
      back: "A",
      source: "ai-edited"
      // brak generationId
    }]
  }
  ```
- **Oczekiwany wynik:** Błąd walidacji krzyżowej

#### TC-SCHEMA-POST-10: Walidacja generationId (musi być dodatnim integerem)
- **Testy:**
  - `generationId: 0` → błąd
  - `generationId: -1` → błąd
  - `generationId: 1` → sukces
  - `generationId: "123"` → sukces (coerce to number)
  - `generationId: "abc"` → błąd

#### TC-SCHEMA-POST-11: Walidacja minimalnej liczby kart
- **Wejście:**
  ```typescript
  { cards: [] }
  ```
- **Oczekiwany wynik:** Błąd (min 1 karta)

#### TC-SCHEMA-POST-12: Walidacja maksymalnej liczby kart
- **Wejście:** 101 kart w tablicy
- **Oczekiwany wynik:** Błąd (max 100 kart)

#### TC-SCHEMA-POST-13: Walidacja nieprawidłowego typu source
- **Wejście:**
  ```typescript
  {
    cards: [{
      front: "Q",
      back: "A",
      source: "invalid-source"
    }]
  }
  ```
- **Oczekiwany wynik:** Błąd (enum validation)

### 3.2. Testy schematów Zod – `ListFlashcardsQuerySchema`

**Lokalizacja:** `src/lib/schemas/__tests__/flashcards.test.ts`

#### TC-SCHEMA-LIST-01: Domyślne wartości parametrów
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

#### TC-SCHEMA-LIST-02: Walidacja page (min: 1)
- **Testy:**
  - `page: 0` → błąd
  - `page: -1` → błąd
  - `page: 1` → sukces
  - `page: "5"` → sukces (coerce)

#### TC-SCHEMA-LIST-03: Walidacja pageSize (min: 1, max: 100)
- **Testy:**
  - `pageSize: 0` → błąd
  - `pageSize: 1` → sukces
  - `pageSize: 100` → sukces
  - `pageSize: 101` → błąd

#### TC-SCHEMA-LIST-04: Walidacja sort (whitelist)
- **Testy:**
  - `sort: "createdAt"` → sukces
  - `sort: "updatedAt"` → sukces (jeśli wspierane)
  - `sort: "invalidField"` → błąd lub filtrowanie

#### TC-SCHEMA-LIST-05: Walidacja order (enum)
- **Testy:**
  - `order: "asc"` → sukces
  - `order: "desc"` → sukces
  - `order: "invalid"` → błąd

#### TC-SCHEMA-LIST-06: Walidacja opcjonalnego filtra source
- **Testy:**
  - `source: "manual"` → sukces
  - `source: "ai-full"` → sukces
  - `source: "ai-edited"` → sukces
  - `source: "invalid"` → błąd

#### TC-SCHEMA-LIST-07: Walidacja opcjonalnego filtra generationId
- **Testy:**
  - `generationId: 1` → sukces
  - `generationId: "123"` → sukces (coerce)
  - `generationId: 0` → błąd
  - `generationId: -1` → błąd

### 3.3. Testy schematów Zod – `FlashcardIdParamSchema`

**Lokalizacja:** `src/lib/schemas/__tests__/flashcards.test.ts`

#### TC-SCHEMA-PARAM-01: Walidacja poprawnego ID
- **Wejście:** `{ id: 1 }`
- **Oczekiwany wynik:** Sukces

#### TC-SCHEMA-PARAM-02: Coerce string to number
- **Wejście:** `{ id: "123" }`
- **Oczekiwany wynik:** Sukces, `id` = 123

#### TC-SCHEMA-PARAM-03: Walidacja nieprawidłowych wartości
- **Testy:**
  - `id: 0` → błąd
  - `id: -1` → błąd
  - `id: "abc"` → błąd
  - `id: null` → błąd

### 3.4. Testy schematów Zod – `PutFlashcardBodySchema`

**Lokalizacja:** `src/lib/schemas/__tests__/flashcards.test.ts`

#### TC-SCHEMA-PUT-01: Walidacja poprawnych danych
- **Wejście:**
  ```typescript
  {
    front: "Zaktualizowane pytanie",
    back: "Zaktualizowana odpowiedź"
  }
  ```
- **Oczekiwany wynik:** Sukces

#### TC-SCHEMA-PUT-02: Walidacja długości front (identycznie jak w POST)
- Powtórz testy TC-SCHEMA-POST-04

#### TC-SCHEMA-PUT-03: Walidacja długości back (identycznie jak w POST)
- Powtórz testy TC-SCHEMA-POST-05

#### TC-SCHEMA-PUT-04: Trimming białych znaków
- Powtórz test TC-SCHEMA-POST-06

#### TC-SCHEMA-PUT-05: Brak możliwości zmiany source
- **Uwaga:** Schema nie zawiera pola `source` (zgodnie z API plan)
- **Test:** Upewnić się, że dodatkowe pole `source` jest ignorowane

### 3.5. Testy serwisu – `createFlashcards()`

**Lokalizacja:** `src/lib/services/__tests__/flashcards.service.test.ts`

**Setup:** Mock `SupabaseServerClient` używając `vi.fn()` i `vi.spyOn()`

#### TC-SERVICE-CREATE-01: Pomyślne utworzenie karty manual
- **Mockowanie:**
  - `select('id').from('generations')` → zwraca puste dane (brak weryfikacji generationId)
  - `insert().select('*')` → zwraca zmockowane dane fiszki
- **Wywołanie:**
  ```typescript
  createFlashcards(context, {
    cards: [{ front: "Q", back: "A", source: "manual" }]
  })
  ```
- **Asercje:**
  - Brak wywołania weryfikacji `generations`
  - Insert wywołany z `user_id`, `front`, `back`, `source: 'manual'`, `generation_id: null`
  - Zwrócona `CreateFlashcardsResponseDto` z 1 kartą

#### TC-SERVICE-CREATE-02: Pomyślne utworzenie kart AI z weryfikacją generationId
- **Mockowanie:**
  - `select('id').from('generations')` → zwraca `[{id: 123}]`
  - `insert().select('*')` → zwraca zmockowane dane
- **Wywołanie:**
  ```typescript
  createFlashcards(context, {
    cards: [
      { front: "Q1", back: "A1", source: "ai-full", generationId: 123 },
      { flront: "Q2", back: "A2", source: "ai-edited", generationId: 123 }
    ]
  })
  ```
- **Asercje:**
  - Weryfikacja wywołana z `user_id` i `id IN (123)`
  - Insert wywołany z `generation_id: 123` dla obu kart

#### TC-SERVICE-CREATE-03: Błąd – generationId nie istnieje
- **Mockowanie:**
  - `select('id').from('generations')` → zwraca puste `[]`
- **Wywołanie:**
  ```typescript
  createFlashcards(context, {
    cards: [{ front: "Q", back: "A", source: "ai-full", generationId: 999 }]
  })
  ```
- **Oczekiwany wynik:** `FlashcardServiceError` z kodem `GENERATION_NOT_FOUND`, status 404

#### TC-SERVICE-CREATE-04: Błąd – generationId należy do innego użytkownika
- **Mockowanie:**
  - `select('id').from('generations')` → zwraca puste `[]` (user_id nie pasuje)
- **Oczekiwany wynik:** Błąd 404

#### TC-SERVICE-CREATE-05: Bulk insert wielu kart (optymalizacja)
- **Wywołanie:** 50 kart różnych typów
- **Asercje:**
  - Pojedyncze wywołanie `insert()` z tablicą 50 elementów
  - Nie 50 osobnych insertów

#### TC-SERVICE-CREATE-06: Deduplikacja generationId przy weryfikacji
- **Wywołanie:** 10 kart z tym samym `generationId: 123`
- **Asercje:**
  - Zapytanie weryfikacyjne zawiera tylko `[123]`, nie 10x `123`

#### TC-SERVICE-CREATE-07: Mapowanie danych z DB (snake_case → camelCase)
- **Mockowanie:**
  - Insert zwraca:
    ```typescript
    [{
      id: 1,
      user_id: "uuid",
      generation_id: 123,
      source: "ai-full",
      front: "Q",
      back: "A",
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z"
    }]
    ```
- **Oczekiwany wynik:**
  ```typescript
  {
    flashcards: [{
      id: 1,
      generationId: 123,
      source: "ai-full",
      front: "Q",
      back: "A",
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z"
    }]
  }
  ```

#### TC-SERVICE-CREATE-08: Obsługa błędu bazy danych
- **Mockowanie:**
  - `insert()` rzuca błąd Supabase
- **Oczekiwany wynik:** `FlashcardServiceError` z kodem `FLASHCARD_CREATE_FAILED`, status 500

#### TC-SERVICE-CREATE-09: Błąd – brak uwierzytelnienia
- **Setup:** `context.locals.supabase` = null/undefined
- **Oczekiwany wynik:** `FlashcardServiceError` z kodem `SUPABASE_NOT_AVAILABLE`

#### TC-SERVICE-CREATE-10: Resolving userId (tymczasowy DEFAULT_SUPABASE_USER_ID)
- **Asercje:**
  - Wywołanie `resolveUserId()` i użycie zwróconego ID w zapytaniach

### 3.6. Testy serwisu – `listFlashcards()`

**Lokalizacja:** `src/lib/services/__tests__/flashcards.service.test.ts`

#### TC-SERVICE-LIST-01: Listowanie bez filtrów (domyślne parametry)
- **Wywołanie:**
  ```typescript
  listFlashcards(context, {})
  ```
- **Mockowanie:**
  - `select('*', { count: 'exact' })` → zwraca 25 kart
  - `range(0, 9)` → zwraca pierwsze 10
- **Asercje:**
  - Warunek `user_id = :uid`
  - Sort: `order('created_at', { ascending: false })`
  - Paginacja: `range(0, 9)`
  - Zwrócona `ListFlashcardsResponseDto`:
    ```typescript
    {
      items: [10 kart],
      pagination: { page: 1, pageSize: 10, total: 25 }
    }
    ```

#### TC-SERVICE-LIST-02: Paginacja – strona 2
- **Wywołanie:**
  ```typescript
  listFlashcards(context, { page: 2, pageSize: 10 })
  ```
- **Asercje:**
  - `range(10, 19)` wywołane

#### TC-SERVICE-LIST-03: Sortowanie rosnące
- **Wywołanie:**
  ```typescript
  listFlashcards(context, { order: "asc" })
  ```
- **Asercje:**
  - `order('created_at', { ascending: true })`

#### TC-SERVICE-LIST-04: Filtrowanie po source
- **Wywołanie:**
  ```typescript
  listFlashcards(context, { source: "manual" })
  ```
- **Asercje:**
  - Warunek `source = 'manual'` dodany do query

#### TC-SERVICE-LIST-05: Filtrowanie po generationId
- **Wywołanie:**
  ```typescript
  listFlashcards(context, { generationId: 123 })
  ```
- **Asercje:**
  - Warunek `generation_id = 123` dodany do query

#### TC-SERVICE-LIST-06: Kombinacja filtrów
- **Wywołanie:**
  ```typescript
  listFlashcards(context, { 
    page: 2, 
    pageSize: 20, 
    source: "ai-full",
    generationId: 123,
    order: "asc"
  })
  ```
- **Asercje:**
  - Wszystkie warunki zastosowane poprawnie

#### TC-SERVICE-LIST-07: Whitelist pól sortowania
- **Wywołanie:**
  ```typescript
  listFlashcards(context, { sort: "createdAt" })
  ```
- **Asercje:**
  - Mapowanie `createdAt` → `created_at`
  - Brak możliwości SQL injection przez pole sort

#### TC-SERVICE-LIST-08: Pusta lista (brak wyników)
- **Mockowanie:**
  - Query zwraca `[]`, count = 0
- **Oczekiwany wynik:**
  ```typescript
  {
    items: [],
    pagination: { page: 1, pageSize: 10, total: 0 }
  }
  ```

#### TC-SERVICE-LIST-09: Mapowanie danych (snake_case → camelCase)
- Analogicznie do TC-SERVICE-CREATE-07

#### TC-SERVICE-LIST-10: Obsługa błędu bazy danych
- **Mockowanie:** Query rzuca błąd
- **Oczekiwany wynik:** `FlashcardServiceError` z kodem `FLASHCARD_LIST_FAILED`

### 3.7. Testy serwisu – `getFlashcardById()`

**Lokalizacja:** `src/lib/services/__tests__/flashcards.service.test.ts`

#### TC-SERVICE-GET-01: Pomyślne pobranie fiszki
- **Wywołanie:**
  ```typescript
  getFlashcardById(context, 1)
  ```
- **Mockowanie:**
  - `select('*').eq('id', 1).eq('user_id', uid).maybeSingle()` → zwraca fiszkę
- **Oczekiwany wynik:** `FlashcardDto`

#### TC-SERVICE-GET-02: Fiszka nie istnieje
- **Mockowanie:**
  - `maybeSingle()` → zwraca `null`
- **Oczekiwany wynik:** `null` (lub błąd 404 w endpoincie)

#### TC-SERVICE-GET-03: Fiszka należy do innego użytkownika
- **Mockowanie:**
  - Warunek `user_id = :uid` nie pasuje → `null`
- **Oczekiwany wynik:** `null`

#### TC-SERVICE-GET-04: Mapowanie danych
- Analogicznie do TC-SERVICE-CREATE-07

#### TC-SERVICE-GET-05: Obsługa błędu bazy danych
- **Oczekiwany wynik:** `FlashcardServiceError` z kodem `FLASHCARD_FETCH_FAILED`

### 3.8. Testy serwisu – `updateFlashcard()`

**Lokalizacja:** `src/lib/services/__tests__/flashcards.service.test.ts`

#### TC-SERVICE-UPDATE-01: Pomyślna aktualizacja
- **Wywołanie:**
  ```typescript
  updateFlashcard(context, 1, {
    front: "Nowe pytanie",
    back: "Nowa odpowiedź"
  })
  ```
- **Mockowanie:**
  - `update({ front, back }).eq('id', 1).eq('user_id', uid).select('*')` → zwraca zaktualizowaną fiszkę
- **Oczekiwany wynik:** Zaktualizowany `FlashcardDto`

#### TC-SERVICE-UPDATE-02: Fiszka nie istnieje
- **Mockowanie:**
  - Update nie znajduje rekordu → zwraca `[]`
- **Oczekiwany wynik:** `null`

#### TC-SERVICE-UPDATE-03: Fiszka należy do innego użytkownika
- **Mockowanie:**
  - Warunek `user_id` nie pasuje → `[]`
- **Oczekiwany wynik:** `null`

#### TC-SERVICE-UPDATE-04: Niemożność zmiany source
- **Test:**
  - Wywołanie `update()` nie zawiera pola `source`
  - Tylko `front` i `back` są aktualizowane

#### TC-SERVICE-UPDATE-05: Mapowanie danych
- Analogicznie do TC-SERVICE-CREATE-07

#### TC-SERVICE-UPDATE-06: Obsługa błędu bazy danych
- **Oczekiwany wynik:** `FlashcardServiceError` z kodem `FLASHCARD_UPDATE_FAILED`

### 3.9. Testy serwisu – `deleteFlashcard()`

**Lokalizacja:** `src/lib/services/__tests__/flashcards.service.test.ts`

#### TC-SERVICE-DELETE-01: Pomyślne usunięcie
- **Wywołanie:**
  ```typescript
  deleteFlashcard(context, 1)
  ```
- **Mockowanie:**
  - `delete().eq('id', 1).eq('user_id', uid).select('id')` → zwraca `[{id: 1}]`
- **Oczekiwany wynik:** `true`

#### TC-SERVICE-DELETE-02: Fiszka nie istnieje
- **Mockowanie:**
  - Delete nie znajduje rekordu → zwraca `[]`
- **Oczekiwany wynik:** `false`

#### TC-SERVICE-DELETE-03: Fiszka należy do innego użytkownika
- **Mockowanie:**
  - Warunek `user_id` nie pasuje → `[]`
- **Oczekiwany wynik:** `false`

#### TC-SERVICE-DELETE-04: Obsługa błędu bazy danych
- **Oczekiwany wynik:** `FlashcardServiceError` z kodem `FLASHCARD_DELETE_FAILED`

### 3.10. Testy pomocniczych funkcji serwisu

**Lokalizacja:** `src/lib/services/__tests__/flashcards.service.test.ts`

#### TC-SERVICE-HELPER-01: resolveUserId() – zwraca DEFAULT_SUPABASE_USER_ID
- **Test tymczasowy** (do czasu implementacji pełnego auth)
- **Asercja:** Funkcja zwraca stałą wartość `DEFAULT_SUPABASE_USER_ID`

#### TC-SERVICE-HELPER-02: Mapowanie pól sortowania (whitelist)
- **Testy:**
  - `"createdAt"` → `"created_at"`
  - `"updatedAt"` → `"updated_at"` (jeśli wspierane)
  - `"invalidField"` → użycie domyślnego lub błąd

#### TC-SERVICE-HELPER-03: Mapowanie FlashcardRow → FlashcardDto
- **Wejście:**
  ```typescript
  {
    id: 1,
    user_id: "uuid",
    generation_id: null,
    source: "manual",
    front: "Q",
    back: "A",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z"
  }
  ```
- **Oczekiwany wynik:**
  ```typescript
  {
    id: 1,
    generationId: null,
    source: "manual",
    front: "Q",
    back: "A",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z"
  }
  ```

### 3.11. Testy klasy błędów – `FlashcardServiceError`

**Lokalizacja:** `src/lib/services/__tests__/flashcards.service.test.ts`

#### TC-SERVICE-ERROR-01: Tworzenie błędu z kodem
- **Test:**
  ```typescript
  const error = new FlashcardServiceError(
    "FLASHCARD_NOT_FOUND",
    "Fiszka nie została znaleziona",
    404
  );
  ```
- **Asercje:**
  - `error.code === "FLASHCARD_NOT_FOUND"`
  - `error.message === "Fiszka nie została znaleziona"`
  - `error.status === 404`

#### TC-SERVICE-ERROR-02: Wszystkie kody błędów zdefiniowane
- **Test:** Sprawdzenie istnienia wszystkich kodów w `ERROR_CODES`:
  - `FLASHCARD_CREATE_FAILED`
  - `FLASHCARD_LIST_FAILED`
  - `FLASHCARD_FETCH_FAILED`
  - `FLASHCARD_UPDATE_FAILED`
  - `FLASHCARD_DELETE_FAILED`
  - `INVALID_GENERATION_REFERENCE`
  - `GENERATION_NOT_FOUND`
  - `USER_NOT_AUTHENTICATED`
  - `SUPABASE_NOT_AVAILABLE`

## 4. Strategia mockowania

### 4.1. Mockowanie Supabase Client

Użycie `vi.fn()` i `vi.spyOn()` do mockowania chainable API Supabase:

```typescript
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(),
  // ... inne metody
};
```

### 4.2. Mockowanie context.locals

```typescript
const mockContext = {
  locals: {
    supabase: mockSupabase
  }
} as unknown as APIContext;
```

### 4.3. Setup i teardown testów

```typescript
describe("FlashcardsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
```

## 5. Priorytety testowe

### Priorytet P0 (Krytyczne – 100% pokrycia wymagane)
- Walidacje krzyżowe (source ↔ generationId)
- Weryfikacja własności generationId
- Izolacja danych użytkowników (user_id filtering)
- Mapowanie danych (snake_case ↔ camelCase)
- Obsługa błędów (try-catch, FlashcardServiceError)

### Priorytet P1 (Wysokie – 90%+ pokrycia)
- Wszystkie walidacje Zod (granice wartości, typy, enums)
- CRUD operations (happy paths)
- Paginacja i sortowanie
- Filtrowanie

### Priorytet P2 (Średnie – 70%+ pokrycia)
- Edge cases (puste listy, null values)
- Optymalizacje (bulk insert, deduplikacja)
- Funkcje pomocnicze

## 6. Metryki jakości

### 6.1. Pokrycie kodu (Code Coverage)
- **Cel ogólny:** ≥ 80%
- **Schematy Zod:** ≥ 95%
- **Serwis aplikacyjny:** ≥ 85%
- **Funkcje pomocnicze:** ≥ 70%

### 6.2. Testy mutacyjne
- Rozważyć użycie narzędzia do mutation testing (np. Stryker) dla krytycznych części kodu

### 6.3. Czas wykonania testów
- Wszystkie testy jednostkowe powinny wykonać się < 10 sekund
- Pojedynczy test < 50ms

## 7. Narzędzia i konfiguracja

### 7.1. Framework testowy
- **Vitest** – zgodnie z wytycznymi projektu
- Konfiguracja w `vitest.config.ts`

### 7.2. Biblioteki pomocnicze
- **Zod** – do walidacji schematów
- **vi** (Vitest) – do mockowania

### 7.3. Uruchamianie testów

```bash
# Wszystkie testy jednostkowe
npm run test:unit

# Testy w trybie watch
npm run test:unit -- --watch

# Testy z pokryciem
npm run test:unit -- --coverage

# Testy dla konkretnego pliku
npm run test:unit src/lib/schemas/__tests__/flashcards.test.ts
```

## 8. Struktura plików testowych

```
src/
├── lib/
│   ├── schemas/
│   │   ├── flashcards.ts
│   │   └── __tests__/
│   │       └── flashcards.test.ts
│   └── services/
│       ├── flashcards.service.ts
│       └── __tests__/
│           └── flashcards.service.test.ts
```

## 9. Best Practices

### 9.1. Organizacja testów
- Używać `describe()` do grupowania powiązanych testów
- Nazwy testów zgodne z konwencją: `TC-{AREA}-{FUNCTION}-{NUMBER}: {Description}`
- Pattern AAA (Arrange-Act-Assert)

### 9.2. Assertion messages
- Używać descriptive assertion messages:
  ```typescript
  expect(result.status).toBe(404, "Should return 404 for non-existent flashcard");
  ```

### 9.3. Test isolation
- Każdy test jest niezależny
- Nie polegać na kolejności wykonania testów
- Czyścić mocki między testami (`beforeEach`)

### 9.4. DRY principle
- Wydzielać wspólne setup do funkcji pomocniczych
- Używać fixtures dla powtarzalnych danych testowych

## 10. Checklisty

### Przed commitowaniem kodu
- [ ] Wszystkie testy przechodzą
- [ ] Brak pominietych testów (`it.skip`, `describe.skip`)
- [ ] Coverage spełnia minimalne wymogi
- [ ] Linter nie zgłasza błędów w testach

### Przed code review
- [ ] Testy pokrywają wszystkie scenariusze z planu
- [ ] Nazwy testów są jasne i opisowe
- [ ] Mocki są prawidłowo skonfigurowane i czyszczone
- [ ] Dodano testy dla edge cases

### Przed wdrożeniem
- [ ] Testy E2E uzupełniają testy jednostkowe
- [ ] Dokumentacja testów zaktualizowana
- [ ] Wszystkie P0 testy zaimplementowane i przechodzące

## 11. Przykładowy test (Template)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PostFlashcardsBodySchema } from '../flashcards';

describe('PostFlashcardsBodySchema', () => {
  describe('TC-SCHEMA-POST-01: Walidacja pojedynczej karty (source: manual)', () => {
    it('should validate correct manual flashcard without generationId', () => {
      // Arrange
      const input = {
        cards: [{
          front: "Pytanie testowe",
          back: "Odpowiedź testowa",
          source: "manual"
        }]
      };

      // Act
      const result = PostFlashcardsBodySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cards[0].generationId).toBeUndefined();
      }
    });
  });
});
```

## 12. Wnioski i następne kroki

### 12.1. Po ukończeniu testów jednostkowych
1. Przeprowadzić code review plików testowych
2. Uruchomić pełną suite testów i sprawdzić pokrycie
3. Udokumentować znane ograniczenia i edge cases
4. Przejść do testów integracyjnych API

### 12.2. Ciągłe doskonalenie
- Monitorować failed tests w CI/CD
- Dodawać testy regresyjne dla znalezionych bugów
- Regularnie refaktoryzować testy (usuwanie duplikacji)
- Aktualizować plan testów wraz z rozwojem funkcjonalności

---

**Dokument utworzony:** 2025-11-16  
**Wersja:** 1.0  
**Autor:** AI QA Engineer  
**Status:** Do przeglądu i zatwierdzenia

