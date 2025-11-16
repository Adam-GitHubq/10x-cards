# Środowisko Testowe - 10xCards

Dokumentacja środowiska testowego dla projektu 10xCards.

## Przegląd

Projekt wykorzystuje dwa główne narzędzia do testowania:
- **Vitest** - do testów jednostkowych (unit tests)
- **Playwright** - do testów end-to-end (e2e tests)

## 🧪 Testy Jednostkowe (Vitest)

### Konfiguracja

- **Framework**: Vitest v4
- **Environment**: happy-dom (dla testowania komponentów React - szybszy niż jsdom)
- **Testing Library**: @testing-library/react + @testing-library/user-event
- **Assertions**: @testing-library/jest-dom

### Pliki konfiguracyjne

- `vitest.config.ts` - główna konfiguracja Vitest
- `vitest.setup.ts` - setup file z globalnymi mockami i konfiguracją
- `vitest.workspace.ts` - workspace dla różnych typów testów (unit/integration)

### Uruchamianie testów

```bash
# Tryb watch (rekomendowany podczas development)
npm run test

# UI mode - wizualne przeglądanie testów
npm run test:ui

# Jednokrotne uruchomienie (CI/CD)
npm run test:run

# Z pokryciem kodu
npm run test:coverage
```

### Struktura testów

Testy jednostkowe znajdują się w katalogach `__tests__` obok testowanego kodu:

```
src/
├── components/
│   └── ui/
│       ├── __tests__/
│       │   └── Button.test.tsx
│       └── button.tsx
├── lib/
│   ├── services/
│   │   └── __tests__/
│   │       ├── service.test.ts
│   │       └── service.integration.test.ts
│   └── utils/
│       └── __tests__/
│           └── utils.test.ts
```

### Przykłady testów

#### Test komponentu React

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button', () => {
  it('powinien wywoływać onClick', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Kliknij</Button>);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Test funkcji utility

```typescript
import { describe, it, expect } from 'vitest';
import { cn } from '../../utils';

describe('cn', () => {
  it('powinien łączyć klasy CSS', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });
});
```

### Dokumentacja

Szczegółowa dokumentacja testów jednostkowych: [`src/__tests__/README.md`](src/__tests__/README.md)

## 🎭 Testy E2E (Playwright)

### Konfiguracja

- **Framework**: Playwright
- **Browser**: Chromium (Desktop Chrome) - zgodnie z wytycznymi projektu
- **Pattern**: Page Object Model
- **Parallel**: Włączone

### Pliki konfiguracyjne

- `playwright.config.ts` - główna konfiguracja Playwright

### Uruchamianie testów

```bash
# Uruchom wszystkie testy e2e
npm run test:e2e

# UI mode - interaktywny tryb testowania
npm run test:e2e:ui

# Debug mode - debugowanie testów
npm run test:e2e:debug

# Wyświetl raport z ostatnich testów
npm run test:e2e:report
```

### Struktura testów

```
e2e/
├── pages/              # Page Objects
│   ├── BasePage.ts
│   └── LoginPage.ts
├── fixtures/           # Fixtures i rozszerzenia testów
│   └── auth.fixture.ts
├── tests/              # Pliki testowe
│   └── login.spec.ts
└── README.md          # Dokumentacja e2e
```

### Page Object Model

Każda strona aplikacji ma dedykowany Page Object:

```typescript
export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  
  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Hasło');
  }
  
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

### Przykład testu

```typescript
import { test, expect } from '../fixtures/auth.fixture';

test.describe('Logowanie', () => {
  test('powinien wyświetlić formularz', async ({ loginPage }) => {
    await loginPage.navigate();
    await expect(loginPage.page).toHaveTitle(/Login/i);
  });
});
```

### Dokumentacja

Szczegółowa dokumentacja testów e2e: [`e2e/README.md`](e2e/README.md)

## 📋 Best Practices

### Testy jednostkowe (Vitest)

1. ✅ Testuj zachowanie, nie implementację
2. ✅ Używaj `screen.getByRole()` - najbardziej dostępne queries
3. ✅ Preferuj `userEvent` nad `fireEvent`
4. ✅ Mock tylko to co konieczne
5. ✅ Używaj `describe` do grupowania powiązanych testów
6. ✅ Jeden koncept na test
7. ✅ Opisowe nazwy testów (powinien...)

### Testy E2E (Playwright)

1. ✅ Używaj Page Object Model
2. ✅ Izoluj testy - każdy test niezależny
3. ✅ Resilient selectors - `getByRole`, `getByLabel`
4. ✅ Wait strategically - `waitForLoadState`, nie arbitrary timeouts
5. ✅ Fixtures dla współdzielonej konfiguracji
6. ✅ Arrange-Act-Assert pattern

## 🛠️ Narzędzia Deweloperskie

### Vitest UI

```bash
npm run test:ui
```

Wizualne przeglądanie i debugowanie testów jednostkowych.

### Playwright UI Mode

```bash
npm run test:e2e:ui
```

Interaktywny tryb do uruchamiania i debugowania testów e2e.

### Playwright Inspector

```bash
npm run test:e2e:debug
```

Krokowe debugowanie testów e2e.

### Coverage Reports

```bash
npm run test:coverage
```

Generuje raport pokrycia kodu w `coverage/`.

## 📊 CI/CD

### GitHub Actions

Testy są automatycznie uruchamiane w CI/CD:
- Testy jednostkowe przy każdym push
- Testy e2e przy pull request i push do main

## 🔧 Troubleshooting

### Problem: "Cannot find module"

Sprawdź czy alias `@/*` jest poprawnie skonfigurowany w:
- `tsconfig.json`
- `vitest.config.ts`

### Problem: "Element not found" w Playwright

- Użyj `page.waitForLoadState('networkidle')`
- Sprawdź czy selector jest poprawny
- Użyj Playwright Inspector: `npm run test:e2e:debug`

### Problem: Testy jednostkowe nie widzą DOM

- Upewnij się że `environment: 'happy-dom'` w `vitest.config.ts`
- Sprawdź czy `vitest.setup.ts` jest załadowany

## 📚 Dodatkowe zasoby

- [Vitest Docs](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)

## 🎯 Roadmap

- [ ] Dodać przykładowe testy dla wszystkich głównych komponentów
- [ ] Skonfigurować CI/CD pipeline dla testów
- [ ] Dodać testy API
- [ ] Dodać visual regression testing
- [ ] Dodać accessibility testing

## 📝 Uwagi

- Testy jednostkowe są szybkie i powinny być uruchamiane często podczas development
- Testy e2e są wolniejsze - uruchamiaj przed commitem
- Pokrycie kodu to metryka pomocnicza, nie cel sam w sobie
- Priorytetyzuj testy krytycznych ścieżek użytkownika

