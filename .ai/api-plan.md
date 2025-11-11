# REST API Plan

This plan defines a pragmatic, secure REST API for the 10x-cards application, aligned with the provided database schema, PRD, and technology stack (Astro 5 + TypeScript 5 + React 19 + Tailwind 4 + Shadcn/ui; Supabase for DB/Auth; OpenRouter for LLM). All endpoints are designed to run under `src/pages/api` (Astro), with shared DTOs in `src/types.ts` and common middleware in `src/middleware/index.ts`.

Conventions:
- Media type: `application/json; charset=utf-8`
- Field naming in API: camelCase; DB uses snake_case (mapped at the service layer)
- Time fields: ISO-8601 strings in UTC (e.g., `2025-11-09T15:39:00Z`)
- Pagination: page based, `page`, `pageSize` default 10, `total`
- Error envelope: `{"error":{"code":"string","message":"string","details?:object}}`
- Success envelope: resource(s) at top-level; pagination adds `pagination`

---

## 1. Resources

- Users (Auth) — Supabase `auth.users` (external, no CRUD endpoints here)
- Generations — DB table `generations`
  - AI generation metadata and metrics per user and input text
- Flashcards — DB table `flashcards`
  - User’s study cards (manual and AI-derived)
- GenerationErrorLogs — DB table `generation_error_logs`
  - Errors while calling the LLM

---

## 2. Endpoints

### 2.0 Shared patterns
- Pagination (list endpoints)
  - Query: `page` default 1, `pageSize` (1..100; default 10), `sort` (default `-createdAt`), `order` (`asc`, `desc`)
  - Response: `pagination` ( `page`, `total`, `pageSize`)
- Sorting: support `createdAt` asc/desc; default `-createdAt`
- Filtering: resource-specific (see each endpoint)

---

### 2.2 Generations

#### POST /generations
- Description: Initiate the AI generation process for flashcards proposals based on user-proviced text. Validate input text, call OpenRouter LLM to generate flashcard suggestions, persist a `generations` record, and return suggestions plus generation metadata.
- Request JSON:
```json
{
  "sourceText": "string of length 1000..10000"
}
```
- Response JSON (201):
```json
{
  "generation": {
    "id": 123,
    "model": "openrouter/anthropic/claude-3.5-sonnet",
    "sourceTextHash": "base64-sha256",
    "sourceTextLength": 2450,
    "generatedCount": 20,
    "generationDuration": 1842,
    "createdAt": "2025-11-09T15:41:23Z",
    "updatedAt": "2025-11-09T15:41:23Z"
  },
  "flashcardsProposals": [
    { "id": 1,  "front": "Generated Question", "back": "Generated Answer", "source": "ai-full" }
  ]
}
```
- Errors:
  - 400 Bad Request — invalid `model`, `sourceText` outside 1000..10000, `maxCards` out of bounds (1..50)
  - 500 Internal Server Error — AI service errors (logs recorded in `generation_error_logs`)

Validation/business:
- `sourceText` lenghth is between 1000 and 10000 characters.
- Call the AI service to generate flashcards proposals.
- Store the generation metadata and associate generated flashcards proposals to the user.

#### GET /generations
- Description: List generation records for the current user.
- Query: Supports pagination as needed
- Response JSON: List of generation objects with metadata.

#### GET /generations/:id
- Description: Get a single generation by ID (must belong to user).
- Success: 200 OK with item; 404 if not found

#### DELETE /generations/:id
- Description: Delete a generation record; associated flashcards remain (since FK is `ON DELETE SET NULL`). Intended for cleanup, optional in UI.
- Response JSON: Generation details and associated flashcards.
- Success: 204 No Content; 404 if not found

---

### 2.3 Flashcards

#### POST /flashcards
- Description: Create one or many flashcards (manual or AI-generated).
- Request JSON:
```json
{
  "cards": [
    {
      "front": "string (1..200)",
      "back": "string (1..500)",
      "source": "ai-full",
      "generationId": 123
    },
    {
      "front": "string (1..200)",
      "back": "string (1..500)",
      "source": "manual",
      "generationId": null 
    }
  ]
}
```
- Response JSON (201):
```json
{
  "flashcards": [
    { "id": 1, "generationId": 123, "source": "ai-full", "front": "string", "back": "string" },
    { "id": 2, "generationId": null, "source": "manual", "front": "string", "back": "string" }
  ]
}
```
- Validations:
  - `front` maximum length: 200 characters.
  - `back` maximum length: 500 characters.
  - `source` must be one of `manual`, `ai-full`, `ai-edited` (default `manual` if omitted).
  - If `source='manual'`, `generationId` must be null or omitted.
  - If `source ∈ {'ai-full','ai-edited'}`, `generationId` is required and must reference existing `generations.id` owned by the user.
  - Enforce DB consistency: `(source='manual' AND generationId IS NULL) OR (source IN ('ai-full','ai-edited') AND generationId IS NOT NULL)`.
- Errors:
  - 400 Bad Request — malformed body or empty `cards`
  - 404 Not Found — `generationId` not found or not owned by user
  
#### GET /flashcards
- Description: List user’s flashcards with filtering and pagination.
- Query:
  - `page` (default: 1), `pageSize` (default: 10) , `sort` (`-createdAt` default), `order` (`asc` or `desc`)
  - Optional filters (`source`, `generation_id`)
- Response JSON:
```json
{
  "items": [
    {
      "id": 888,
      "generationId": 123,
      "source": "ai-edited",
      "front": "string",
      "back": "string",
      "createdAt": "2025-11-09T15:43:00Z",
      "updatedAt": "2025-11-09T15:43:00Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 10, "total": 100 }
}
```
- Success: 200 OK
- Errors: 401 Unauthorized if token is invalid

#### GET /flashcards/:id
- Description: Get a single flashcard by ID.
- Response JSON Flashcard object.
- Errors: 404 Not Found, 401 Unauthorized

#### PUT /flashcards/:id
- Description: Update front/back.
- Request JSON: Fields to update.
- Response JSON (200): updated flashcard
- Errors:
  - 400 Bad Request — invalid body
  - 404 Not Found
  - 401 Unauthorized

- Validations:
  - `front` maximum length: 200 characters.
  - `back` maximum length: 500 characters.
  - `source` must be one of `manual`, `ai-edited`.

#### DELETE /flashcards/:id
- Description: Delete a flashcard (owned by user).
- Errors: 404 Not Found, 401 Unauthorized
---

### 2.4 Generation Error Logs

*(Typicall used internally or by admin users)*

#### GET /generation-error-logs

- Description: List the current user’s generation error logs (for transparency and debugging).
- Response JSON: List of error log objects.
- Errors: 401 Unauthorized if token is invalid, 403 Forbidden if access is restricted to admin users.

Note: no public POST route; logs are created internally by `/generations`.

---

### 2.6 Meta

#### GET /health
- Description: Liveness probe
- Response: `{ "status":"ok" }`

#### GET /version
- Description: Build/version info
- Response: `{ "version":"x.y.z", "commit":"abcdef", "env":"prod" }`

---

## 3. Authentication and Authorization

- Machanism: Token-based authentication using Supabase Auth.
- Process: 
  - Users authenticate via `api/v1/auth/login` or `api/v1/auth/register`, receiving a bearer token.
  - Protected endpoints require the token in the `Authorization` header.
  - Database-level Row-Level Security (RLS) ensures that users access only records with matching  `user_id`.
- Additional Considerations: Use https, rate limiting, and secure error messaging to mitigate security risks.

## 4. Validation and Business Logic

### 4.1 Generations
Constraints (enforced at API and DB):
- `sourceText` ∈ [1000, 10000] (reject otherwise)
- `sourceTextHash`: Computed for duplicate detection

Business rules:
- Validate inputs and call the AI service upon POST `/generations`
- Record generation metadata (model, generated_count, duration) and persist generated flashcards.
- Error logging: on LLM errors, insert into `generation_error_logs` with `error_code`, `error_message`.
- Automatic update of the `updated_at` field via database triggers when flashcards are doified.

### 4.2 Flashcards
Constraints:
- `front`: non-empty, length ≤ 200
- `back`: non-empty, length ≤ 500
- `source` ∈ {`manual`, `ai-full`, `ai-edited`}

Business rules:
- Automatic update of the `updated_at` field via database triggers when flashcards are doified.

---
