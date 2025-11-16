# Testy Jednostkowe z Vitest

Ten katalog zawiera testy jednostkowe dla aplikacji 10xCards.

## Struktura testów

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
│   │       └── service.test.ts
│   └── utils/
│       └── __tests__/
│           └── utils.test.ts
```

## Uruchamianie testów

```bash
# Uruchom testy w trybie watch (rekomendowane podczas development)
npm run test

# Uruchom testy z interfejsem UI
npm run test:ui

# Uruchom testy jednokrotnie (przydatne na CI)
npm run test:run

# Uruchom testy z pokryciem kodu
npm run test:coverage
```

## Struktura testów

### Arrange-Act-Assert Pattern

```typescript
describe('MyComponent', () => {
  it('powinien wykonać akcję', () => {
    // Arrange - przygotowanie
    const mockFn = vi.fn();
    render(<MyComponent onClick={mockFn} />);
    
    // Act - wykonanie akcji
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Assert - sprawdzenie rezultatu
    expect(mockFn).toHaveBeenCalled();
  });
});
```

## Testowanie komponentów React

### Podstawowy test komponentu

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('powinien renderować tekst', () => {
    render(<MyComponent text="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Testowanie interakcji użytkownika

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyForm } from '../MyForm';

describe('MyForm', () => {
  it('powinien obsłużyć submit formularza', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    
    render(<MyForm onSubmit={handleSubmit} />);
    
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(handleSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
  });
});
```

## Mockowanie

### Mockowanie funkcji

```typescript
import { vi } from 'vitest';

const mockFn = vi.fn();
mockFn('arg1', 'arg2');

expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
expect(mockFn).toHaveBeenCalledTimes(1);
```

### Mockowanie modułów

```typescript
// Na górze pliku testowego
vi.mock('../api/client', () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: 'mocked' })),
}));

// W teście
import { fetchData } from '../api/client';

it('powinien użyć zmockowanego API', async () => {
  const result = await fetchData();
  expect(result.data).toBe('mocked');
});
```

### Mockowanie z dynamiczną implementacją

```typescript
import { vi } from 'vitest';

const mockFn = vi.fn();

mockFn.mockImplementation(() => 'custom value');
mockFn.mockReturnValue('static value');
mockFn.mockResolvedValue('async value');
mockFn.mockRejectedValue(new Error('error'));
```

### Spy na istniejących funkcjach

```typescript
import { vi } from 'vitest';
import * as utils from '../utils';

const spy = vi.spyOn(utils, 'myFunction');

// Funkcja działa normalnie, ale możesz śledzić wywołania
utils.myFunction();
expect(spy).toHaveBeenCalled();

spy.mockRestore(); // Przywróć oryginalną implementację
```

## Testowanie hoków

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

describe('useMyHook', () => {
  it('powinien zwrócić dane', async () => {
    const { result } = renderHook(() => useMyHook());
    
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});
```

## Snapshoty (używaj ostrożnie)

```typescript
import { render } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

it('powinien pasować do snapshota', () => {
  const { container } = render(<MyComponent />);
  expect(container).toMatchInlineSnapshot(`
    <div>
      <h1>Title</h1>
    </div>
  `);
});
```

## Best Practices

1. **Testuj zachowanie, nie implementację** - Skup się na tym co komponent robi, nie jak to robi
2. **Używaj screen queries** - `screen.getByRole()` zamiast `container.querySelector()`
3. **Preferuj getByRole** - Najbardziej dostępne queries: `getByRole`, `getByLabelText`, `getByPlaceholderText`
4. **Async/Await dla interakcji** - Zawsze używaj `async/await` z `userEvent`
5. **Cleanup jest automatyczny** - Dzięki `vitest.setup.ts` nie musisz ręcznie czyścić
6. **Mock tylko co konieczne** - Nie mockuj wszystkiego, testuj jak najwięcej rzeczywistego kodu
7. **Opisowe nazwy testów** - Test powinien dokumentować zachowanie
8. **Jeden koncept na test** - Test powinien sprawdzać jedną rzecz

## Query Priorities (Testing Library)

1. **Queries dostępne dla wszystkich:**
   - `getByRole` - najlepszy wybór
   - `getByLabelText` - dla formularzy
   - `getByPlaceholderText`
   - `getByText`
   - `getByDisplayValue`

2. **Semantic Queries:**
   - `getByAltText` - dla obrazów
   - `getByTitle`

3. **Test IDs (last resort):**
   - `getByTestId` - używaj tylko gdy nie ma lepszej opcji

## Debugging

```typescript
import { screen, render } from '@testing-library/react';

// Wyświetl aktualny DOM
screen.debug();

// Wyświetl konkretny element
screen.debug(screen.getByRole('button'));

// Wyświetl wszystkie dostępne role
screen.logTestingPlaygroundURL();
```

## Przykłady z projektu

Zobacz przykładowe testy w:
- `src/components/ui/__tests__/Button.test.tsx` - testowanie komponentu UI
- `src/lib/utils/__tests__/cn.test.ts` - testowanie utility functions
- `src/lib/services/__tests__/` - testowanie serwisów

## Workspace Vitest

Projekt używa Vitest workspace do separacji różnych typów testów:
- **unit** - szybkie testy jednostkowe
- **integration** - testy integracyjne (dłuższy timeout)

Konfiguracja znajduje się w `vitest.workspace.ts`.

