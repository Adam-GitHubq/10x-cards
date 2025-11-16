# Plan Testów Jednostkowych - Moduł Uwierzytelniania (Auth)

## 1. Wprowadzenie i cele testowania

### 1.1. Wprowadzenie
Niniejszy dokument określa szczegółowy plan testów jednostkowych dla modułu uwierzytelniania aplikacji 10xCards. Moduł auth jest kluczowym elementem zapewniającym bezpieczeństwo i prywatność danych użytkowników, dlatego wymaga szczególnie gruntownego testowania.

### 1.2. Cele testowania
Główne cele testów jednostkowych modułu auth:
- **Weryfikacja logiki biznesowej:** Upewnienie się, że wszystkie funkcje walidacji, mapowania błędów i obsługi sesji działają zgodnie ze specyfikacją.
- **Izolacja komponentów:** Testowanie każdego elementu modułu auth w izolacji od zewnętrznych zależności (Supabase, baza danych).
- **Zapewnienie bezpieczeństwa:** Weryfikacja poprawności walidacji danych wejściowych i obsługi błędów związanych z bezpieczeństwem.
- **Regresja:** Zapewnienie, że przyszłe zmiany nie złamią istniejącej funkcjonalności.
- **Dokumentacja przez testy:** Testy jednostkowe służą jako żywa dokumentacja zachowania kodu.

### 1.3. Zakres testów jednostkowych
Testy jednostkowe dla modułu auth obejmują:
- Schematy walidacji Zod (`authSchemas.ts`)
- Funkcje mapowania błędów Supabase
- Logika middleware (przekierowania, izolacja sesji)
- Endpointy API (z mockami Supabase)
- Funkcje pomocnicze

**Poza zakresem testów jednostkowych:**
- Rzeczywista integracja z Supabase (testy integracyjne)
- Testy UI komponentów React (osobny plan testów)
- Testy E2E przepływów użytkownika (Playwright)

## 2. Środowisko testowe

### 2.1. Framework i narzędzia
- **Framework testowy:** Vitest
- **Mockowanie:** `vi.fn()`, `vi.spyOn()`, `vi.mock()`
- **Asercje:** Wbudowane matchery Vitest
- **Środowisko:** Node.js (dla testów API i middleware)

### 2.2. Struktura katalogów testowych
```
src/
├── lib/
│   └── validation/
│       ├── authSchemas.ts
│       └── authSchemas.test.ts
├── pages/
│   └── api/
│       └── auth/
│           ├── login.ts
│           ├── login.test.ts
│           ├── signup.ts
│           ├── signup.test.ts
│           ├── logout.ts
│           └── logout.test.ts
└── middleware/
    ├── index.ts
    └── index.test.ts
```

### 2.3. Konwencje nazewnictwa
- Pliki testowe: `*.test.ts` lub `*.spec.ts`
- Opisowe nazwy bloków: `describe("Funkcja/Moduł", () => { ... })`
- Jasne nazwy testów: `it("should [oczekiwane zachowanie] when [warunek]", () => { ... })`
- Wzorzec AAA (Arrange-Act-Assert)

## 3. Szczegółowy plan testów

### 3.1. Testy walidacji - authSchemas.ts

**Plik:** `src/lib/validation/authSchemas.test.ts`

#### 3.1.1. emailSchema
**Cel:** Weryfikacja walidacji adresów e-mail zgodnie z RFC i wymaganiami biznesowymi.

| ID Testu | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|----------|-----------|----------------|------------------|
| AUTH-VAL-001 | Akceptacja poprawnego e-maila | `"test@example.com"` | Sukces walidacji |
| AUTH-VAL-002 | Akceptacja e-maila z subdomeną | `"user@mail.example.com"` | Sukces walidacji |
| AUTH-VAL-003 | Akceptacja e-maila z cyframi | `"user123@example.com"` | Sukces walidacji |
| AUTH-VAL-004 | Odrzucenie e-maila bez @ | `"userexample.com"` | Błąd: "Podaj prawidłowy adres e-mail." |
| AUTH-VAL-005 | Odrzucenie e-maila bez domeny | `"user@"` | Błąd: "Podaj prawidłowy adres e-mail." |
| AUTH-VAL-006 | Odrzucenie pustego stringa | `""` | Błąd: "Adres e-mail jest wymagany." |
| AUTH-VAL-007 | Odrzucenie e-maila z białymi znakami | `"  test@example.com  "` | Sukces (trim automatyczny) |
| AUTH-VAL-008 | Odrzucenie zbyt długiego e-maila (>254) | Email o długości 255 znaków | Błąd: "Adres e-mail jest zbyt długi." |
| AUTH-VAL-009 | Odrzucenie null/undefined | `null`, `undefined` | Błąd: "Adres e-mail jest wymagany." |
| AUTH-VAL-010 | Akceptacja maksymalnej długości (254) | Email o długości 254 znaków | Sukces walidacji |

#### 3.1.2. basePasswordSchema
**Cel:** Weryfikacja wymogów bezpieczeństwa hasła.

| ID Testu | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|----------|-----------|----------------|------------------|
| AUTH-VAL-011 | Akceptacja silnego hasła | `"Password123"` | Sukces walidacji |
| AUTH-VAL-012 | Akceptacja hasła ze znakami specjalnymi | `"P@ssw0rd!"` | Sukces walidacji |
| AUTH-VAL-013 | Akceptacja minimalnej długości (8 znaków) | `"Pass1234"` | Sukces walidacji |
| AUTH-VAL-014 | Odrzucenie hasła za krótkiego (<8) | `"Pass123"` | Błąd: "Hasło musi mieć co najmniej 8 znaków." |
| AUTH-VAL-015 | Odrzucenie hasła bez litery | `"12345678"` | Błąd: "Hasło musi zawierać przynajmniej jedną literę." |
| AUTH-VAL-016 | Odrzucenie hasła bez cyfry | `"Password"` | Błąd: "Hasło musi zawierać przynajmniej jedną cyfrę." |
| AUTH-VAL-017 | Odrzucenie pustego hasła | `""` | Błąd: "Hasło jest wymagane." |
| AUTH-VAL-018 | Odrzucenie null/undefined | `null`, `undefined` | Błąd: "Hasło jest wymagane." |
| AUTH-VAL-019 | Akceptacja długiego hasła (>50 znaków) | Hasło o długości 100 znaków z literami i cyframi | Sukces walidacji |

#### 3.1.3. loginSchema
**Cel:** Weryfikacja schematu danych logowania.

| ID Testu | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|----------|-----------|----------------|------------------|
| AUTH-VAL-020 | Akceptacja poprawnych danych logowania | `{ email: "test@example.com", password: "anypassword" }` | Sukces walidacji |
| AUTH-VAL-021 | Odrzucenie niepoprawnego e-maila | `{ email: "invalid", password: "test" }` | Błąd dla pola email |
| AUTH-VAL-022 | Odrzucenie pustego hasła | `{ email: "test@example.com", password: "" }` | Błąd: "Hasło jest wymagane." |
| AUTH-VAL-023 | Odrzucenie brakującego pola email | `{ password: "test" }` | Błąd: "Adres e-mail jest wymagany." |
| AUTH-VAL-024 | Odrzucenie brakującego pola password | `{ email: "test@example.com" }` | Błąd: "Hasło jest wymagane." |
| AUTH-VAL-025 | Odrzucenie dodatkowych pól | `{ email: "test@example.com", password: "test", extra: "field" }` | Sukces (dodatkowe pola ignorowane przez Zod) |

**Uwaga:** `loginSchema` nie wymaga spełnienia wymogów `basePasswordSchema` dla hasła - akceptuje dowolny niepusty string (użytkownik może mieć stare hasło z innych wymogów).

#### 3.1.4. signupSchema
**Cel:** Weryfikacja schematu rejestracji z potwierdzeniem hasła.

| ID Testu | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|----------|-----------|----------------|------------------|
| AUTH-VAL-026 | Akceptacja poprawnej rejestracji | `{ email: "test@example.com", password: "Pass1234", confirmPassword: "Pass1234" }` | Sukces walidacji |
| AUTH-VAL-027 | Odrzucenie niezgodnych haseł | `{ email: "test@example.com", password: "Pass1234", confirmPassword: "Pass5678" }` | Błąd: "Hasła muszą być identyczne." (path: confirmPassword) |
| AUTH-VAL-028 | Odrzucenie słabego hasła | `{ email: "test@example.com", password: "weak", confirmPassword: "weak" }` | Błędy basePasswordSchema |
| AUTH-VAL-029 | Odrzucenie pustego confirmPassword | `{ email: "test@example.com", password: "Pass1234", confirmPassword: "" }` | Błąd: "Potwierdź hasło." |
| AUTH-VAL-030 | Walidacja wszystkich pól jednocześnie | `{ email: "invalid", password: "weak", confirmPassword: "different" }` | Wielokrotne błędy walidacji |

#### 3.1.5. resetRequestSchema
**Cel:** Weryfikacja schematu żądania resetu hasła.

| ID Testu | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|----------|-----------|----------------|------------------|
| AUTH-VAL-031 | Akceptacja poprawnego żądania resetu | `{ email: "test@example.com" }` | Sukces walidacji |
| AUTH-VAL-032 | Odrzucenie niepoprawnego e-maila | `{ email: "invalid" }` | Błąd email |
| AUTH-VAL-033 | Odrzucenie pustego e-maila | `{ email: "" }` | Błąd: "Adres e-mail jest wymagany." |

#### 3.1.6. resetCompleteSchema
**Cel:** Weryfikacja schematu dokończenia resetu hasła.

| ID Testu | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|----------|-----------|----------------|------------------|
| AUTH-VAL-034 | Akceptacja poprawnego nowego hasła | `{ newPassword: "NewPass123", confirmPassword: "NewPass123" }` | Sukces walidacji |
| AUTH-VAL-035 | Odrzucenie niezgodnych haseł | `{ newPassword: "NewPass123", confirmPassword: "Different123" }` | Błąd: "Hasła muszą być identyczne." |
| AUTH-VAL-036 | Odrzucenie słabego nowego hasła | `{ newPassword: "weak", confirmPassword: "weak" }` | Błędy basePasswordSchema |

#### 3.1.7. deleteAccountSchema
**Cel:** Weryfikacja schematu usunięcia konta.

| ID Testu | Scenariusz | Dane wejściowe | Oczekiwany wynik |
|----------|-----------|----------------|------------------|
| AUTH-VAL-037 | Akceptacja poprawnego hasła | `{ currentPassword: "anypassword" }` | Sukces walidacji |
| AUTH-VAL-038 | Odrzucenie pustego hasła | `{ currentPassword: "" }` | Błąd: "Hasło jest wymagane." |
| AUTH-VAL-039 | Odrzucenie null/undefined | `{ currentPassword: null }` | Błąd: "Hasło jest wymagane." |

### 3.2. Testy funkcji mapowania błędów

**Plik:** `src/pages/api/auth/mapSupabaseError.test.ts` (do ekstrakcji z login.ts i signup.ts)

**Uwaga:** Zalecane jest wyekstrahowanie funkcji `mapSupabaseError` do oddzielnego pliku `src/lib/auth/errorMapper.ts`, aby uniknąć duplikacji i ułatwić testowanie.

#### 3.2.1. mapSupabaseError dla login.ts

| ID Testu | Scenariusz | Dane wejściowe (error) | Oczekiwany wynik |
|----------|-----------|------------------------|------------------|
| AUTH-MAP-001 | Mapowanie błędu nieprawidłowych danych logowania | `AuthApiError` z message: "Invalid login credentials" | `{ errorCode: "invalid_credentials", message: "Nieprawidłowy e-mail lub hasło." }` |
| AUTH-MAP-002 | Mapowanie błędu niezweryfikowanego e-maila | `AuthApiError` z message: "Email not confirmed" | `{ errorCode: "email_not_verified", message: "Adres e-mail nie został zweryfikowany..." }` |
| AUTH-MAP-003 | Mapowanie błędu rate limiting (429) | `AuthApiError` z status: 429 | `{ errorCode: "rate_limited", message: "Zbyt wiele prób – spróbuj ponownie później." }` |
| AUTH-MAP-004 | Mapowanie nieznanych błędów Supabase | `AuthApiError` z innym komunikatem | `{ errorCode: "unknown", message: "Wystąpił nieoczekiwany błąd..." }` |
| AUTH-MAP-005 | Mapowanie błędów nie będących AuthApiError | `Error("Network error")` | `{ errorCode: "unknown", message: "Wystąpił nieoczekiwany błąd..." }` |
| AUTH-MAP-006 | Obsługa null/undefined | `null`, `undefined` | `{ errorCode: "unknown", message: "Wystąpił nieoczekiwany błąd..." }` |

#### 3.2.2. mapSupabaseError dla signup.ts

| ID Testu | Scenariusz | Dane wejściowe (error) | Oczekiwany wynik |
|----------|-----------|------------------------|------------------|
| AUTH-MAP-007 | Mapowanie błędu istniejącego użytkownika | `AuthApiError` z message: "User already registered" | `{ errorCode: "email_in_use", message: "Konto z tym adresem e-mail już istnieje." }` |
| AUTH-MAP-008 | Mapowanie błędu słabego hasła | `AuthApiError` z message: "Password should be at least" | `{ errorCode: "invalid_input", message: "Hasło jest zbyt słabe..." }` |
| AUTH-MAP-009 | Mapowanie błędu rate limiting (429) | `AuthApiError` z status: 429 | `{ errorCode: "rate_limited", message: "Zbyt wiele prób – spróbuj ponownie później." }` |
| AUTH-MAP-010 | Mapowanie nieznanych błędów | Inne błędy | `{ errorCode: "unknown", message: "Wystąpił nieoczekiwany błąd..." }` |

### 3.3. Testy endpointu POST /api/auth/login

**Plik:** `src/pages/api/auth/login.test.ts`

**Setup:**
- Mock `locals.supabase.auth.signInWithPassword`
- Mock `request.json()` do zwracania body
- Wykorzystanie `vi.mock()` dla modułu walidacji

#### 3.3.1. Testy walidacji wejścia

| ID Testu | Scenariusz | Request Body | Oczekiwany wynik |
|----------|-----------|--------------|------------------|
| AUTH-API-001 | Odrzucenie nieprawidłowych danych (invalid_input) | `{ email: "invalid", password: "" }` | Status 400, `errorCode: "invalid_input"`, `details` z błędami walidacji |
| AUTH-API-002 | Odrzucenie pustego body | `{}` | Status 400, `errorCode: "invalid_input"` |
| AUTH-API-003 | Odrzucenie body niebędącego JSON | Parsowanie JSON rzuca błąd | Status 500, `errorCode: "unknown"` |

#### 3.3.2. Testy logiki biznesowej

| ID Testu | Scenariusz | Mock Supabase | Oczekiwany wynik |
|----------|-----------|---------------|------------------|
| AUTH-API-004 | Pomyślne logowanie | `signInWithPassword` zwraca `{ data: { user: { id: "123", email: "test@example.com" } }, error: null }` | Status 200, `success: true`, `data.user.id`, `data.user.email` |
| AUTH-API-005 | Błąd nieprawidłowych danych logowania | `signInWithPassword` zwraca `error: AuthApiError` z "Invalid login credentials" | Status 401, `errorCode: "invalid_credentials"` |
| AUTH-API-006 | Błąd niezweryfikowanego e-maila | `signInWithPassword` zwraca `error: AuthApiError` z "Email not confirmed" | Status 401, `errorCode: "email_not_verified"` |
| AUTH-API-007 | Błąd rate limiting | `signInWithPassword` zwraca `error: AuthApiError` z status 429 | Status 500, `errorCode: "rate_limited"` |
| AUTH-API-008 | Nieoczekiwany błąd Supabase | `signInWithPassword` zwraca nieznany błąd | Status 500, `errorCode: "unknown"` |
| AUTH-API-009 | Błąd gdy user jest null mimo braku error | `signInWithPassword` zwraca `{ data: { user: null }, error: null }` | Obsługa edge case (logowanie z odpowiednim komunikatem lub błąd) |

#### 3.3.3. Testy formatowania odpowiedzi

| ID Testu | Scenariusz | Oczekiwany wynik |
|----------|-----------|------------------|
| AUTH-API-010 | Struktura odpowiedzi sukcesu | Response zawiera `success: true`, `data.user` z `id` i `email` |
| AUTH-API-011 | Struktura odpowiedzi błędu | Response zawiera `success: false`, `errorCode`, `message` |
| AUTH-API-012 | Content-Type header | Response ma header `Content-Type: application/json` |

### 3.4. Testy endpointu POST /api/auth/signup

**Plik:** `src/pages/api/auth/signup.test.ts`

**Setup:**
- Mock `locals.supabase.auth.signUp`
- Mock `request.json()`

#### 3.4.1. Testy walidacji wejścia

| ID Testu | Scenariusz | Request Body | Oczekiwany wynik |
|----------|-----------|--------------|------------------|
| AUTH-API-013 | Odrzucenie nieprawidłowych danych | `{ email: "invalid", password: "weak", confirmPassword: "different" }` | Status 400, `errorCode: "invalid_input"`, `details` |
| AUTH-API-014 | Odrzucenie niezgodnych haseł | `{ email: "test@example.com", password: "Pass1234", confirmPassword: "Pass5678" }` | Status 400, błąd dla `confirmPassword` |
| AUTH-API-015 | Odrzucenie słabego hasła | `{ email: "test@example.com", password: "weak", confirmPassword: "weak" }` | Status 400, błędy hasła |

#### 3.4.2. Testy logiki biznesowej - weryfikacja email WYŁĄCZONA

| ID Testu | Scenariusz | Mock Supabase | Oczekiwany wynik |
|----------|-----------|---------------|------------------|
| AUTH-API-016 | Pomyślna rejestracja z automatycznym logowaniem | `signUp` zwraca `{ data: { user: { id: "123", email: "test@example.com", identities: [{...}] } }, error: null }` | Status 200, `success: true`, `data.user` |
| AUTH-API-017 | Błąd - e-mail już w użyciu | `signUp` zwraca `error: AuthApiError` z "User already registered" | Status 409, `errorCode: "email_in_use"` |
| AUTH-API-018 | Błąd - słabe hasło od Supabase | `signUp` zwraca `error: AuthApiError` z "Password should be at least" | Status 400, `errorCode: "invalid_input"` |
| AUTH-API-019 | Błąd rate limiting | `signUp` zwraca `error: AuthApiError` z status 429 | Status 429, `errorCode: "rate_limited"` |

#### 3.4.3. Testy logiki biznesowej - weryfikacja email WŁĄCZONA

| ID Testu | Scenariusz | Mock Supabase | Oczekiwany wynik |
|----------|-----------|---------------|------------------|
| AUTH-API-020 | Rejestracja wymaga weryfikacji email | `signUp` zwraca `{ data: { user: { identities: [] } }, error: null }` (puste identities) | Status 200, `data.requiresEmailVerification: true` |
| AUTH-API-021 | Rejestracja wymaga weryfikacji email (user null) | `signUp` zwraca `{ data: { user: null }, error: null }` | Status 200, `data.requiresEmailVerification: true` |

### 3.5. Testy endpointu POST /api/auth/logout

**Plik:** `src/pages/api/auth/logout.test.ts`

**Setup:**
- Mock `cookies.delete()`
- Mock `request.headers.get("Cookie")`

| ID Testu | Scenariusz | Cookie Header | Oczekiwany wynik |
|----------|-----------|---------------|------------------|
| AUTH-API-022 | Pomyślne wylogowanie z cookies Supabase | `"sb-test-auth=value; other=cookie"` | Status 204, wywołanie `cookies.delete()` dla cookies `sb-*` |
| AUTH-API-023 | Wylogowanie bez cookies Supabase | `"other=cookie"` | Status 204, warning w konsoli, brak wywołań `cookies.delete()` dla `sb-*` |
| AUTH-API-024 | Wylogowanie bez cookies wcale | `null` lub `""` | Status 204, warning w konsoli |
| AUTH-API-025 | Usunięcie wszystkich cookies Supabase | `"sb-auth=val1; sb-refresh=val2"` | Wywołanie `cookies.delete()` dla każdego cookie `sb-*` |
| AUTH-API-026 | Obsługa błędu podczas usuwania cookies | `cookies.delete()` rzuca błąd | Status 204 (graceful degradation - lepiej wylogować częściowo) |

### 3.6. Testy middleware

**Plik:** `src/middleware/index.test.ts`

**Setup:**
- Mock `createSupabaseServerInstance()`
- Mock `supabase.auth.getUser()`
- Mock `redirect()`
- Mock kontekstu Astro (`locals`, `cookies`, `url`, `request`)

#### 3.6.1. Testy funkcji pomocniczej isProtectedPath

| ID Testu | Scenariusz | Pathname | Oczekiwany wynik |
|----------|-----------|----------|------------------|
| AUTH-MW-001 | Rozpoznanie chronionej ścieżki /generate | `"/generate"` | `true` |
| AUTH-MW-002 | Rozpoznanie chronionej ścieżki /flashcards | `"/flashcards"` | `true` |
| AUTH-MW-003 | Rozpoznanie chronionej ścieżki /settings | `"/settings"` | `true` |
| AUTH-MW-004 | Rozpoznanie podścieżki chronionej | `"/flashcards/123"` | `true` |
| AUTH-MW-005 | Rozpoznanie publicznej ścieżki /auth/login | `"/auth/login"` | `false` |
| AUTH-MW-006 | Rozpoznanie publicznej ścieżki / (root) | `"/"` | `false` |

#### 3.6.2. Testy inicjalizacji Supabase i pobierania użytkownika

| ID Testu | Scenariusz | Mock getUser | Oczekiwany wynik |
|----------|-----------|--------------|------------------|
| AUTH-MW-007 | Ustawienie user w locals gdy użytkownik zalogowany | `getUser()` zwraca `{ data: { user: { id: "123", email: "test@example.com" } } }` | `locals.user` jest ustawiony na `{ id: "123", email: "test@example.com" }` |
| AUTH-MW-008 | Ustawienie user na null gdy niezalogowany | `getUser()` zwraca `{ data: { user: null } }` | `locals.user === null` |
| AUTH-MW-009 | Ustawienie supabase w locals | Dowolny wynik `getUser()` | `locals.supabase` jest ustawiony na instancję klienta |

#### 3.6.3. Testy przekierowań - zalogowany użytkownik

| ID Testu | Scenariusz | User | Pathname | Oczekiwany wynik |
|----------|-----------|------|----------|------------------|
| AUTH-MW-010 | Przekierowanie zalogowanego z /auth/login do /generate | Zalogowany | `"/auth/login"` | `redirect("/generate")` |
| AUTH-MW-011 | Przekierowanie zalogowanego z /auth/register do /generate | Zalogowany | `"/auth/register"` | `redirect("/generate")` |
| AUTH-MW-012 | Przekierowanie zalogowanego z /auth/reset do /generate | Zalogowany | `"/auth/reset"` | `redirect("/generate")` |
| AUTH-MW-013 | Brak przekierowania dla zalogowanego na /generate | Zalogowany | `"/generate"` | `next()` (brak przekierowania) |
| AUTH-MW-014 | Brak przekierowania dla zalogowanego na / | Zalogowany | `"/"` | `next()` |

#### 3.6.4. Testy przekierowań - niezalogowany użytkownik

| ID Testu | Scenariusz | User | Pathname | Oczekiwany wynik |
|----------|-----------|------|----------|------------------|
| AUTH-MW-015 | Przekierowanie niezalogowanego z /generate do /auth/login | Niezalogowany | `"/generate"` | `redirect("/auth/login")` (bez parametru `next`) |
| AUTH-MW-016 | Przekierowanie niezalogowanego z /flashcards do /auth/login?next= | Niezalogowany | `"/flashcards"` | `redirect("/auth/login?next=%2Fflashcards")` |
| AUTH-MW-017 | Przekierowanie niezalogowanego z /settings do /auth/login?next= | Niezalogowany | `"/settings"` | `redirect("/auth/login?next=%2Fsettings")` |
| AUTH-MW-018 | Brak przekierowania dla niezalogowanego na /auth/login | Niezalogowany | `"/auth/login"` | `next()` |
| AUTH-MW-019 | Brak przekierowania dla niezalogowanego na / | Niezalogowany | `"/"` | `next()` |
| AUTH-MW-020 | Brak przekierowania dla niezalogowanego na /api/auth/login | Niezalogowany | `"/api/auth/login"` | `next()` |

## 4. Strategia mockowania

### 4.1. Mockowanie Supabase Auth
- Użyj `vi.mock()` na poziomie modułu dla `@supabase/supabase-js`
- Stwórz factory function zwracającą mockowanego klienta z metodami `auth.signInWithPassword`, `auth.signUp`, `auth.getUser`, etc.
- Dla każdego testu użyj `vi.mocked()` do kontrolowania wartości zwracanych
- Przykład:
  ```typescript
  vi.mock("@supabase/supabase-js", () => ({
    AuthApiError: vi.fn(),
  }));
  
  const mockSignInWithPassword = vi.fn();
  locals.supabase = {
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  } as any;
  ```

### 4.2. Mockowanie kontekstu Astro
- Stwórz helper function `createMockAstroContext()` zwracający obiekt z:
  - `locals` (z supabase i user)
  - `cookies` (z metodami get/set/delete)
  - `url` (URL object)
  - `request` (Request object)
  - `redirect` (mockowana funkcja)

### 4.3. Mockowanie Request i Response
- Użyj `new Request()` do tworzenia rzeczywistych obiektów Request z body JSON
- Dla Response parsuj JSON z `response.json()` lub `await response.text()`

## 5. Kryteria akceptacji testów

### 5.1. Pokrycie kodu
- **Cel:** ≥90% pokrycia linii kodu dla modułu auth
- **Minimum:** 80% pokrycia dla wszystkich plików związanych z auth
- Priorytet: 100% pokrycia ścieżek krytycznych (walidacja, mapowanie błędów, middleware)

### 5.2. Jakość testów
- Wszystkie testy muszą przechodzić (`npm run test`)
- Brak testów `it.skip()` lub `it.todo()` w finalnej wersji
- Każdy test musi mieć jednoznaczną asercję
- Testy muszą być deterministyczne (brak flakiness)

### 5.3. Wydajność
- Wszystkie testy jednostkowe modułu auth powinny wykonać się w < 5 sekund
- Pojedynczy test nie powinien trwać dłużej niż 100ms

## 6. Narzędzia i konfiguracja

### 6.1. Konfiguracja Vitest
```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/lib/validation/**", "src/pages/api/auth/**", "src/middleware/**"],
      exclude: ["**/*.test.ts", "**/*.spec.ts"],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
});
```

### 6.2. Skrypty npm
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:auth": "vitest run --dir src/lib/validation src/pages/api/auth src/middleware"
  }
}
```

## 7. Harmonogram implementacji

### Faza 1: Testy walidacji (Priorytet: Wysoki)
- **Czas:** 1 dzień
- **Zakres:** Wszystkie schematy Zod (3.1.1 - 3.1.7)
- **Osoba odpowiedzialna:** Deweloper

### Faza 2: Testy mapowania błędów (Priorytet: Wysoki)
- **Czas:** 0.5 dnia
- **Zakres:** Funkcje mapSupabaseError (3.2.1 - 3.2.2)
- **Uwaga:** Wyekstrahuj funkcję do oddzielnego pliku przed testowaniem

### Faza 3: Testy API - Login i Signup (Priorytet: Krytyczny)
- **Czas:** 2 dni
- **Zakres:** Endpointy /api/auth/login i /api/auth/signup (3.3, 3.4)
- **Osoba odpowiedzialna:** Deweloper

### Faza 4: Testy API - Logout (Priorytet: Średni)
- **Czas:** 0.5 dnia
- **Zakres:** Endpoint /api/auth/logout (3.5)

### Faza 5: Testy Middleware (Priorytet: Krytyczny)
- **Czas:** 1 dzień
- **Zakres:** Middleware przekierowań i autoryzacji (3.6)

### Faza 6: Przegląd i optymalizacja (Priorytet: Średni)
- **Czas:** 0.5 dnia
- **Zakres:** Refaktoryzacja, DRY, dokumentacja, pokrycie kodu

**Całkowity szacowany czas:** 5.5 dnia roboczego

## 8. Procedury i dobre praktyki

### 8.1. Wzorzec AAA (Arrange-Act-Assert)
```typescript
it("should return 401 when credentials are invalid", async () => {
  // Arrange - przygotuj dane testowe i mocki
  const mockSignIn = vi.fn().mockResolvedValue({
    data: { user: null },
    error: new AuthApiError("Invalid login credentials"),
  });
  
  // Act - wykonaj testowaną funkcję
  const response = await POST({ request, locals });
  
  // Assert - sprawdź wynik
  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({
    success: false,
    errorCode: "invalid_credentials",
    message: "Nieprawidłowy e-mail lub hasło.",
  });
});
```

### 8.2. Nazywanie testów
- ✅ Dobre: `"should redirect to /generate when logged in user visits /auth/login"`
- ❌ Złe: `"test login redirect"`

### 8.3. Izolacja testów
- Każdy test powinien być niezależny (brak współdzielenia stanu)
- Użyj `beforeEach()` do resetowania mocków
- Unikaj globalnego stanu w testach

### 8.4. Testowanie edge cases
- Zawsze testuj przypadki brzegowe (null, undefined, empty string, bardzo długie wartości)
- Testuj ścieżki błędów tak samo gruntownie jak ścieżki sukcesu

### 8.5. Dokumentacja przez testy
- Testy powinny służyć jako dokumentacja zachowania kodu
- Używaj opisowych nazw testów i zmiennych
- Dodaj komentarze dla złożonych setupów

## 9. Wskaźniki sukcesu

| Metryka | Cel | Minimum |
|---------|-----|---------|
| Pokrycie linii kodu (auth) | ≥95% | ≥90% |
| Pokrycie funkcji | ≥95% | ≥90% |
| Pokrycie gałęzi | ≥90% | ≥85% |
| Liczba testów jednostkowych | ≥80 | ≥60 |
| Czas wykonania wszystkich testów | <5s | <10s |
| Procent przechodzących testów | 100% | 100% |

## 10. Ryzyka i mitygacja

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|--------|-------------------|-------|-----------|
| Zmiana API Supabase | Niskie | Wysoki | Izolacja poprzez mocki, testy integracyjne jako osobna warstwa |
| Flaky tests ze względu na timing | Średnie | Średni | Unikanie asynchronicznych operacji bez kontroli, używanie `vi.useFakeTimers()` gdzie potrzeba |
| Niekompletne pokrycie edge cases | Wysokie | Wysoki | Code review, systematyczna analiza warunków brzegowych |
| Brak spójności między testami | Średnie | Średni | Wspólne helpery, strict linting, dokumentacja wzorców |

## 11. Załączniki

### 11.1. Przykładowy test walidacji
```typescript
import { describe, expect, it } from "vitest";
import { loginSchema } from "./authSchemas";

describe("loginSchema", () => {
  describe("email validation", () => {
    it("should accept valid email", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "anypassword",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const result = loginSchema.safeParse({
        email: "notanemail",
        password: "anypassword",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.email).toContain(
          "Podaj prawidłowy adres e-mail."
        );
      }
    });
  });
});
```

### 11.2. Przykładowy test API endpoint
```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "./login";
import type { APIContext } from "astro";

describe("POST /api/auth/login", () => {
  let mockContext: Partial<APIContext>;

  beforeEach(() => {
    mockContext = {
      request: new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "Password123",
        }),
      }),
      locals: {
        supabase: {
          auth: {
            signInWithPassword: vi.fn(),
          },
        },
      } as any,
    };
  });

  it("should return 200 and user data on successful login", async () => {
    const mockUser = { id: "123", email: "test@example.com" };
    vi.mocked(mockContext.locals!.supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: mockUser, session: {} as any },
      error: null,
    });

    const response = await POST(mockContext as APIContext);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      data: {
        user: {
          id: "123",
          email: "test@example.com",
        },
      },
    });
  });
});
```

### 11.3. Przykładowy test middleware
```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import { onRequest } from "./index";

describe("Auth Middleware", () => {
  it("should redirect logged in user from /auth/login to /generate", async () => {
    const mockRedirect = vi.fn();
    const mockNext = vi.fn();
    
    const context = {
      locals: {
        user: { id: "123", email: "test@example.com" },
        supabase: { auth: { getUser: vi.fn() } },
      },
      url: new URL("http://localhost/auth/login"),
      redirect: mockRedirect,
    } as any;

    await onRequest(context, mockNext);

    expect(mockRedirect).toHaveBeenCalledWith("/generate");
    expect(mockNext).not.toHaveBeenCalled();
  });
});
```

## 12. Kontakt i wsparcie

**Właściciel dokumentu:** Team Lead / Senior Developer  
**Ostatnia aktualizacja:** {{ data utworzenia dokumentu }}  
**Pytania i uwagi:** [Link do Discussions/Issues w repozytorium]

---

**Legenda priorytetów:**
- 🔴 **Krytyczny:** Blokuje podstawową funkcjonalność, musi być zaimplementowane przed wdrożeniem
- 🟠 **Wysoki:** Ważne dla bezpieczeństwa i jakości, powinno być zaimplementowane w bieżącym sprincie
- 🟡 **Średni:** Zwiększa pewność jakości, może być zaimplementowane w następnym sprincie
- 🟢 **Niski:** Nice-to-have, można zaimplementować gdy będzie czas

**Status implementacji:** ⬜ Niezaczęte | 🟦 W trakcie | ✅ Ukończone

