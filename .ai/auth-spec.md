## Specyfikacja architektury modułu autentykacji (rejestracja, logowanie, odzyskiwanie hasła) – 10x-cards

Na podstawie PRD (`.ai/prd.md`, w szczególności US-001 Rejestracja i US-002 Logowanie) oraz tech stacku (`.ai/tech-stack.md`). Wniosek: w wymaganiach użytkownik prosi także o odzyskiwanie hasła – traktujemy to jako rozszerzenie zgodne z bezpieczeństwem i standardami Supabase Auth.

Założenia ogólne:

- Nie naruszamy istniejącej architektury, struktur katalogów i integracji (Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui, Node adapter SSR).
- Uwierzytelnianie oparte o Supabase Auth (email+hasło), z możliwością włączenia weryfikacji emaili po rejestracji.
- Routing i SSR zgodnie z `astro.config.mjs` (output: "server", adapter node). Ochrona tras po stronie serwera z użyciem middleware.
- Spójne kontrakty API, jasna walidacja danych wejściowych i zunifikowana obsługa błędów.

Decyzje dla MVP (zgodne z PRD):

- Weryfikacja e‑mail: WYŁĄCZONA, aby spełnić US‑001 (po rejestracji użytkownik jest od razu zalogowany). Możliwość WŁĄCZENIA po MVP; wtedy `redirectTo` do `/auth/reset/confirm`.
- `generatorRoute`: `/generate`.
- Samoobsługowe usuwanie konta i danych: WŁĄCZONE (patrz rozdziały 2 i 3).
- Eksport moich danych (RODO): PO MVP.

Otwarte niuanse do potwierdzenia:

- W przyszłości możliwe dodanie social logins – poza zakresem tej specyfikacji.

---

## 1. Architektura interfejsu użytkownika

### 1.1 Layouty i warianty widoków

- `src/layouts/AuthLayout.astro`
  - Minimalistyczny layout dla stron niezalogowanych (logowanie, rejestracja, reset).
  - Zawiera branding i prostą nawigację (linki między `login/register/reset`).
  - Nie wyświetla elementów wymagających sesji użytkownika.
- `src/layouts/AppLayout.astro`
  - Layout dla widoków po zalogowaniu (aplikacja właściwa).
  - Pasek nawigacji z menu użytkownika (np. e‑mail, akcje: „Wyloguj”, „Moje fiszki”, „Generuj fiszki”).
  - Responsywny układ; stosujemy Tailwind 4 we wszystkich komponentach UI.

Reguła: strony „auth” nie dzielą stanu z aplikacją zalogowaną; po uwierzytelnieniu wykonujemy twarde przekierowanie do `generatorRoute` (lub `next` z query string).

### 1.2 Strony Astro (routing)

- `src/pages/auth/login.astro` → renderuje `<LoginForm />` (React)
- `src/pages/auth/register.astro` → `<RegisterForm />`
- `src/pages/auth/reset.astro` → `<ResetPasswordRequestForm />`
- `src/pages/auth/reset/confirm.astro`
  - Strona przejściowa do obsługi linków Supabase (po rejestracji weryfikacja i przywracanie sesji po kliknięciu z e‑maila).
  - Renderuje `<ResetPasswordForm />` gdy link dotyczy ustawienia nowego hasła.
  - Obsługuje też scenariusz „powrót do aplikacji”, jeśli link jedynie ustanawia sesję (np. po weryfikacji e‑mail).
- `src/pages/settings/account.astro` → renderuje `<DeleteAccountSection />` (React) w ramach `AppLayout.astro`.

Uwagi:

- Te strony używają `AuthLayout.astro`.
- Strony aplikacyjne (np. generator fiszek) używają `AppLayout.astro` i są chronione przez middleware (patrz 2.5).

### 1.3 Komponenty React (client-side, Shadcn/ui)

- `src/components/auth/LoginForm.tsx`
  - Pola: `email`, `password`.
  - Akcja: POST do `/api/auth/login`.
  - Po sukcesie: redirect do `next || generatorRoute`.
  - Stany: loading, error banner, invalid feedback dla pól.
- `src/components/auth/RegisterForm.tsx`
  - Pola: `email`, `password`, `confirmPassword`.
  - Akcja: POST do `/api/auth/signup`.
  - Po sukcesie:
    - jeśli weryfikacja e‑mail jest włączona: komunikat „Sprawdź skrzynkę e‑mail” i link do logowania,
    - jeśli wyłączona: automatyczny redirect do `generatorRoute`.
- `src/components/auth/ResetPasswordRequestForm.tsx`
  - Pole: `email`.
  - Akcja: POST do `/api/auth/reset/request`.
  - Po sukcesie: komunikat neutralny („Jeśli konto istnieje, wysłaliśmy wiadomość…”).
- `src/components/auth/ResetPasswordForm.tsx`
  - Pola: `newPassword`, `confirmPassword`.
  - Akcja: POST do `/api/auth/reset/complete` (wymaga aktywnej sesji z linku Supabase).
  - Po sukcesie: redirect do `/auth/login?reset=success`.
- `src/components/auth/DeleteAccountSection.tsx`
  - Pole: `currentPassword`.
  - Akcja: POST do `/api/auth/account/delete`.
  - Wymagana re‑autoryzacja hasłem przed usunięciem konta.

Wszystkie formularze:

- UI: komponenty Shadcn/ui (`Form`, `Input`, `Button`, `Alert/Toast`), klasy Tailwind.
- Walidacja klienta: `zod` + `react-hook-form` (schematy w `src/lib/validation/authSchemas.ts`).
- Wysyłka danych: `fetch` do API; nie wywołujemy Supabase bezpośrednio z klienta dla akcji auth – zapewnia to spójne ciasteczka i centralną obsługę błędów po stronie serwera.

### 1.4 Walidacja i komunikaty błędów

- Email:
  - Format RFC: podstawowa walidacja po stronie klienta i serwera.
  - Długość ≤ 254 znaki.
- Hasło:
  - Minimum 8 znaków, min. 1 litera i 1 cyfra; zalecamy 1 znak specjalny.
  - `confirmPassword` musi być zgodne.
- Komunikaty użytkownika (PL):
  - „Nieprawidłowy e‑mail lub hasło” – przy błędnych danych logowania.
  - „Konto już istnieje” – przy rejestracji istniejącego e‑maila.
  - „Zbyt wiele prób – spróbuj ponownie później” – rate limiting.
  - „Sprawdź skrzynkę e‑mail, aby dokończyć rejestrację” – jeśli e‑mail verification on.
  - „Jeśli konto istnieje, wysłaliśmy wiadomość…” – przy resetach (nie ujawniamy istnienia konta).

### 1.5 Najważniejsze scenariusze

- Rejestracja:
  - Sukces z weryfikacją e‑mail → baner informacyjny + link do logowania.
  - Sukces bez weryfikacji → automatyczne zalogowanie i redirect.
  - Błędy: e‑mail użyty, hasło zbyt słabe, problemy sieciowe.
- Logowanie:
  - Sukces → redirect do `next` lub `generatorRoute`.
  - Błędy: invalid credentials, konto niezweryfikowane (jeśli wymagane), rate-limited.
- Reset hasła:
  - Żądanie → zawsze neutralny komunikat.
  - Ustawienie nowego hasła po linku → sukces: redirect do logowania z param `reset=success`.
  - Błędy: link wygasł/nieprawidłowy, hasło nie spełnia wymogów.
- Nawigacja:
  - Gdy użytkownik zalogowany odwiedza `/auth/*` → przekierowanie do `generatorRoute`.
  - Gdy niezalogowany odwiedza strony chronione → redirect do `/auth/login?next=...`.

---

## 2. Logika backendowa

### 2.1 Struktura endpointów API

Katalog: `src/pages/api/auth/`

- `login.ts` (POST)
- `signup.ts` (POST)
- `logout.ts` (POST)
- `reset/request.ts` (POST)
- `reset/complete.ts` (POST)
- `session.ts` (GET) – helper do pobrania bieżącego użytkownika
- `account/delete.ts` (POST) – samoobsługowe usunięcie konta i danych

Wspólne założenia:

- Tworzymy Supabase Server Client per‑request (patrz 3.2), aby zarządzać sesją przez ciasteczka HTTP w tej samej domenie.
- Wszystkie endpointy stosują wspólny mechanizm walidacji (Zod) i obsługi błędów (patrz 2.2 i 2.3).
- Odpowiedzi mają jednolity kontrakt JSON, statusy HTTP i `errorCode`.

### 2.2 Modele danych i typy (wspólne)

- `src/types.ts` (współdzielone)
  - `type UserSafe = { id: string; email: string | null }`
  - `type AuthErrorCode = 'invalid_credentials' | 'email_in_use' | 'email_not_verified' | 'rate_limited' | 'invalid_input' | 'unknown'`
  - `type ProblemJson = { success: false; errorCode: AuthErrorCode; message: string; details?: Record<string, unknown> }`
  - `type AuthOk<T> = { success: true; data: T }`
  - `type SessionResponse = { user: UserSafe }`

Walidacja:

- `src/lib/validation/authSchemas.ts`
  - `loginSchema`: { email, password }
  - `signupSchema`: { email, password, confirmPassword }
  - `resetRequestSchema`: { email }
  - `resetCompleteSchema`: { newPassword, confirmPassword }
  - `deleteAccountSchema`: { currentPassword }

### 2.3 Mechanizm walidacji i obsługa wyjątków

- Walidacja wejścia: Zod – na początku endpointu, z wczesnym zwrotem błędu (guard clause).
- Mapowanie wyjątków Supabase:
  - `AuthApiError` → mapujemy do `invalid_credentials`, `email_in_use`, `email_not_verified` w zależności od komunikatu/kodu.
  - Inne → `unknown`.
- Stały format błędów: `ProblemJson` z dopasowanym statusem HTTP:
  - 400 `invalid_input`
  - 401 `invalid_credentials` / `email_not_verified`
  - 409 `email_in_use`
  - 429 `rate_limited`
  - 500 `unknown`

### 2.4 Kontrakty endpointów (konkretne)

`POST /api/auth/signup`
Żądanie:

```json
{ "email": "user@example.com", "password": "S3cure!Pass", "confirmPassword": "S3cure!Pass" }
```

Odpowiedź (weryfikacja e‑mail ON):

```json
{ "success": true, "data": { "requiresEmailVerification": true } }
```

Odpowiedź (weryfikacja e‑mail OFF):

```json
{ "success": true, "data": { "user": { "id": "uuid", "email": "user@example.com" } } }
```

Błędy:

```json
{ "success": false, "errorCode": "email_in_use", "message": "Konto już istnieje." }
```

`POST /api/auth/login`
Żądanie:

```json
{ "email": "user@example.com", "password": "S3cure!Pass" }
```

Odpowiedź:

```json
{ "success": true, "data": { "user": { "id": "uuid", "email": "user@example.com" } } }
```

Błędy:

```json
{ "success": false, "errorCode": "invalid_credentials", "message": "Nieprawidłowy e‑mail lub hasło." }
```

`POST /api/auth/logout`
Odpowiedź (204 No Content) – bez treści.

`POST /api/auth/reset/request`
Żądanie:

```json
{ "email": "user@example.com" }
```

Odpowiedź:

```json
{ "success": true }
```

`POST /api/auth/reset/complete`
Żądanie:

```json
{ "newPassword": "N3w!Pass", "confirmPassword": "N3w!Pass" }
```

Odpowiedź:

```json
{ "success": true }
```

Błędy:

```json
{ "success": false, "errorCode": "invalid_input", "message": "Hasło nie spełnia wymagań." }
```

`GET /api/auth/session`
Odpowiedź:

```json
{ "success": true, "data": { "user": { "id": "uuid", "email": "user@example.com" } } }
```

lub

```json
{ "success": false, "errorCode": "invalid_credentials", "message": "Brak aktywnej sesji." }
```

`POST /api/auth/account/delete`
Opis:

- Usuwa konto zalogowanego użytkownika oraz jego dane aplikacyjne.
  -- Wymaga sesji i re‑autoryzacji hasłem; wywołuje Supabase Admin API po stronie serwera.
  Żądanie:

```json
{ "currentPassword": "S3cure!Pass" }
```

Odpowiedź:

- 204 No Content (sukces)
  Błędy:

```json
{ "success": false, "errorCode": "invalid_credentials", "message": "Brak aktywnej sesji." }
```

```json
{ "success": false, "errorCode": "invalid_credentials", "message": "Nieprawidłowe hasło." }
```

```json
{ "success": false, "errorCode": "unknown", "message": "Nie udało się usunąć konta." }
```

### 2.5 Middleware i renderowanie SSR

- `src/middleware/index.ts`
  - Tworzy Supabase Server Client z ciasteczkami żądania/odpowiedzi.
  - Pozyskuje bieżącą sesję i umieszcza `user` w `locals`.
  - Ochrona tras chronionych (np. `/app/**`, generator fiszek) – niezalogowani są przekierowywani do `/auth/login?next=...`.
  - Dla `/auth/**`: jeśli użytkownik jest zalogowany, przekierowanie do `generatorRoute`.
  - Warstwa rate limit (patrz 2.6) dla `/api/auth/*` – unifikacja logiki w middleware, zgodnie z regułami projektu.
- SSR:
  - Strony aplikacyjne odczytują `locals.user` przy renderowaniu (SSR) w celu warunkowego renderu i personalizacji.
  - Konfiguracja zgodna z `astro.config.mjs` (output: "server", `@astrojs/node` adapter), bez kolizji z istniejącymi integracjami (React, Tailwind, sitemap).

### 2.6 Ograniczenia (rate limiting) i bezpieczeństwo

- `src/lib/middleware/rateLimit.ts`
  - Prosty token bucket / sliding window per IP (np. 5–10 żądań/min) dla `/api/auth/*`.
  - Status 429 i komunikat „Zbyt wiele prób – spróbuj ponownie później”.
- CSRF:
  - Endpoints przyjmują wyłącznie `application/json`.
  - Operacje mutujące dostępne tylko jako `POST`.
  - Ciasteczka sesyjne ustawiane przez Supabase (HttpOnly) – ogranicza ryzyka XSS.
- Usuwanie konta:
  - Endpoint `/api/auth/account/delete` jest objęty rate‑limitem i wymaga aktywnej sesji.
  - Wymagana „świeża” re‑autoryzacja: endpoint przyjmuje `currentPassword` i weryfikuje hasło po stronie serwera.
- Nagłówki bezpieczeństwa:
  - Wspierane przez adapter node/SSR; rekomendujemy dodać standardowe `Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy` na poziomie serwera/pośrednika (poza zakresem implementacji w tym repo).

---

## 3. System autentykacji (Supabase + Astro)

### 3.1 Zmienne środowiskowe i konfiguracja

- `.env`:
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`
  - (opcjonalnie) `PUBLIC_SITE_URL` – używane jako `redirectTo` w mailach (np. `https://app.example.com/auth/reset/confirm`).
  - Nigdy nie ujawniamy service role key w kliencie.
  - `SUPABASE_SERVICE_ROLE_KEY` – używany wyłącznie po stronie serwera (endpoint usuwania konta).
- Supabase Auth:
  - E‑mail/hasło włączone.
  - (Po MVP, opcjonalne) Weryfikacja e‑mail po rejestracji – redukcja nadużyć.
  - Szablony e‑mail dla resetu i weryfikacji wskazują na `PUBLIC_SITE_URL/auth/reset/confirm`.

### 3.2 Klienci Supabase

- `src/db/supabaseClient.ts` (przeglądarka)
  - `createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY)`.
  - Używany TYLKO do odczytów niekrytycznych po zalogowaniu (np. lekka personalizacja) – akcji auth nie wykonujemy po stronie klienta.
- `src/db/supabaseServer.ts` (SSR/endpointy)
  - `createServerClient` z pakietu `@supabase/ssr` z integracją ciasteczek Astro (`cookies` z kontekstu żądania/odpowiedzi).
  - Wywoływany w middleware i endpointach `/api/auth/*` – to tu powstaje/aktualizuje się sesja HTTP.
- `src/db/supabaseAdmin.ts` (tylko serwer)
  - Klient admina z service role: `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false }})`.
  - Używany wyłącznie do operacji administracyjnych wymagających uprawnień (np. usunięcie użytkownika).

### 3.3 Przepływy

- Rejestracja:
  - Endpoint `signup` wywołuje `auth.signUp({ email, password, options: { emailRedirectTo: PUBLIC_SITE_URL + '/auth/reset/confirm' }})`.
  - Gdy verification ON: użytkownik musi kliknąć link → Supabase ustanawia sesję → ląduje na `/auth/reset/confirm`.
- Logowanie:
  - Endpoint `login` wykonuje `auth.signInWithPassword({ email, password })`.
  - Po sukcesie – ciasteczka sesji ustawiane przez Supabase server client; redirect po stronie klienta do `next || generatorRoute`.
- Wylogowanie:
  - Endpoint `logout` → `auth.signOut()` → usuwa sesję/cookies.
- Reset hasła:
  - `reset/request`: `auth.resetPasswordForEmail(email, { redirectTo: PUBLIC_SITE_URL + '/auth/reset/confirm' })`.
  - Po kliknięciu w mailu: Supabase przekierowuje do `/auth/reset/confirm` i ustanawia sesję dla użytkownika (krótkotrwałą).
  - `reset/complete`: `auth.updateUser({ password: newPassword })`, następnie (opcjonalnie) sign‑out i redirect do logowania.
- Usunięcie konta:
  - Endpoint `account/delete` pobiera `user.id` i `email` z sesji (SSR client), weryfikuje `currentPassword` poprzez `auth.signInWithPassword({ email, password: currentPassword })` (re‑auth), a następnie wywołuje Supabase Admin API do usunięcia użytkownika.
  - Dane aplikacyjne powiązane z użytkownikiem powinny być usuwane transakcyjnie/cascade w bazie (klucze obce ON DELETE CASCADE lub dedykowana funkcja/usługa czyszcząca – poza zakresem tego dokumentu).

### 3.4 Uprawnienia i RLS

- Dostęp do danych użytkownika chroniony przez RLS w Supabase (poza zakresem tej specyfikacji).
- Aplikacja kliencka wykorzystuje wyłącznie anon key; operacje krytyczne (auth) są wykonywane na serwerze poprzez SSR client i cookies.

---

## 4. Zgodność z projektem i wpływ na resztę aplikacji

- Struktura katalogów zgodna z regułami:
  - `src/pages/auth/*` – nowe strony
  - `src/pages/settings/account.astro` – ustawienia konta (usuwanie konta)
  - `src/pages/api/auth/*` – endpointy
  - `src/layouts/*` – layouty
  - `src/components/auth/*` – formularze/sekcje (logowanie/rejestracja/reset/usuwanie konta)
  - `src/lib/validation/*` – schematy Zod
  - `src/db/*` – klienci Supabase (w tym `supabaseAdmin.ts` tylko dla serwera)
  - `src/middleware/index.ts` – ochrona tras i rate limit
- Nie modyfikujemy istniejących usług AI, generowania fiszek ani konfiguracji Vite poza konieczną integracją cookies/middleware.
- Zastosowanie Tailwind 4 i Shadcn/ui – bez dedykowanych plików CSS.
- Przestrzegamy „Rules of Hooks” w komponentach React.

---

## 5. Testowalność i scenariusze QA (wysoki poziom)

- Rejestracja:
  - Nowy e‑mail → komunikat o weryfikacji.
  - Ponowna rejestracja tego samego e‑maila → 409 `email_in_use`.
  - Weryfikacja linku → lądowanie na `/auth/reset/confirm`.
- Logowanie:
  - Poprawne dane → redirect do `generatorRoute`.
  - Błędne dane → 401 `invalid_credentials`.
  - `next` działa (z i bez parametru).
- Reset hasła:
  - Żądanie z istniejącym i nieistniejącym e‑mailem → ta sama odpowiedź.
  - Link resetu wygasły → komunikat o błędzie i możliwość wysłania prośby ponownie.
  - Ustawienie nowego hasła → redirect do logowania.
- Middleware:
  - Dostęp niezalogowanego do chronionej trasy → redirect do logowania z `next`.
  - Dostęp zalogowanego do `/auth/*` → redirect do `generatorRoute`.
- Rate limiting:
  - Nadmierne próby logowania → 429.
- Usuwanie konta:
  - Próba bez sesji → 401 `invalid_credentials`.
  - Złe hasło (re‑auth) → 401 `invalid_credentials`.
  - Poprawne wywołanie → 204 No Content (konto i dane usunięte).
  - Błąd admin API → 500 `unknown`.

---

## 6. Wymagane elementy implementacyjne (lista kontrolna)

- Layouty: `AuthLayout.astro`, `AppLayout.astro`.
- Strony: `auth/login.astro`, `auth/register.astro`, `auth/reset.astro`, `auth/reset/confirm.astro`, `settings/account.astro`.
- Komponenty: `LoginForm.tsx`, `RegisterForm.tsx`, `ResetPasswordRequestForm.tsx`, `ResetPasswordForm.tsx`, `DeleteAccountSection.tsx`.
- Walidacja: `src/lib/validation/authSchemas.ts` (Zod).
- API: `src/pages/api/auth/{login,signup,logout,reset/request,reset/complete,session,account/delete}.ts`.
- Supabase:
  - `src/db/supabaseClient.ts` (przeglądarka),
  - `src/db/supabaseServer.ts` (SSR, `@supabase/ssr`),
  - `src/db/supabaseAdmin.ts` (server‑only, service role).
- Middleware: `src/middleware/index.ts` (sesja w `locals`, ochrona tras, rate limit).
- Konfiguracja: `.env` z `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (tylko serwer).

---

## 7. Zależności i wpływ na CI/CD

- Dodatki (proponowane): `zod`, `react-hook-form`, `@hookform/resolvers`, `@supabase/ssr` (jeśli jeszcze nie ma).
- Brak zmian w `astro.config.mjs` koniecznych na tym etapie; SSR i adapter node już skonfigurowane.
- Pipeline CI/CD bez zmian – dochodzi tylko lint/typowanie nowych plików.

---

## 8. Pytania do Product/Stakeholders (do szybkiego potwierdzenia)

- Po MVP: „eksport moich danych” (RODO) – ustalić zakres i format (CSV/JSON).
