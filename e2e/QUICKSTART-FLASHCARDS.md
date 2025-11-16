# Quick Start - Testy E2E dla Fiszek

## Szybki start w 5 krokach

### 1. Konfiguracja środowiska

Utwórz plik `.env.test` w głównym katalogu projektu:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
E2E_USERNAME=test@example.com
E2E_PASSWORD=testpassword123
```

### 2. Instalacja zależności

```bash
npm install
npx playwright install chromium
```

### 3. Uruchom serwer deweloperski

```bash
npm run dev:e2e
```

Serwer uruchomi się na `http://localhost:3001`.

### 4. Uruchom testy

#### Wszystkie testy fiszek
```bash
npx playwright test e2e/tests/flashcards-
```

#### Konkretny plik
```bash
# Testy CRUD
npx playwright test e2e/tests/flashcards-crud.spec.ts

# Testy filtrowania
npx playwright test e2e/tests/flashcards-filters.spec.ts

# Testy paginacji
npx playwright test e2e/tests/flashcards-pagination.spec.ts
```

#### Z widoczną przeglądarką (headed mode)
```bash
npx playwright test e2e/tests/flashcards-crud.spec.ts --headed
```

### 5. Zobacz raport

```bash
npx playwright show-report
```

## Przykładowe użycie Page Object

```typescript
import { test, expect } from "../fixtures/auth.fixture";

test("Mój test fiszek", async ({ authenticatedPage, flashcardsPage }) => {
  // Przejdź do strony fiszek
  await flashcardsPage.navigate();

  // Utwórz fiszkę
  await flashcardsPage.createFlashcard("Pytanie", "Odpowiedź");

  // Sprawdź czy fiszka istnieje
  const count = await flashcardsPage.getFlashcardsCount();
  expect(count).toBeGreaterThan(0);
});
```

## Najczęstsze problemy

### Problem: Testy nie mogą się zalogować
**Rozwiązanie:** Sprawdź czy `E2E_USERNAME` i `E2E_PASSWORD` w `.env.test` są poprawne.

### Problem: Timeout przy ładowaniu strony
**Rozwiązanie:** Upewnij się że serwer deweloperski działa na porcie 3001.

### Problem: Testy są niestabilne
**Rozwiązanie:** Sprawdź czy Supabase jest dostępny i czy masz stabilne połączenie internetowe.

## Przydatne komendy

```bash
# Debug konkretnego testu
npx playwright test --debug -g "TC-E2E-FLASHCARD-CREATE-02"

# Uruchom tylko failed testy
npx playwright test --last-failed

# Generuj trace dla debugowania
npx playwright test --trace on

# Zobacz trace
npx playwright show-trace trace.zip
```

## Więcej informacji

- [README-FLASHCARDS-TESTS.md](./README-FLASHCARDS-TESTS.md) - Pełna dokumentacja
- [CHANGELOG-FLASHCARDS-TESTS.md](./CHANGELOG-FLASHCARDS-TESTS.md) - Historia zmian
- [Playwright Docs](https://playwright.dev/) - Oficjalna dokumentacja Playwright

