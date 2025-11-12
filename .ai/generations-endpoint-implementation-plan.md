## API Endpoint Implementation Plan: POST `/api/generations`

### 1. Przegląd punktu końcowego

- Cel: Uruchomienie procesu AI-generowania propozycji fiszek na podstawie długiego tekstu użytkownika. Zwraca metadane generacji oraz nieutrwalone propozycje fiszek.
- Zakres: Wyłącznie POST `/api/generations` (tworzenie). Pozostałe operacje na generacjach są poza tym planem.
- Kontekst:
  - DB: `generations`, `generation_error_logs` (logi błędów), relacja z `flashcards` (fiszki tworzone później przez `/api/flashcards`).
  - Autoryzacja: Supabase Auth; RLS po stronie DB.
  - LLM: OpenRouter; model konfigurowany w env.
- Uwaga o spójności z danymi: Propozycje nie są zapisywane w DB na tym etapie (ephemeral). Użytkownik zapisuje wybrane poprzez POST `/api/flashcards`.

### 2. Szczegóły żądania

- Metoda HTTP: POST
- Struktura URL: `/api/generations`
- Nagłówki:
  - `Content-Type: application/json; charset=utf-8`
  - `Authorization: Bearer <JWT>` (wymagane)
- Parametry:
  - Wymagane: brak parametrów URL/Query
  - Opcjonalne: brak
- Request Body (DTO): `CreateGenerationCommand`
  - `sourceText: string` — długość w zakresie 1000..10000 znaków (po `trim()`).
- Walidacja (Zod; w `src/lib/schemas/generations.ts`):
  - `z.object({ sourceText: z.string().trim().min(1000).max(10000) })`
  - Błąd walidacji → 400

### 3. Wykorzystywane typy

- Z `src/types.ts`:
  - `CreateGenerationCommand` — body żądania.
  - `FlashcardProposalDto` — kształt propozycji karty: `{ front, back, source: 'ai-full' }`.
  - `GenerationBaseDto` — metadane generacji (camelCase).
  - `CreateGenerationResponseDto` — odpowiedź: `{ generation: GenerationBaseDto, flashcardsProposals: FlashcardProposalDto[] }`.
- Modele domenowe/komendy (logika serwisowa):
  - `GenerateFlashcardsCommand` (wewnętrznie): `{ sourceText: string }`
  - `GenerationCreateParams` (wewnętrznie): `{ userId, model, sourceTextHash (Buffer), sourceTextLength, generatedCount, generationDuration }`
  - `GenerationErrorLogParams` (wewnętrznie): `{ userId, model, sourceTextHash (Buffer), sourceTextLength, errorCode, errorMessage }`

### 4. Szczegóły odpowiedzi

- Status 201 Created
- Body: `CreateGenerationResponseDto`
  - `generation`: 
    - `id: number`
    - `model: string`
    - `sourceTextHash: string` — base64 z SHA-256 (DB: `BYTEA`)
    - `sourceTextLength: number`
    - `generatedCount: number`
    - `generationDuration: number` (ms)
    - `createdAt: IsoDateString`
    - `updatedAt: IsoDateString`
  - `flashcardsProposals: FlashcardProposalDto[]`
- Błędy:
  - 400: ciało żądania nieprawidłowe (poza zakresem długości).
  - 401: brak/niepoprawny JWT.
  - 500: błąd LLM/DB (szczegóły logowane do `generation_error_logs`).

### 5. Przepływ danych

1) Autoryzacja użytkownika:
   - Pobranie JWT z nagłówka `Authorization`.
   - `context.locals.supabase.auth.getUser(jwt)` → `user.id`; brak → 401.
2) Walidacja żądania:
   - Parsowanie JSON; walidacja Zod `sourceText` (po `trim()`).
   - Sprawdzenie zakresu długości (1000..10000); w razie błędu → 400.
3) Przygotowanie danych do generacji:
   - Pomiar `startAt = monotonicNow()`.
   - `sourceTextLength = sourceText.length`.
   - Wyliczenie skrótu SHA-256 (binary/Buffer) po UTF-8: `hash = sha256(sourceText)`.
4) Wywołanie LLM (OpenRouter):
   - Konfiguracja: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` (np. `openrouter/anthropic/claude-3.5-sonnet`) przez `import.meta.env`.
   - Limit czasu (np. 60s); wyraźny prompt generujący pary Q/A.
   - Odpowiedź mapowana do `FlashcardProposalDto[]` (walidacja minimalna: niepuste `front/back`, przycięcie do limitów front=200, back=500).
5) Zapis metadanych generacji:
   - `generatedCount = proposals.length`.
   - `generationDuration = monotonicNow() - startAt`.
   - Insert do `public.generations` z polami:
     - `user_id, model, source_text_hash (BYTEA), source_text_length, generated_count, generation_duration`.
   - DB zwraca `id`, `created_at`, `updated_at`.
6) Budowa odpowiedzi:
   - `sourceTextHash` w DTO jako base64 (zakodowanie `BYTEA`).
   - Zwrócenie 201 z `generation` oraz `flashcardsProposals`.
7) Obsługa błędów:
   - Wszelkie wyjątki LLM/DB → insert do `generation_error_logs` z `{ user_id, model, source_text_hash, source_text_length, errorCode, errorMessage }`, następnie odpowiedź 500 z ogólnym komunikatem.

Uwagi i doprecyzowania:
- Hash: zgodnie ze specyfikacją używamy SHA-256 (DB: `BYTEA`, API: base64). Nie używać MD5.
- Propozycje są ephemeral — nie zapisujemy do `flashcards` na tym etapie.
- Deduplikacja na podstawie `(user_id, source_text_hash)` może być dodana później (out-of-scope tego planu).

### 6. Względy bezpieczeństwa

- Uwierzytelnianie:
  - Wymagany `Authorization: Bearer <JWT>`. Weryfikacja przez Supabase: `auth.getUser(jwt)`.
  - RLS w DB ogranicza dostęp do rekordów `user_id = auth.uid()`.
- Sekrety:
  - `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` z `import.meta.env`. Nie logować wartości.
- Walidacja danych:
  - Twarde limity długości `sourceText` (1000..10000).
  - Sanitizacja/trim; odrzucenie pustych po trim.
- Ekspozycja treści:
  - `front/back` zwracane jako stringi. Ewentualne renderowanie HTML po stronie klienta musi być bezpieczne (escape).
- Ochrona operacyjna:
  - Timeout na LLM (np. 60s); odporność na przeciążenia.
  - Możliwość wprowadzenia rate limiting w middleware (per userId/IP) — poza zakresem minimalnej implementacji.

### 7. Obsługa błędów

- 400 Bad Request:
  - Walidacja Zod nie przeszła (np. długość `sourceText`).
- 401 Unauthorized:
  - Brak JWT lub `auth.getUser` nie zwrócił użytkownika.
- 500 Internal Server Error:
  - Timeout/5xx z LLM, nieprawidłowa odpowiedź LLM, błąd zapisu do DB.
  - Log do `generation_error_logs`:
    - `error_code`: `LLM_TIMEOUT` | `LLM_BAD_RESPONSE` | `DB_INSERT_FAILED` | `UNKNOWN`.
    - `error_message`: skrót (do 500 znaków).

Struktura logu (zgodna z DB):
```
{ user_id, model, source_text_hash (BYTEA), source_text_length, error_code, error_message }
```

### 8. Rozważania dotyczące wydajności

- LLM:
  - Timeout (60s), krótkie i deterministyczne prompty; dopuszczalne ograniczenie liczby propozycji (np. 10–20).
- DB:
  - Insert jednej krotki do `generations`; kolumny indeksowane wg planu DB (user_id).
  - Przechowujemy tylko hash + długość, nie pełny tekst (oszczędność miejsca).
- API:
  - Brak paginacji (to nie lista); odpowiedź zawiera tylko metadane i propozycje.
  - Minimalne mapowania snake_case → camelCase.

### 9. Kroki implementacji

1) Schematy walidacji (Zod)
   - Plik: `src/lib/schemas/generations.ts`
   - Eksport:
     - `PostGenerationBodySchema = z.object({ sourceText: z.string().trim().min(1000).max(10000) })`
2) Util kryptograficzny
   - Plik: `src/lib/utils/hash.ts`
   - Funkcje:
     - `sha256ToBuffer(input: string): Promise<Uint8Array | Buffer>`
     - `bufferToBase64(input: Uint8Array | Buffer): string`
3) Serwis LLM
   - Plik: `src/lib/services/ai/flashcardsGenerator.ts`
   - `generateFlashcardProposals({ sourceText }: { sourceText: string }): Promise<FlashcardProposalDto[]>`
   - Implementacja: rzeczywiste wywołanie OpenRouter (z timeout); tymczasowo dopuszczalny mock gdy brak klucza.
4) Serwis domenowy Generations
   - Plik: `src/lib/services/generations.service.ts`
   - API:
     - `createGeneration(context, command: CreateGenerationCommand): Promise<CreateGenerationResponseDto>`
   - Zadania:
     - Autoryzacja użytkownika (JWT → userId).
     - Walidacja Zod.
     - Obliczenie `hash` (SHA-256) i `sourceTextLength`.
     - Wywołanie LLM i weryfikacja propozycji (przycięcie długości).
     - Pomiar `generationDuration`.
     - Insert do `generations` (BYTEA dla hash).
     - Mapowanie do `GenerationBaseDto` (hash → base64).
     - Obsługa wyjątków + insert do `generation_error_logs`.
5) Endpoint Astro
   - Plik: `src/pages/api/generations/index.ts`
   - Zawartość:
     - `export const prerender = false`
     - `export async function POST(context) { ... }` — body → Zod → serwis → 201/4xx/5xx
   - Zasada: używać `context.locals.supabase` (nie importować klienta bezpośrednio).
6) Konfiguracja środowiska
   - Wymagane: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` (domyślnie: `openrouter/anthropic/claude-3.5-sonnet`).
   - Walidacja obecności zmiennych w starcie serwisu/serwisu LLM; bezpieczne komunikaty.
7) Testy
   - Jednostkowe: walidacja Zod, hash base64, mapowanie DTO.
   - Integracyjne: szczęśliwa ścieżka 201, 400 dla za krótkiego/za długiego inputu, 401 bez JWT, 500 gdy LLM timeout.
8) Monitoring i logowanie
   - Minimalne logi aplikacyjne (poziom info/error, bez treści `sourceText`).
   - Zapis błędów do `generation_error_logs`.

### 10. Szkic implementacji (poglądowy)

```ts
// src/pages/api/generations/index.ts
export const prerender = false
export async function POST(context: APIContext) {
  const supabase = context.locals.supabase
  const jwt = extractBearer(context.request.headers.get('authorization'))
  const { data: userData, error: authError } = await supabase.auth.getUser(jwt)
  if (authError || !userData?.user) return json(401, { message: 'Unauthorized' })

  const body = await context.request.json().catch(() => null)
  const parse = PostGenerationBodySchema.safeParse(body)
  if (!parse.success) return json(400, { message: 'Invalid body' })

  try {
    const result = await createGeneration(context, parse.data) // zwraca CreateGenerationResponseDto
    return json(201, result)
  } catch (e) {
    return json(500, { message: 'Generation failed' })
  }
}
```

```ts
// src/lib/services/generations.service.ts (rdzeń)
export async function createGeneration(context: APIContext, { sourceText }: CreateGenerationCommand): Promise<CreateGenerationResponseDto> {
  const supabase = context.locals.supabase
  const userId = await requireUserIdFromContext(context) // getUser(jwt)

  const sourceTextTrimmed = sourceText.trim()
  PostGenerationBodySchema.parse({ sourceText: sourceTextTrimmed })

  const startedAt = performance.now()
  const hashBuf = await sha256ToBuffer(sourceTextTrimmed)
  const proposals = await generateFlashcardProposals({ sourceText: sourceTextTrimmed })
  const generatedCount = proposals.length
  const generationDuration = Math.round(performance.now() - startedAt)

  const model = envModel()
  const { data, error } = await supabase
    .from('generations')
    .insert({
      user_id: userId,
      model,
      source_text_hash: hashBuf, // BYTEA
      source_text_length: sourceTextTrimmed.length,
      generated_count: generatedCount,
      generation_duration: generationDuration,
    })
    .select()
    .single()
  if (error) throw dbError(error)

  return {
    generation: {
      id: data.id,
      model: data.model,
      sourceTextHash: bufferToBase64(data.source_text_hash),
      sourceTextLength: data.source_text_length,
      generatedCount: data.generated_count,
      generationDuration: data.generation_duration,
      createdAt: new Date(data.created_at).toISOString(),
      updatedAt: new Date(data.updated_at).toISOString(),
    },
    flashcardsProposals: proposals,
  }
}
```

```ts
// Logowanie błędów (fragment)
async function logGenerationError(params: GenerationErrorLogParams) {
  await supabase.from('generation_error_logs').insert({
    user_id: params.userId,
    model: params.model,
    source_text_hash: params.sourceTextHash,
    source_text_length: params.sourceTextLength,
    error_code: params.errorCode,
    error_message: params.errorMessage.slice(0, 500),
  })
}
```

```ts
// Zod schema
export const PostGenerationBodySchema = z.object({
  sourceText: z.string().trim().min(1000).max(10000),
})
```

```ts
// Hash util
export async function sha256ToBuffer(input: string): Promise<Uint8Array> { /* ... */ }
export function bufferToBase64(buf: Uint8Array): string { /* ... */ }
```

```ts
// AI service (OpenRouter)
export async function generateFlashcardProposals({ sourceText }: { sourceText: string }): Promise<FlashcardProposalDto[]> {
  // timeout, walidacja odpowiedzi, mapowanie do { front, back, source: 'ai-full' }
}
```

### 11. Zgodność ze specyfikacją

- Zgodne kody statusu: 201 (sukces), 400 (walidacja), 401 (auth), 500 (błędy serwera).
- Długość `sourceText` egzekwowana zgodnie z planem API i constraintem DB.
- Hash: SHA-256 (DB: BYTEA, API: base64) — zgodny z @api-plan.md.
- Użycie Supabase z `context.locals.supabase` (middleware).
- Logi błędów w `generation_error_logs` (pełna zgodność z planem DB).


