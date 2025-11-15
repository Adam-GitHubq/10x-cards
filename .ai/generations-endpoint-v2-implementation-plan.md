## API Endpoint Implementation Plan: Generations (`/api/generations`)

### 1. Przegląd punktu końcowego

- Cel: Zarządzanie procesem AI-generowania propozycji fiszek na podstawie długiego tekstu użytkownika oraz dostęp do metadanych generacji.
- Zakres:
  - POST `/api/generations`: uruchomienie generacji (LLM), zapis metadanych, zwrot propozycji.
  - GET `/api/generations`: lista generacji zalogowanego użytkownika (paginacja, sortowanie, filtry).
  - GET `/api/generations/:id`: szczegóły wybranej generacji (tylko właściciel).
  - DELETE `/api/generations/:id`: usunięcie generacji (fiszki zostają przez FK ON DELETE SET NULL).
- Mapa plików (Astro):
  - `src/pages/api/generations/index.ts` → `export async function POST(...)` i `export async function GET(...)`
  - `src/pages/api/generations/[id].ts` → `export async function GET(...)` i `export async function DELETE(...)`
  - W każdym pliku: `export const prerender = false`

### 2. Szczegóły żądania

#### 2.1 POST `/api/generations`

- Body (Zod):
  - `sourceText` (string; długość 1000..10000) [wymagane]
- Walidacje:
  - Długość `sourceText` zgodnie ze specyfikacją i constraintem w DB.
- Statusy:
  - 201 Created — sukces, zwracamy metadane generacji i propozycje.
  - 400 Bad Request — błędny `sourceText`.
  - 401 Unauthorized — brak sesji użytkownika.
  - 500 Internal Server Error — błąd LLM lub DB (log w `generation_error_logs`).

#### 2.2 GET `/api/generations`

- Query (Zod):
  - `page` (int ≥1; domyślnie 1)
  - `pageSize` (int 1..100; domyślnie 10)
  - `sort` (`createdAt`)
  - `order` (`asc` | `desc`)
  - `model` (opcjonalny filtr)
  - `createdFrom`/`createdTo` (ISO, opcjonalne)
- Statusy:
  - 200 OK — lista metadanych + `pagination`.
  - 401 Unauthorized

#### 2.3 GET `/api/generations/:id`

- Parametry ścieżki:
  - `id` (int > 0)
- Statusy:
  - 200 OK — metadane generacji.
  - 401 Unauthorized
  - 404 Not Found — gdy brak rekordu użytkownika o podanym `id`.

#### 2.4 DELETE `/api/generations/:id`

- Parametry ścieżki:
  - `id` (int > 0)
- Statusy:
  - 204 No Content — usunięto.
  - 401 Unauthorized
  - 404 Not Found — gdy brak rekordu użytkownika o podanym `id`.

### 3. Wykorzystywane typy

- Istniejące typy w `src/types.ts`:
  - `CreateGenerationCommand` — body POST (zawiera `sourceText`).
  - `GenerationBaseDto` — metadane generacji (camelCase).
  - `FlashcardProposalDto` — poj. propozycja karty.
  - `CreateGenerationResponseDto` — odpowiedź POST (metadane + propozycje).
  - `GenerationListQueryParams`, `PaginatedResponse<Item>` — listowanie z paginacją.

### 4. Szczegóły odpowiedzi

- POST 201:
  - Body: `CreateGenerationResponseDto`
    - `generation`: `GenerationBaseDto`
    - `flashcardsProposals`: `FlashcardProposalDto[]` (nie zapisujemy ich w DB; użytkownik zapisze wybrane via `/flashcards`)
- GET lista 200:
  - Body: `PaginatedResponse<GenerationBaseDto>`
- GET pojedynczy 200:
  - Body: `GenerationBaseDto`
- DELETE 204:
  - Body: brak

### 5. Przepływ danych

#### 5.1 POST `/api/generations`

2. Walidacja body (Zod).
3. Oblicz `sourceTextHash` za pomocą biblioteki crypto i algorytmu MD5 i `sourceTextLength`.
4. Wywołaj LLM (OpenRouter) z promptem generującym pary Q/A; na razie za MOCKUJ (OpenRouter).
5. Zmierz `generationDuration` (ms), policz `generatedCount`.
6. Wstaw rekord do `public.generations`:
   - `user_id`, `model`, `source_text_hash` (bytes/base64 → tekst w DB), `source_text_length`, `generated_count`, `generation_duration`.
7. Zwróć 201 z `generation` oraz `flashcardsProposals`.
8. Błędy LLM/DB → log w `generation_error_logs` + 500.

Uwagi:

- Propozycje kart są ephemeral (nie wstawiamy do `flashcards`). Użytkownik zatwierdza przez `/api/flashcards`.

#### 5.2 GET `/api/generations`

2. Walidacja i normalizacja query (`page`, `pageSize`, `sort`, filtry).
3. `SELECT ... FROM generations WHERE user_id = :userId AND [filtry] ORDER BY created_at [ASC|DESC] LIMIT :pageSize OFFSET :offset` + `COUNT(*)` dla `total`.
4. Mapowanie pól snake_case → camelCase (`GenerationBaseDto`).
5. Zwróć 200 z `items` i `pagination`.

#### 5.3 GET `/api/generations/:id`

2. Pobierz rekord po `id` i `user_id`; brak → 404.
3. Mapuj do `GenerationBaseDto`; zwróć 200.

#### 5.4 DELETE `/api/generations/:id`

2. Usuń rekord warunkowo po `id` i `user_id`; gdy 0 wierszy → 404.
3. 204.

### 6. Względy bezpieczeństwa

- W pierwszej fazie weżmiemy użytkownika z DEFAULT_SUPABASE_USER_ID
- Walidacja i sanitizacja:
  - Długość tekstu (1000..10000), wykluczenie pustych/whitespace-only.
- Sekrety: `OPENROUTER_API_KEY` przez `import.meta.env`.
- Obsługa błędów: bez ujawniania szczegółów wewnętrznych (stack trace) do klienta.

### 7. Obsługa błędów

- 400 Bad Request:
  - Niewłaściwe body (Zod), `sourceText` poza zakresem.
- 401 Unauthorized:
  - Brak/nieprawidłowa sesja Supabase.
- 404 Not Found:
  - Brak generacji o `id` dla danego `userId`.
- 500 Internal Server Error:
  - Błąd komunikacji z LLM (timeout, 5xx, invalid response), błąd DB.
  - Wstaw do `generation_error_logs`: `user_id`, `model`, `source_text_hash`, `source_text_length`, `error_code`, `error_message`, `created_at`.

### 8. Rozważania dotyczące wydajności

- LLM:
  - Timeout żądania (np. 60s).
- DB:
  - Indeksy: `generations(user_id, created_at DESC)` dla listowania; opcjonalnie `generations(user_id, id)` dla lookup; powiązane FK istnieją.
  - `COUNT(*)` może być kosztowne przy dużych wolumenach — wystarczy dokładny count (na teraz).
- API:
  - Paginacja stronicowana (`page`, `pageSize` ≤ 100).
  - Zwracamy wyłącznie niezbędne pola (DTO).

### 9. Kroki implementacji

1. Schematy walidacji (Zod):
   - Plik: `src/lib/schemas/generations.ts`
     - `PostGenerationBodySchema = z.object({ sourceText: z.string().min(1000).max(10000) })`
     - `ListGenerationsQuerySchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(10), model: z.string().optional(), createdFrom: z.string().datetime().optional(), createdTo: z.string().datetime().optional() })`

2. Util hash:
   - Plik: `src/lib/utils/hash.ts`
   - `computeMD5(input: string): Promise<{ output: string }>`

3. Serwis LLM:
   - Plik: `src/lib/services/ai/flashcardsGenerator.ts`
   - Funkcja: `generateFlashcardProposals({ sourceText }): Promise<FlashcardProposalDto[]>`
   - Implementacja: Na tą chwile tylko MOCK

4. Serwis domenowy Generations:
   - Plik: `src/lib/services/generations.service.ts`
   - API:
     - `createGeneration(ctx, { sourceText }): Promise<CreateGenerationResponseDto>`
       - Pobierz `userId` z Supabase (ctx.locals), waliduj, hashuj, wywołaj LLM, wstaw do `generations`, zwróć DTO.
       - Na wyjątki LLM: zapisz `generation_error_logs`.
     - `listGenerations(ctx, query): Promise<PaginatedResponse<GenerationBaseDto>>`
       - Filtrowanie po `user_id`, opcjonalnie `model`, zakres dat, sortowanie/paginacja.
     - `getGenerationById(ctx, id): Promise<GenerationBaseDto | null>`
     - `deleteGeneration(ctx, id): Promise<boolean>` (true gdy usunięto).
   - Mapowanie pól snake_case → camelCase zgodnie z `GenerationBaseDto`.

5. Endpointy Astro:
   - `src/pages/api/generations/index.ts`
     - `export const prerender = false`
     - `export async function POST(context)`:
       - Parse JSON → Zod → serwis `createGeneration` → 201 z `CreateGenerationResponseDto`
     - `export async function GET(context)`:
       - Parse query → Zod → serwis `listGenerations` → 200
   - `src/pages/api/generations/[id].ts`
     - `export const prerender = false`
     - `export async function GET(context)`:
       - Sprawdź `id` → serwis `getGenerationById` → 200/404
     - `export async function DELETE(context)`:
       - Sprawdź `id` → serwis `deleteGeneration` → 204/404
   - W każdym handlerze: używać `context.locals.supabase` (nie importować klienta bezpośrednio).

6. Logowanie błędów generacji:
   - Helper w `src/lib/services/generations.service.ts`:
     - `logGenerationError({ userId, model, sourceTextHash, sourceTextLength, errorCode, errorMessage })` → insert do `generation_error_logs`.
