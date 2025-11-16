# Testy E2E z Playwright

Ten katalog zawiera testy end-to-end (E2E) dla aplikacji 10xCards.

## 🚀 Szybki start

**Pierwszy raz?** Skonfiguruj `.env.test` z danymi do zewnętrznego Supabase (zobacz sekcję "Przygotowanie środowiska testowego").

**TL;DR:**
```bash
# 1. Utwórz plik .env.test z danymi do Supabase testowego
# 2. Uruchom testy
npm run test:e2e
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

Testy e2e używają **zewnętrznej instancji Supabase** - dedykowanej bazy testowej w chmurze.

### Konfiguracja środowiska testowego

1. **Utwórz plik `.env.test`** w głównym katalogu projektu:
```bash
# Skopiuj strukturę z .env.example
SUPABASE_URL=https://twoj-projekt-testowy.supabase.co
SUPABASE_KEY=twoj-anon-key-testowy
OPENROUTER_API_KEY=twoj-openrouter-key
E2E_USERNAME_ID=uuid-uzytkownika-testowego
E2E_USERNAME=test@example.com
E2E_PASSWORD=test-password-123
```

2. **Przygotuj bazę testową w Supabase**:
   - Utwórz dedykowany projekt Supabase dla testów E2E
   - Zastosuj migracje z `supabase/migrations/` (możesz użyć Supabase CLI lub Dashboard)
   - Utwórz użytkownika testowego:
     - Email: wartość z E2E_USERNAME
     - Hasło: wartość z E2E_PASSWORD
   - Skopiuj UUID użytkownika do E2E_USERNAME_ID (znajdziesz w Authentication > Users)

3. **Uruchom testy**:
```bash
# Playwright automatycznie uruchomi serwer dev w trybie testowym
npm run test:e2e

# Lub uruchom serwer ręcznie w jednym terminalu:
npm run dev:e2e

# I testy w drugim terminalu:
npm run test:e2e
```

**Ważne**:
- Plik `.env.test` jest ignorowany przez git - **nie commituj danych dostępowych!**
- Vite automatycznie ładuje `.env.test` gdy mode jest ustawiony na `test`
- Playwright uruchamia serwer z `npm run dev:e2e` (tryb test) przed testami
- Używaj dedykowanego projektu Supabase tylko dla testów, aby nie mieszać danych testowych z produkcyjnymi

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
```

**Uwaga**: Jeśli potrzebujesz zresetować dane testowe, zrób to bezpośrednio w Supabase Dashboard lub użyj Supabase CLI dla swojego projektu testowego.

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
- **Database**: Zewnętrzny Supabase (konfiguracja w `.env.test`)
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
| Baza danych | Produkcyjna/Dev Supabase | Dedykowany projekt Supabase testowy |
| Zmienne środowiskowe | `.env` | `.env.test` (ładowane przez Vite i Playwright) |
| Tryb Astro | `development` | `test` |

**Zalety**:
- ✅ Dane testowe nie mieszają się z danymi deweloperskimi ani produkcyjnymi
- ✅ Można uruchomić dev server i testy jednocześnie (różne porty)
- ✅ Dedykowany projekt Supabase tylko dla testów
- ✅ Pełna kontrola nad danymi testowymi
- ✅ Realistyczne środowisko testowe (prawdziwa baza w chmurze)

## Debugowanie

```bash
# Tryb debug z Playwright Inspector
npm run test:e2e:debug

# Wyświetl trace viewer dla konkretnego testu
npx playwright show-trace trace.zip
```

## CI/CD

Testy e2e są uruchamiane automatycznie w pipeline CI/CD przy każdym push do głównej gałęzi.

