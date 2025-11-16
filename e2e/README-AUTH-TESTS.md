# Testy E2E Autoryzacji

## Przegląd

Ten dokument opisuje testy end-to-end (E2E) dla modułu autoryzacji aplikacji 10xCards. Testy weryfikują pełny flow logowania, dostęp do chronionych stron, przekierowania oraz wylogowanie.

## Struktura testów

### Pliki testowe

- **`e2e/tests/auth.spec.ts`** - Kompleksowy test suite autoryzacji
- **`e2e/tests/login.spec.ts`** - Testy formularza logowania

### Page Objects

- **`e2e/pages/LoginPage.ts`** - Page Object dla strony logowania
- **`e2e/pages/GeneratePage.ts`** - Page Object dla chronionej strony generowania fiszek
- **`e2e/pages/BasePage.ts`** - Bazowa klasa dla wszystkich Page Objects

### Fixtures

- **`e2e/fixtures/auth.fixture.ts`** - Rozszerzone fixtures Playwright z:
  - `loginPage` - Instancja LoginPage
  - `generatePage` - Instancja GeneratePage
  - `authenticatedPage` - Automatycznie zalogowany użytkownik

## Konfiguracja

### Zmienne środowiskowe

Testy wymagają następujących zmiennych środowiskowych w pliku `.env.test`:

```env
E2E_USERNAME=test@example.com
E2E_PASSWORD=TestPassword123
E2E_USERNAME_ID=uuid-uzytkownika
```

**UWAGA:** Użytkownik testowy musi istnieć w bazie danych Supabase przed uruchomieniem testów.

### Selektory testowe

Komponenty UI zostały wzbogacone o atrybuty `data-testid` dla stabilności testów:

#### LoginForm
- `login-email-input` - Pole email
- `login-password-input` - Pole hasła
- `login-submit-button` - Przycisk logowania
- `login-status-message` - Komunikat statusu (sukces/błąd)

#### GenerateForm
- `generate-source-text` - Pole tekstowe źródła
- `generate-submit-button` - Przycisk generowania

## Scenariusze testowe

### 1. Logowanie z poprawnymi danymi

**Plik:** `auth.spec.ts`

- ✅ Logowanie i przekierowanie do `/generate`
- ✅ Wyświetlenie komunikatu sukcesu
- ✅ Zachowanie parametru `next` w URL

### 2. Dostęp do chronionych stron

**Plik:** `auth.spec.ts`

- ✅ Zalogowany użytkownik ma dostęp do `/generate`
- ✅ Zalogowany użytkownik ma dostęp do `/flashcards`
- ✅ Niezalogowany użytkownik przekierowany z `/generate` do `/auth/login`
- ✅ Niezalogowany użytkownik przekierowany z `/flashcards` z parametrem `next`

### 3. Przekierowania dla zalogowanych użytkowników

**Plik:** `auth.spec.ts`

- ✅ Przekierowanie z `/auth/login` do `/generate`
- ✅ Przekierowanie z `/auth/register` do `/generate`

### 4. Wylogowanie

**Plik:** `auth.spec.ts`

- ✅ Wylogowanie przez API i przekierowanie
- ✅ Unieważnienie sesji po wylogowaniu

### 5. Trwałość sesji

**Plik:** `auth.spec.ts`

- ✅ Sesja zachowana po odświeżeniu strony
- ✅ Sesja zachowana podczas nawigacji

### 6. Bezpieczeństwo

**Plik:** `auth.spec.ts`

- ✅ Odrzucenie nieprawidłowego hasła
- ✅ Odrzucenie nieistniejącego emaila
- ✅ Zabezpieczenie API bez autoryzacji

### 7. Formularz logowania

**Plik:** `login.spec.ts`

- ✅ Wyświetlenie formularza
- ✅ Walidacja pustych pól
- ✅ Błąd przy nieprawidłowych danych
- ✅ Pomyślne logowanie i przekierowanie

## Uruchamianie testów

### Wszystkie testy E2E

```bash
npm run test:e2e
```

### Tylko testy autoryzacji

```bash
npx playwright test auth.spec.ts
```

### Tylko testy logowania

```bash
npx playwright test login.spec.ts
```

### Tryb UI (interaktywny)

```bash
npx playwright test --ui
```

### Tryb debug

```bash
npx playwright test --debug
```

### Konkretny test

```bash
npx playwright test -g "powinien zalogować użytkownika"
```

## Użycie Fixtures

### Standardowy test (niezalogowany)

```typescript
test("test description", async ({ loginPage, page }) => {
  await loginPage.navigate();
  // ... test logic
});
```

### Test z automatycznym logowaniem

```typescript
test("test description", async ({ authenticatedPage, generatePage }) => {
  const { page } = authenticatedPage;
  // Użytkownik jest już zalogowany
  await generatePage.navigate();
  // ... test logic
});
```

## Page Object Model

### LoginPage

```typescript
// Nawigacja
await loginPage.navigate();

// Wypełnienie formularza
await loginPage.fillLoginForm(email, password);
await loginPage.submit();

// Lub w jednym kroku
await loginPage.login(email, password);

// Weryfikacja
await loginPage.waitForSuccessMessage();
await loginPage.waitForRedirect("/generate");
const hasError = await loginPage.hasErrorMessage();
const errorMessage = await loginPage.getErrorMessage();
```

### GeneratePage

```typescript
// Nawigacja
await generatePage.navigate();

// Weryfikacja
const isOnPage = await generatePage.isOnGeneratePage();
const hasAccess = await generatePage.hasAccess();
const isFormVisible = await generatePage.isGenerateFormVisible();

// Czekanie na załadowanie
await generatePage.waitForPageLoad();
```

## Dobre praktyki

### 1. Używaj data-testid zamiast selektorów tekstowych

❌ Źle:
```typescript
page.getByText("Zaloguj się")
```

✅ Dobrze:
```typescript
page.getByTestId("login-submit-button")
```

### 2. Używaj Page Objects

❌ Źle:
```typescript
await page.goto("/auth/login");
await page.fill("#email", email);
await page.fill("#password", password);
await page.click("button[type='submit']");
```

✅ Dobrze:
```typescript
await loginPage.navigate();
await loginPage.login(email, password);
```

### 3. Używaj fixtures dla powtarzalnych setupów

❌ Źle:
```typescript
test("test", async ({ page }) => {
  await page.goto("/auth/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click("button");
  await page.waitForURL("**/generate");
  // ... actual test
});
```

✅ Dobrze:
```typescript
test("test", async ({ authenticatedPage }) => {
  const { page } = authenticatedPage;
  // Użytkownik już zalogowany
  // ... actual test
});
```

### 4. Czekaj na stan sieciowy

```typescript
await page.waitForLoadState("networkidle");
```

### 5. Używaj timeout dla operacji asynchronicznych

```typescript
await page.waitForURL("**/generate", { timeout: 10000 });
```

## Debugowanie

### 1. Trace Viewer

Po nieudanym teście, otwórz trace:

```bash
npx playwright show-trace trace.zip
```

### 2. Screenshots

Screenshots są automatycznie zapisywane przy błędach w katalogu `test-results/`.

### 3. Video

Video jest nagrywane przy błędach (konfiguracja w `playwright.config.ts`).

### 4. Console logs

```typescript
page.on("console", (msg) => console.log(msg.text()));
```

## Troubleshooting

### Problem: Testy timeout

**Rozwiązanie:** Zwiększ timeout w `playwright.config.ts` lub w konkretnym teście:

```typescript
test("test", async ({ page }) => {
  test.setTimeout(60000); // 60 sekund
});
```

### Problem: Użytkownik testowy nie istnieje

**Rozwiązanie:** Utwórz użytkownika w Supabase Dashboard lub przez API:

```bash
# Dodaj użytkownika przez Supabase Dashboard
# Authentication > Users > Add User
```

### Problem: Sesja nie jest zachowana

**Rozwiązanie:** Sprawdź czy cookies są prawidłowo ustawiane:

```typescript
const cookies = await page.context().cookies();
console.log(cookies);
```

### Problem: Przekierowania nie działają

**Rozwiązanie:** Sprawdź middleware w `src/middleware/index.ts` i logi serwera.

## Metryki i pokrycie

### Pokrycie testowe

Obecne testy pokrywają:
- ✅ 100% krytycznych ścieżek autoryzacji
- ✅ Wszystkie przekierowania middleware
- ✅ Obsługę błędów logowania
- ✅ Trwałość sesji
- ✅ Zabezpieczenia API

### Czas wykonania

- Pojedynczy test: ~2-5 sekund
- Cały suite `auth.spec.ts`: ~30-45 sekund
- Wszystkie testy E2E: ~1-2 minuty

## Przyszłe rozszerzenia

### Planowane testy

- [ ] Testy rejestracji użytkownika
- [ ] Testy resetu hasła
- [ ] Testy usuwania konta
- [ ] Testy weryfikacji email
- [ ] Testy rate limiting
- [ ] Testy równoczesnych sesji

### Planowane Page Objects

- [ ] RegisterPage
- [ ] ResetPasswordPage
- [ ] FlashcardsPage
- [ ] SettingsPage

## Kontakt

W razie pytań lub problemów, sprawdź:
- [Playwright Documentation](https://playwright.dev)
- [PRD projektu](.ai/prd.md)
- [Plan testów autoryzacji](.ai/tests/test-auth-plan.md)

