# Plan schematu bazy danych – 10x-cards

## 1. Lista tabel z kolumnami, typami danych i ograniczeniami

### `users`

Ta tabela będzie obsługiwana przez Supabase Auth.

- id: UUID PRIMARY KEY
- email: VARCHAR(255) NOT NULL UNIQUE
- encrypted_password: VARCHAR NOT NULL
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now()
- confirmed_at: TIMESTAMPTZ

### `generations`

- id: BIGSERIAL PRIMARY KEY -- Identyfikator rekordu
- user_id: UUID NOT NULL REFERENCES `auth`.`users`(`id`) ON DELETE CASCADE -- Właściciel generacji
- model: VARCHAR NOT NULL -- Model LLM użyty do generowania
- source_text_hash: BYTEA NOT NULL -- Skrót MD5 wejściowego tekstu
- source_text_length: INT NOT NULL CHECK (`source_text_length` BETWEEN 1000 AND 10000) -- Długość wejściowego tekstu
- accepted_unedited_count: INTEGER NULLABLE
- accepted_edited_count: INTEGER NULLABLE
- generated_count: INTEGER NOT NULL
- generation_duration: INTEGER NOT NULL -- Czas generowania w ms
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now() -- Data utworzenia
- updated_at: TIMESTAMPTZ NOT NULL DEFAULT now() -- Data aktualizacji (trigger `set_updated_at`)

### `flashcards`

- id: BIGSERIAL PRIMARY KEY -- Identyfikator fiszki
- user_id: UUID NOT NULL REFERENCES `auth`.`users`(`id`) ON DELETE CASCADE -- Właściciel fiszki
- generation_id: BIGINT REFERENCES `generations`(`id`) ON DELETE SET NULL -- Powiązanie z generacją AI
- source: VARCHAR NOT NULL CHECK (`source` IN ('ai-full','ai-edited','manual')) -- Źródło powstania fiszki
- front: VARCHAR(200) NOT NULL CHECK (`front` <> '') -- Przód fiszki
- back: VARCHAR(500) NOT NULL CHECK (`back` <> '') -- Tył fiszki
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now() -- Data utworzenia
- updated_at: TIMESTAMPTZ NOT NULL DEFAULT now() -- Data aktualizacji (trigger `set_updated_at`)

CHECK `flashcards_generation_consistency`:  
`(source = 'manual' AND generation_id IS NULL) OR (source IN ('ai-full','ai-edited') AND generation_id IS NOT NULL)`

### `generation_error_logs`

- id: BIGSERIAL PRIMARY KEY -- Identyfikator błędu
- user_id: UUID NOT NULL REFERENCES `auth`.`users`(`id`) ON DELETE CASCADE -- Właściciel żądania
- model: VARCHAR NOT NULL -- Model LLM
- source_text_hash: BYTEA NOT NULL -- Skrót MD5 wejścia
- source_text_length: INT NOT NULL CHECK (`source_text_length` BETWEEN 1000 AND 10000) -- Długość wejścia
- error_code: VARCHAR(100) NOT NULL -- Kod błędu
- error_message: TEXT NOT NULL -- Krótki opis błędu
- created_at: TIMESTAMPTZ NOT NULL DEFAULT now() -- Data wystąpienia

## 2. Relacje między tabelami

- `auth.users` 1 — N `generations` (FK `generations.user_id` ON DELETE CASCADE).
- `auth.users` 1 — N `flashcards`; `flashcards.generation_id` opcjonalnie wskazuje na `generations.id` (ON DELETE SET NULL).
- `auth.users` 1 — N `generation_error_logs`.
- `generations` 1 — N `flashcards` (dla fiszek AI).

## 3. Indeksy

- `flashcards`:
  - `CREATE INDEX flashcards_user_idx ON flashcards (user_id);`
  - `CREATE INDEX flashcards_generation_id_idx ON flashcards (generation_id);`
- `generations`:
  - `CREATE INDEX generations_user_idx ON generations (user_id);`
- `generation_error_logs`:
  - `CREATE INDEX generation_error_logs_user_idx ON generation_error_logs (user_id);`

## 4. Zasady PostgreSQL (RLS)

- Polityki `SELECT/INSERT/UPDATE/DELETE` na `generations`, `flashcards`, `generation_error_logs` z warunkiem `user_id = auth.uid()`.

## 5. Dodatkowe uwagi

- Schemat jest zaprojektowany zgodnie z zasadami 3NF, zapewniając integralność danych oraz skalowalność
- Wszystkie nazwy tabel i kolumn są pisane małymi literami
- Trigger w tabeli flashcards i generations ma automatycznie aktualizować kolumne updated_at przy każdej modyfikacji rekordu
