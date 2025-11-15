## API Endpoint Implementation Plan: Flashcards (/api/flashcards)

### 1. Przegląd punktu końcowego

Endpointy do zarządzania fiszkami użytkownika (tworzenie wielu na raz, listowanie z paginacją i filtrami, pobieranie pojedynczej, aktualizacja treści, usuwanie). Dane i walidacje zgodne z planem API i ograniczeniami bazy. Implementacja w Astro Server Endpoints, z walidacją Zod, dostępem do Supabase przez `context.locals.supabase`, oraz typami współdzielonymi z `src/types.ts`.

### 2. Szczegóły żądania

- Metody i ścieżki
  - POST `/api/flashcards`
  - GET `/api/flashcards`
  - GET `/api/flashcards/:id`
  - PUT `/api/flashcards/:id`
  - DELETE `/api/flashcards/:id`

- Parametry i body
  - POST `/api/flashcards`
    - Body (JSON) — CreateFlashcardsCommand:
      - `cards` (wymagane, array 1..N):
        - `front` (string, 1..200, trimmed)
        - `back` (string, 1..500, trimmed)
        - `source` (enum: `manual` | `ai-full` | `ai-edited`, domyślnie `manual` jeśli pominięte)
        - `generationId` (number, wymagane dla `ai-full`/`ai-edited`; musi należeć do użytkownika; zabronione dla `manual`)
    - Walidacje krzyżowe:
      - `source='manual'` => `generationId` null/undefined
      - `source ∈ {'ai-full','ai-edited'}` => `generationId` wymagane i istniejące (FK do `generations.id` użytkownika)
  - GET `/api/flashcards`
    - Query — FlashcardListQueryParams:
      - Wymagane: brak
      - Opcjonalne:
        - `page` (number, default 1, min 1)
        - `pageSize` (number, default 10, min 1, max 100)
        - `sort` (string, domyślnie `createdAt`, whitelisting)
        - `order` (enum: `asc` | `desc`, domyślnie `desc`)
        - `source` (enum: `manual` | `ai-full` | `ai-edited`)
        - `generationId` (number)
  - GET `/api/flashcards/:id`
    - Parametry ścieżki:
      - `id` (number, min 1)
  - PUT `/api/flashcards/:id`
    - Parametry ścieżki:
      - `id` (number, min 1)
    - Body (JSON) — UpdateFlashcardCommand:
      - `front` (string, 1..200, trimmed)
      - `back` (string, 1..500, trimmed)
    - Uwaga: aktualizacja `source` nieobsługiwana (zgodnie z `src/types.ts`).
  - DELETE `/api/flashcards/:id`
    - Parametry ścieżki:
      - `id` (number, min 1)

### 3. Wykorzystywane typy

- Z `src/types.ts`:
  - `CreateFlashcardsCommand`, `CreateFlashcardsResponseDto`
  - `FlashcardListQueryParams`, `ListFlashcardsResponseDto`
  - `GetFlashcardResponseDto` (= `FlashcardDto`)
  - `UpdateFlashcardCommand`, `FlashcardDto`, `FlashcardSource`
- Nowe schematy Zod (w `src/lib/schemas/flashcards.ts`):
  - `PostFlashcardsBodySchema` (walidacja `CreateFlashcardsCommand` + reguły krzyżowe)
  - `ListFlashcardsQuerySchema` (paginacja, sort, order, filtry)
  - `FlashcardIdParamSchema`
  - `PutFlashcardBodySchema` (walidacja `UpdateFlashcardCommand`)

### 4. Szczegóły odpowiedzi

- POST `/api/flashcards`
  - 201 Created, body: `CreateFlashcardsResponseDto`:
    - `flashcards`: `FlashcardDto[]`
  - 400 Bad Request — błędny JSON lub walidacja Zod
  - 401 Unauthorized — brak uwierzytelnienia
  - 404 Not Found — przynajmniej jedno `generationId` nie istnieje lub nie należy do użytkownika
  - 500 Internal Server Error — błąd serwera/DB

- GET `/api/flashcards`
  - 200 OK, body: `ListFlashcardsResponseDto`
  - 400 Bad Request — walidacja query
  - 401 Unauthorized — brak uwierzytelnienia
  - 500 Internal Server Error

- GET `/api/flashcards/:id`
  - 200 OK, body: `GetFlashcardResponseDto`
  - 401 Unauthorized
  - 404 Not Found — brak lub cudza fiszka
  - 500 Internal Server Error

- PUT `/api/flashcards/:id`
  - 200 OK, body: zaktualizowany `FlashcardDto`
  - 400 Bad Request — walidacja body
  - 401 Unauthorized
  - 404 Not Found — brak lub cudza fiszka
  - 500 Internal Server Error

- DELETE `/api/flashcards/:id`
  - 200 OK, body: `{ success: true }`
  - 401 Unauthorized
  - 404 Not Found — brak lub cudza fiszka
  - 500 Internal Server Error

### 5. Przepływ danych

- Wspólne:
  - Wejście: `APIContext` → `context.locals.supabase` (typ: `App.Locals['supabase']`), `DEFAULT_SUPABASE_USER_ID` do czasu wdrożenia pełnego auth (analogicznie do `generations.service.ts`).
  - Walidacja: Zod w warstwie endpointów.
  - Serwis: logika w `src/lib/services/flashcards.service.ts`.
  - Mapowanie: w serwisie mapowanie wierszy Supabase (snake_case) → DTO (camelCase).

- POST `/api/flashcards`
  1. Walidacja body Zod (w tym reguły krzyżowe), normalizacja `source` (default `manual`).
  2. Ekstrakcja unikalnych `generationId` dla kart AI; weryfikacja istnienia i własności: `select id from generations where user_id=:uid and id in (...)`. Jeśli jakiekolwiek braki → 404.
  3. Bulk insert do `flashcards` z `user_id`, warunkowym `generation_id`, `source`, `front`, `back`; `select('*')` aby zwrócić dane.
  4. Mapowanie do `FlashcardDto[]`, zwrot 201.

- GET `/api/flashcards`
  1. Walidacja query Zod (paginacja/sort/order/filtry).
  2. Zastosowanie filtrów: `user_id=:uid`, opcjonalnie `source`, `generation_id`.
  3. Mapowanie pola sortowania: whitelist (np. `createdAt`→`created_at`). Kierunek z `order`.
  4. Paginacja: `range(offset, end)` + `count:'exact'`.
  5. Mapowanie do `ListFlashcardsResponseDto`.

- GET `/api/flashcards/:id`
  1. Walidacja `id`.
  2. `select('*')` z `user_id=:uid` i `id=:id` + `maybeSingle()`.
  3. 404 jeśli brak; inaczej mapowanie i 200.

- PUT `/api/flashcards/:id`
  1. Walidacja `id` i body (`front`, `back`).
  2. `update({ front, back })` z warunkami `user_id=:uid` i `id=:id` + `select('*')`.
  3. 404 jeśli brak; inaczej 200 z DTO.

- DELETE `/api/flashcards/:id`
  1. Walidacja `id`.
  2. `delete()` z warunkami `user_id=:uid` i `id=:id` + `select('id')`.
  3. 404 jeśli brak; inaczej 200 `{ success: true }`.

### 6. Względy bezpieczeństwa

- Uwierzytelnianie: docelowo sesja Supabase; tymczasowo `DEFAULT_SUPABASE_USER_ID` (tak jak w `generations.service.ts`). Każde zapytanie ograniczone przez `user_id=:uid`.
- Autoryzacja: brak dostępu do cudzych rekordów — wszystkie operacje warunkowane `user_id`.
- Walidacja i sanityzacja:
  - Zod dla body i query; `trim()` dla pól tekstowych.
  - Whitelisting pól sortowania (`createdAt`, ewentualnie `updatedAt`), brak interpolacji niezweryfikowanych kolumn.
- Ochrona spójności:
  - Walidacje krzyżowe `source` ↔ `generationId`.
  - Dodatkowo rely na constraint DB: `(source='manual' AND generation_id IS NULL) OR ...`.
- Zagrożenia i mitigacje:
  - Eskalacja uprawnień przez `generationId` — weryfikacja własności w bulk check.
  - DoS na POST z bardzo dużą liczbą kart — ograniczyć rozmiar tablicy w Zod (np. max 100).
  - Informacje o istnieniu zasobów — jednolite 404 dla cudzych i nieistniejących rekordów.

### 7. Obsługa błędów

- Konwencja odpowiedzi błędu (spójna z `/api/generations`):
  - `{ "message": string, "code"?: string, "issues"?: unknown }`
- Kody:
  - 400: nieprawidłowy JSON, walidacje Zod, naruszenie reguł krzyżowych
  - 401: brak uwierzytelnienia użytkownika
  - 404: `generationId` nie istnieje/nie należy do użytkownika; fiszka nie istnieje/należy do kogoś innego
  - 500: błąd DB lub nieoczekiwany błąd serwera
- Klasy błędów w serwisie `FlashcardServiceError` z `status` i `code` (wzorzec jak w `GenerationServiceError`):
  - `FLASHCARD_CREATE_FAILED`, `FLASHCARD_LIST_FAILED`, `FLASHCARD_FETCH_FAILED`, `FLASHCARD_UPDATE_FAILED`, `FLASHCARD_DELETE_FAILED`
  - `INVALID_GENERATION_REFERENCE`, `GENERATION_NOT_FOUND`
  - `USER_NOT_AUTHENTICATED`, `SUPABASE_NOT_AVAILABLE`
- Logowanie do DB:
  - Nie stosujemy `generation_error_logs` dla endpointów flashcards (przeznaczone dla błędów generacji LLM). Logi serwerowe wystarczą.

### 8. Rozważania dotyczące wydajności

- Batchowanie:
  - POST: pojedynczy bulk insert zamiast wielu insertów.
  - Weryfikacja `generationId`: pojedyncze zapytanie `IN (...)` po zgrupowaniu unikalnych ID.

### 9. Etapy wdrożenia

1. Schematy Zod
   - Utworzyć `src/lib/schemas/flashcards.ts`:
     - `PostFlashcardsBodySchema`:
       - `cards`: `z.array(z.object({ front, back, source?, generationId? })).min(1).max(100)`
       - `front`: `z.string().min(1).max(200).trim()`
       - `back`: `z.string().min(1).max(500).trim()`
       - `source`: `z.enum(['manual','ai-full','ai-edited']).default('manual')`
       - `generationId`: `z.coerce.number().int().min(1).nullable().optional()`
       - `.superRefine` do reguł krzyżowych
     - `ListFlashcardsQuerySchema`: `page`, `pageSize`, `sort='createdAt'`, `order in {'asc','desc'}`, `source?`, `generationId?`
     - `FlashcardIdParamSchema`: `id: z.coerce.number().int().min(1)`
     - `PutFlashcardBodySchema`: `front`, `back` jak wyżej

2. Serwis aplikacyjny
   - Utworzyć `src/lib/services/flashcards.service.ts`:
     - Typ `SupabaseServerClient = App.Locals['supabase']`
     - `resolveUserId()` analogicznie do `generations.service.ts` (tymczasowo `DEFAULT_SUPABASE_USER_ID`)
     - Mapowanie `FlashcardRow` → `FlashcardDto` (snake→camel)
     - Whitelist pól sortowania: `{ createdAt:'created_at', updatedAt:'updated_at' }` (na start `createdAt`)
     - Metody:
       - `createFlashcards(ctx, command: CreateFlashcardsCommand): Promise<CreateFlashcardsResponseDto>`
       - `listFlashcards(ctx, query: ListFlashcardsQueryInput): Promise<ListFlashcardsResponseDto>`
       - `getFlashcardById(ctx, id: number): Promise<FlashcardDto|null>`
       - `updateFlashcard(ctx, id: number, command: UpdateFlashcardCommand): Promise<FlashcardDto|null>`
       - `deleteFlashcard(ctx, id: number): Promise<boolean>`
     - Klasa `FlashcardServiceError` i stałe `ERROR_CODES`/`ERROR_MESSAGES`

3. Endpointy Astro
   - Utworzyć `src/pages/api/flashcards/index.ts`:
     - `export const prerender = false`
     - `POST`: parse JSON, walidacja `PostFlashcardsBodySchema`, wywołanie `createFlashcards`, zwrot 201
     - `GET`: walidacja `ListFlashcardsQuerySchema`, wywołanie `listFlashcards`, zwrot 200
     - Wspólna obsługa błędów: `ZodError`→400, `FlashcardServiceError`→`status`, fallback→500; wspólna `jsonResponse()`
   - Utworzyć `src/pages/api/flashcards/[id].ts`:
     - `export const prerender = false`
     - `GET`: walidacja paramów, `getFlashcardById` → 200/404
     - `PUT`: walidacja paramów i body, `updateFlashcard` → 200/404
     - `DELETE`: walidacja paramów, `deleteFlashcard` → 200 `{ success:true }`/404

4. Spójność typów
   - Upewnić się, że DTO zgodne z `src/types.ts` (brak zmiany `UpdateFlashcardCommand` — aktualizujemy tylko `front`, `back`).

