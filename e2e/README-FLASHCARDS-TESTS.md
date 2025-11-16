# Dokumentacja testów E2E dla modułu Fiszek

## 1. Przegląd

Niniejszy dokument opisuje testy E2E (End-to-End) dla modułu zarządzania fiszkami w aplikacji 10xCards. Testy obejmują pełny zakres funkcjonalności: operacje CRUD, filtrowanie, sortowanie oraz paginację.

> **Ważne:** Testy E2E używają adaptera Node zamiast Cloudflare. Zobacz [ADAPTER-CONFIGURATION.md](../docs/ADAPTER-CONFIGURATION.md) dla szczegółów konfiguracji.

## 2. Struktura testów

### 2.1. Pliki testowe

```
e2e/
├── fixtures/
│   └── auth.fixture.ts          # Fixture z FlashcardsPage
├── pages/
│   ├── BasePage.ts              # Klasa bazowa
│   ├── FlashcardsPage.ts        # Page Object dla fiszek
│   ├── LoginPage.ts             # Page Object dla logowania
│   └── GeneratePage.ts          # Page Object dla generowania
└── tests/
    ├── flashcards-crud.spec.ts       # Testy CRUD
    ├── flashcards-filters.spec.ts    # Testy filtrowania i sortowania
    └── flashcards-pagination.spec.ts # Testy paginacji
```

### 2.2. Komponenty z selektorami testowymi

Wszystkie komponenty modułu fiszek zostały wzbogacone o atrybuty `data-testid`:

#### FlashcardsTable
- `flashcards-table` - kontener tabeli
- `flashcards-sort-button` - przycisk sortowania
- `flashcard-row-{id}` - wiersz fiszki
- `flashcard-front-{id}` - tekst przodu fiszki
- `flashcard-back-{id}` - tekst tyłu fiszki
- `flashcard-generation-{id}` - ID generacji fiszki
- `flashcard-edit-button-{id}` - przycisk edycji
- `flashcard-delete-button-{id}` - przycisk usunięcia

#### HeaderActions
- `flashcards-add-button` - przycisk dodawania fiszki

#### FiltersBar
- `flashcards-filters` - kontener filtrów
- `flashcards-filter-source` - select źródła
- `flashcards-filter-order` - select kolejności
- `flashcards-filter-reset` - przycisk resetowania filtrów

#### Pagination
- `flashcards-pagination` - kontener paginacji
- `flashcards-pagination-info` - informacja o zakresie (np. "Wyświetlanie 1–10 z 25")
- `flashcards-pagination-current` - aktualna strona (np. "Strona 1 / 3")
- `flashcards-pagination-prev` - przycisk poprzedniej strony
- `flashcards-pagination-next` - przycisk następnej strony

#### CreateFlashcardDialog
- `create-flashcard-dialog` - kontener dialogu
- `create-flashcard-front` - pole przodu fiszki
- `create-flashcard-back` - pole tyłu fiszki
- `create-flashcard-front-error` - komunikat błędu przodu
- `create-flashcard-back-error` - komunikat błędu tyłu
- `create-flashcard-error` - ogólny komunikat błędu
- `create-flashcard-submit` - przycisk zapisu
- `create-flashcard-cancel` - przycisk anulowania

#### EditFlashcardDialog
- `edit-flashcard-dialog` - kontener dialogu
- `edit-flashcard-loading` - stan ładowania
- `edit-flashcard-front` - pole przodu fiszki
- `edit-flashcard-back` - pole tyłu fiszki
- `edit-flashcard-front-error` - komunikat błędu przodu
- `edit-flashcard-back-error` - komunikat błędu tyłu
- `edit-flashcard-error` - ogólny komunikat błędu
- `edit-flashcard-submit` - przycisk zapisu
- `edit-flashcard-cancel` - przycisk anulowania

#### DeleteFlashcardAlert
- `delete-flashcard-alert` - kontener alertu
- `delete-flashcard-confirm` - przycisk potwierdzenia
- `delete-flashcard-cancel` - przycisk anulowania

## 3. Page Object Model - FlashcardsPage

### 3.1. Główne metody

#### Nawigacja
```typescript
await flashcardsPage.navigate()
```
Przechodzi do strony `/flashcards` i czeka na załadowanie.

#### Tworzenie fiszek
```typescript
await flashcardsPage.createFlashcard(front: string, back: string)
```
Otwiera dialog, wypełnia formularz i tworzy nową fiszkę.

```typescript
await flashcardsPage.openCreateDialog()
```
Otwiera dialog tworzenia fiszki.

#### Edycja fiszek
```typescript
await flashcardsPage.editFlashcard(id: number, front: string, back: string)
```
Otwiera dialog edycji, aktualizuje dane i zapisuje zmiany.

```typescript
await flashcardsPage.openEditDialog(id: number)
```
Otwiera dialog edycji dla konkretnej fiszki.

#### Usuwanie fiszek
```typescript
await flashcardsPage.deleteFlashcard(id: number)
```
Otwiera alert potwierdzenia i usuwa fiszkę.

```typescript
await flashcardsPage.cancelDelete()
```
Anuluje usuwanie fiszki.

#### Filtrowanie
```typescript
await flashcardsPage.setSourceFilter(source: "all" | "manual" | "ai-full" | "ai-edited")
```
Ustawia filtr źródła fiszek.

```typescript
await flashcardsPage.setGenerationIdFilter(generationId: string)
```
Ustawia filtr ID generacji (z debounce 1500ms).

```typescript
await flashcardsPage.setOrderFilter(order: "asc" | "desc")
```
Ustawia kolejność sortowania.

```typescript
await flashcardsPage.resetFilters()
```
Resetuje wszystkie filtry do wartości domyślnych.

#### Sortowanie
```typescript
await flashcardsPage.toggleSort()
```
Przełącza sortowanie między rosnącym a malejącym.

#### Paginacja
```typescript
await flashcardsPage.goToNextPage()
```
Przechodzi do następnej strony.

```typescript
await flashcardsPage.goToPreviousPage()
```
Przechodzi do poprzedniej strony.

```typescript
await flashcardsPage.canGoToNextPage(): Promise<boolean>
```
Sprawdza czy można przejść do następnej strony.

```typescript
await flashcardsPage.canGoToPreviousPage(): Promise<boolean>
```
Sprawdza czy można przejść do poprzedniej strony.

#### Pomocnicze metody odczytu
```typescript
await flashcardsPage.hasFlashcard(id: number): Promise<boolean>
```
Sprawdza czy fiszka istnieje na liście.

```typescript
await flashcardsPage.getFlashcardsCount(): Promise<number>
```
Zwraca liczbę widocznych fiszek.

```typescript
await flashcardsPage.getPaginationInfo(): Promise<string>
```
Zwraca informację o zakresie (np. "Wyświetlanie 1–10 z 25").

```typescript
await flashcardsPage.getCurrentPage(): Promise<string>
```
Zwraca aktualną stronę (np. "Strona 1 / 3").

```typescript
await flashcardsPage.hasEmptyState(): Promise<boolean>
```
Sprawdza czy wyświetlany jest komunikat o pustej liście.

```typescript
await flashcardsPage.getCreateDialogError(field: "front" | "back"): Promise<string | null>
```
Zwraca komunikat błędu walidacji w dialogu tworzenia.

```typescript
await flashcardsPage.getEditDialogError(field: "front" | "back"): Promise<string | null>
```
Zwraca komunikat błędu walidacji w dialogu edycji.

## 4. Scenariusze testowe

### 4.1. Testy CRUD (flashcards-crud.spec.ts)

#### Tworzenie fiszek
- **TC-E2E-FLASHCARD-CREATE-01**: Otwarcie dialogu tworzenia
- **TC-E2E-FLASHCARD-CREATE-02**: Utworzenie fiszki z poprawnymi danymi
- **TC-E2E-FLASHCARD-CREATE-03**: Walidacja pustego przodu
- **TC-E2E-FLASHCARD-CREATE-04**: Walidacja pustego tyłu
- **TC-E2E-FLASHCARD-CREATE-05**: Walidacja limitu znaków przodu (200)
- **TC-E2E-FLASHCARD-CREATE-06**: Walidacja limitu znaków tyłu (500)
- **TC-E2E-FLASHCARD-CREATE-07**: Anulowanie tworzenia

#### Edycja fiszek
- **TC-E2E-FLASHCARD-EDIT-01**: Otwarcie dialogu edycji
- **TC-E2E-FLASHCARD-EDIT-02**: Załadowanie danych fiszki w formularzu
- **TC-E2E-FLASHCARD-EDIT-03**: Aktualizacja fiszki z nowymi danymi
- **TC-E2E-FLASHCARD-EDIT-04**: Walidacja pustego przodu
- **TC-E2E-FLASHCARD-EDIT-05**: Anulowanie edycji

#### Usuwanie fiszek
- **TC-E2E-FLASHCARD-DELETE-01**: Otwarcie alertu potwierdzenia
- **TC-E2E-FLASHCARD-DELETE-02**: Usunięcie fiszki po potwierdzeniu
- **TC-E2E-FLASHCARD-DELETE-03**: Anulowanie usuwania

#### Odczyt i wyświetlanie
- **TC-E2E-FLASHCARD-READ-01**: Wyświetlenie listy fiszek
- **TC-E2E-FLASHCARD-READ-02**: Wyświetlenie szczegółów w wierszu tabeli
- **TC-E2E-FLASHCARD-READ-03**: Komunikat o pustej liście

### 4.2. Testy filtrowania i sortowania (flashcards-filters.spec.ts)

#### Filtrowanie po źródle
- **TC-E2E-FLASHCARD-FILTER-SOURCE-01**: Domyślne wyświetlanie wszystkich fiszek
- **TC-E2E-FLASHCARD-FILTER-SOURCE-02**: Filtrowanie fiszek manualnych
- **TC-E2E-FLASHCARD-FILTER-SOURCE-03**: Resetowanie filtra źródła
- **TC-E2E-FLASHCARD-FILTER-SOURCE-04**: Zachowanie filtra po odświeżeniu

#### Filtrowanie po ID generacji
- **TC-E2E-FLASHCARD-FILTER-GENERATION-01**: Filtrowanie po ID generacji
- **TC-E2E-FLASHCARD-FILTER-GENERATION-02**: Sanityzacja nieprawidłowych wartości
- **TC-E2E-FLASHCARD-FILTER-GENERATION-03**: Resetowanie filtra ID generacji

#### Sortowanie
- **TC-E2E-FLASHCARD-SORT-01**: Domyślne sortowanie malejące
- **TC-E2E-FLASHCARD-SORT-02**: Zmiana sortowania na rosnące
- **TC-E2E-FLASHCARD-SORT-03**: Przełączanie sortowania przyciskiem
- **TC-E2E-FLASHCARD-SORT-04**: Zachowanie sortowania po odświeżeniu

#### Kombinacja filtrów
- **TC-E2E-FLASHCARD-FILTER-COMBO-01**: Zastosowanie wielu filtrów
- **TC-E2E-FLASHCARD-FILTER-COMBO-02**: Resetowanie wszystkich filtrów
- **TC-E2E-FLASHCARD-FILTER-COMBO-03**: Zachowanie filtrów po odświeżeniu

#### Debouncing
- **TC-E2E-FLASHCARD-FILTER-DEBOUNCE-01**: Debounce przy wpisywaniu ID generacji (1500ms)

### 4.3. Testy paginacji (flashcards-pagination.spec.ts)

#### Podstawowa paginacja
- **TC-E2E-FLASHCARD-PAGINATION-01**: Wyświetlenie informacji o paginacji
- **TC-E2E-FLASHCARD-PAGINATION-02**: Wyświetlenie aktualnej strony
- **TC-E2E-FLASHCARD-PAGINATION-03**: Limit 10 fiszek na stronie
- **TC-E2E-FLASHCARD-PAGINATION-04**: Dezaktywacja przycisku poprzedniej strony
- **TC-E2E-FLASHCARD-PAGINATION-05**: Aktywacja przycisku następnej strony

#### Nawigacja między stronami
- **TC-E2E-FLASHCARD-PAGINATION-NAV-01**: Przejście do następnej strony
- **TC-E2E-FLASHCARD-PAGINATION-NAV-02**: Przejście do poprzedniej strony
- **TC-E2E-FLASHCARD-PAGINATION-NAV-03**: Aktualizacja zakresu przy zmianie strony
- **TC-E2E-FLASHCARD-PAGINATION-NAV-04**: Dezaktywacja na ostatniej stronie
- **TC-E2E-FLASHCARD-PAGINATION-NAV-05**: Aktywacja przycisku poprzedniej strony
- **TC-E2E-FLASHCARD-PAGINATION-NAV-06**: Zachowanie strony w URL
- **TC-E2E-FLASHCARD-PAGINATION-NAV-07**: Zachowanie strony po odświeżeniu

#### Paginacja z filtrami
- **TC-E2E-FLASHCARD-PAGINATION-FILTER-01**: Reset do strony 1 po zmianie filtra
- **TC-E2E-FLASHCARD-PAGINATION-FILTER-02**: Aktualizacja łącznej liczby
- **TC-E2E-FLASHCARD-PAGINATION-FILTER-03**: Zachowanie filtrów przy nawigacji

#### Edge cases
- **TC-E2E-FLASHCARD-PAGINATION-EDGE-01**: Dokładnie 10 fiszek
- **TC-E2E-FLASHCARD-PAGINATION-EDGE-02**: Mniej niż 10 fiszek
- **TC-E2E-FLASHCARD-PAGINATION-EDGE-03**: Ostatnia niepełna strona
- **TC-E2E-FLASHCARD-PAGINATION-EDGE-04**: Brak fiszek

#### Wydajność
- **TC-E2E-FLASHCARD-PAGINATION-PERF-01**: Szybkie przełączanie stron (< 3s)

## 5. Uruchamianie testów

### 5.1. Wymagania wstępne

1. Plik `.env.test` z konfiguracją:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
E2E_USERNAME=test@example.com
E2E_PASSWORD=testpassword123
```

2. Zainstalowane zależności:
```bash
npm install
```

### 5.2. Komendy uruchamiania

#### Wszystkie testy E2E
```bash
npm run test:e2e
```

#### Tylko testy fiszek
```bash
npx playwright test e2e/tests/flashcards-
```

#### Konkretny plik testowy
```bash
npx playwright test e2e/tests/flashcards-crud.spec.ts
```

#### Konkretny test
```bash
npx playwright test -g "TC-E2E-FLASHCARD-CREATE-02"
```

#### Tryb debug
```bash
npx playwright test --debug e2e/tests/flashcards-crud.spec.ts
```

#### Tryb headed (z widoczną przeglądarką)
```bash
npx playwright test --headed e2e/tests/flashcards-crud.spec.ts
```

#### Generowanie raportu
```bash
npx playwright test
npx playwright show-report
```

## 6. Best Practices

### 6.1. Izolacja testów
- Każdy test jest niezależny i tworzy własne dane testowe
- Używamy `beforeEach` do przygotowania środowiska
- Testy nie polegają na kolejności wykonania

### 6.2. Czekanie na odpowiedzi API
- Wszystkie metody Page Object czekają na odpowiedzi API
- Używamy `waitForResponse()` zamiast `waitForTimeout()` gdzie to możliwe
- Timeout ustawiony na 10 sekund dla operacji sieciowych

### 6.3. Selektory
- Priorytet: `data-testid` > role > text
- Unikamy selektorów CSS opartych na klasach Tailwind
- Używamy dynamicznych selektorów z ID (np. `flashcard-row-${id}`)

### 6.4. Asercje
- Używamy opisowych komunikatów błędów
- Sprawdzamy zarówno stan UI jak i URL
- Weryfikujemy efekty uboczne (np. zmiana liczby fiszek po usunięciu)

### 6.5. Dane testowe
- Używamy `Date.now()` do generowania unikalnych wartości
- Tworzymy minimalną ilość danych potrzebnych do testu
- Nie polegamy na istniejących danych w bazie

## 7. Debugowanie

### 7.1. Playwright Inspector
```bash
npx playwright test --debug
```
Umożliwia krokowe wykonywanie testów.

### 7.2. Trace Viewer
```bash
npx playwright test --trace on
npx playwright show-trace trace.zip
```
Wizualizacja wykonania testu z timelineem i snapshotami.

### 7.3. Screenshots i video
Automatycznie zapisywane przy błędach w `test-results/`.

### 7.4. Console logs
```typescript
page.on('console', msg => console.log(msg.text()));
```

## 8. Integracja z CI/CD

### 8.1. GitHub Actions (przykład)
```yaml
- name: Run E2E tests
  run: npm run test:e2e
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
    E2E_USERNAME: ${{ secrets.E2E_USERNAME }}
    E2E_PASSWORD: ${{ secrets.E2E_PASSWORD }}

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## 9. Pokrycie testowe

### 9.1. Funkcjonalności objęte testami
- ✅ Tworzenie fiszek (manualne)
- ✅ Edycja fiszek
- ✅ Usuwanie fiszek
- ✅ Wyświetlanie listy fiszek
- ✅ Filtrowanie po źródle
- ✅ Filtrowanie po ID generacji
- ✅ Sortowanie rosnące/malejące
- ✅ Paginacja (nawigacja, informacje)
- ✅ Walidacja formularzy
- ✅ Zachowanie stanu w URL
- ✅ Obsługa pustej listy

### 9.2. Funkcjonalności do rozszerzenia
- ⏳ Tworzenie fiszek AI (wymaga integracji z generowaniem)
- ⏳ Edycja źródła fiszki (obecnie niemożliwe przez API)
- ⏳ Bulk operations (zaznaczanie wielu fiszek)
- ⏳ Export/Import fiszek

## 10. Metryki jakości

### 10.1. Cele
- **Czas wykonania**: < 5 minut dla pełnej suity
- **Stabilność**: > 95% pass rate
- **Pokrycie**: > 80% krytycznych ścieżek użytkownika
- **Flakiness**: < 2% testów niestabilnych

### 10.2. Monitoring
- Śledzenie czasu wykonania testów
- Analiza przyczyn niepowodzeń
- Regularne przeglądy i aktualizacje testów

## 11. Utrzymanie testów

### 11.1. Aktualizacja przy zmianach UI
- Aktualizuj selektory w `FlashcardsPage.ts`
- Weryfikuj czy testy nadal przechodzą
- Dodaj nowe testy dla nowych funkcjonalności

### 11.2. Refactoring
- Wydzielaj wspólne metody do Page Objects
- Unikaj duplikacji kodu w testach
- Dokumentuj niestandardowe rozwiązania

### 11.3. Code review
- Sprawdzaj izolację testów
- Weryfikuj czytelność i opisowość testów
- Upewnij się że testy testują właściwe rzeczy

---

**Dokument utworzony:** 2025-11-16  
**Wersja:** 1.0  
**Autor:** AI QA Engineer  
**Status:** Gotowe do użycia

