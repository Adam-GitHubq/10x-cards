# Testy E2E z Playwright

Ten katalog zawiera testy end-to-end (E2E) dla aplikacji 10xCards.

## 🚀 Szybki start

**Pierwszy raz?** Zobacz [QUICKSTART.md](./QUICKSTART.md) - kompletny przewodnik w 2 minuty.

**TL;DR:**
```bash
npm run supabase:start  # Uruchom lokalną bazę (pierwszy raz)
npm run test:e2e        # Uruchom testy
```

## Struktura katalogów

```
e2e/
├── pages/          # Page Objects - reprezentacja stron aplikacji
├── fixtures/       # Fixtures - rozszerzenia testów i współdzielona konfiguracja
├── tests/          # Pliki testowe
└── README.md       # Ten plik
```

## Page Object Model (POM)

Page Object Model to wzorzec projektowy, który:
- Enkapsuluje strukturę strony w osobnej klasie
- Zwiększa czytelność testów
- Ułatwia utrzymanie testów przy zmianach w UI
- Promuje reużywalność kodu

### Przykład Page Object

```typescript
export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  
  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel('Email');
  }
  
  async login(email: string, password: string) {
    // implementacja
  }
}
```

## Przygotowanie środowiska testowego

Testy e2e używają **lokalnej instancji Supabase** aby nie mieszać danych testowych z danymi deweloperskimi.

### Pierwszy raz - uruchom Supabase Local:

```bash
# Uruchom lokalną instancję Supabase (PostgreSQL + Auth + API)
npm run supabase:start
```

To polecenie:
- Pobierze obrazy Docker (pierwszym razem)
- Uruchomi lokalną bazę PostgreSQL na porcie 54322
- Uruchomi Supabase API na porcie 54321
- Zastosuje wszystkie migracje z `supabase/migrations/`

**Uwaga**: Supabase Local działa w tle. Możesz go zatrzymać przez `npm run supabase:stop`

## Uruchamianie testów

```bash
# Uruchom wszystkie testy e2e
npm run test:e2e

# Uruchom testy w trybie UI (interaktywny)
npm run test:e2e:ui

# Uruchom testy w trybie debug
npm run test:e2e:debug

# Wyświetl raport z ostatnich testów
npm run test:e2e:report

# Reset bazy testowej (usuń wszystkie dane i zastosuj migracje ponownie)
npm run supabase:reset
```

## Pisanie testów

### 1. Utwórz Page Object

```typescript
// e2e/pages/MyPage.ts
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class MyPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }
  
  async navigate() {
    await this.goto('/my-path');
  }
}
```

### 2. Dodaj fixture (opcjonalne)

```typescript
// e2e/fixtures/my.fixture.ts
import { test as base } from '@playwright/test';
import { MyPage } from '../pages/MyPage';

type MyFixtures = {
  myPage: MyPage;
};

export const test = base.extend<MyFixtures>({
  myPage: async ({ page }, use) => {
    await use(new MyPage(page));
  },
});

export { expect } from '@playwright/test';
```

### 3. Napisz test

```typescript
// e2e/tests/my-feature.spec.ts
import { test, expect } from '../fixtures/my.fixture';

test.describe('Moja funkcjonalność', () => {
  test('powinien wykonać akcję', async ({ myPage }) => {
    await myPage.navigate();
    // asercje
  });
});
```

## Best Practices

1. **Używaj Page Objects** - Nie odwołuj się bezpośrednio do elementów w testach
2. **Izoluj testy** - Każdy test powinien być niezależny
3. **Używaj fixtures** - Do współdzielenia konfiguracji między testami
4. **Opisowe nazwy** - Testy powinny jasno opisywać co testują
5. **Arrange-Act-Assert** - Struktura testów: przygotuj → wykonaj → sprawdź
6. **Resilient selectors** - Używaj getByRole, getByLabel zamiast CSS selectors
7. **Wait strategically** - Używaj waitForLoadState, waitForURL zamiast arbitrary timeouts

## Konfiguracja

Konfiguracja Playwright znajduje się w `playwright.config.ts` w katalogu głównym projektu.

### Główne ustawienia:
- **Browser**: Tylko Chromium (Desktop Chrome)
- **Base URL**: http://localhost:3001 (dedykowany port dla testów e2e)
- **Database**: Supabase Local na http://127.0.0.1:54321 (izolowana od dev/prod)
- **Parallel execution**: Włączone
- **Retries**: 2 na CI, 0 lokalnie
- **Screenshots**: Tylko przy błędach
- **Videos**: Tylko przy błędach
- **Traces**: Przy powtórzeniach

### Izolacja środowiska testowego:

Testy e2e są w pełni odizolowane od środowiska deweloperskiego:

| Aspekt | Dev | E2E Tests |
|--------|-----|-----------|
| Port aplikacji | 3000 | 3001 |
| Baza danych | Produkcyjna/Dev Supabase | Supabase Local (127.0.0.1:54321) |
| Zmienne środowiskowe | `.env` | `TEST_ENV` w `playwright.config.ts` |

**Zalety**:
- ✅ Dane testowe nie mieszają się z danymi deweloperskimi
- ✅ Można uruchomić dev server i testy jednocześnie
- ✅ Szybkie resetowanie bazy testowej (`npm run supabase:reset`)
- ✅ Pełna kontrola nad danymi testowymi

## Debugowanie

```bash
# Tryb debug z Playwright Inspector
npm run test:e2e:debug

# Wyświetl trace viewer dla konkretnego testu
npx playwright show-trace trace.zip
```

## CI/CD

Testy e2e są uruchamiane automatycznie w pipeline CI/CD przy każdym push do głównej gałęzi.

