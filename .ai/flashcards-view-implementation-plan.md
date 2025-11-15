## Plan implementacji widoku Moje fiszki

## 1. Przegląd

Widok służy do przeglądania, filtrowania i zarządzania fiszkami użytkownika. Umożliwia:

- przegląd listy z paginacją,
- filtrowanie po `source` i `generationId`,
- sortowanie po `createdAt` (rosnąco/malejąco),
- edycję treści fiszek (z deep‑linkiem `?edit={id}`),
- usuwanie z potwierdzeniem,
- ręczne dodawanie fiszek.

Warstwy: strona Astro (`/flashcards`) + wyspa React. UI w oparciu o shadcn/ui i Tailwind. Walidacje pól zgodnie z API (front ≤200, back ≤500). Brak dedykowanych plików CSS. Rules of Hooks bez wyjątku. Powtarzalne wywołania HTTP przez cienką warstwę klienta API.

## 2. Routing widoku

- Ścieżka: `/flashcards`
- Plik strony: `src/pages/flashcards.astro` (mount wyspy React `FlashcardsView` na `client:load`)
- Deep‑link do edycji: `/flashcards?edit={id}`

## 3. Struktura komponentów

Drzewo (React):

- `FlashcardsView` (kontener widoku)
  - `FiltersBar`
    - `Select` (source)
    - `Input`/`Combobox` (generationId – liczba, z walidacją)
    - `Select` (order)
    - `Button` (Wyczyść)
  - `HeaderActions`
    - `Button` (Dodaj) → `CreateFlashcardDialog`
  - `ContentArea`
    - `FlashcardsTable`
      - `FlashcardsTableRow` (xN)
        - `SourceBadge`
        - `RowActions`
          - `Button` (Edytuj) → `EditFlashcardDialog`
          - `Button` (Usuń) → `DeleteFlashcardAlert`
    - `TableSkeleton` (stan ładowania)
    - `EmptyState` (gdy brak wyników)
  - `Pagination`
  - `Toaster` (toasty powiadomień)

Warstwa usług:

- `api/flashcards` (GET list, GET by id, POST, PUT, DELETE)
- Hooki: `useFlashcardsSearchParams`, `useFlashcardsQuery`, `useEditDialogState`, `useCreateFlashcard`, `useUpdateFlashcard`, `useDeleteFlashcard`

## 4. Szczegóły komponentów

### FlashcardsView

- Opis: Komponent kontener. Spina filtrację, pobranie danych, tabelę, paginację, dialogi i toasty. Synchronizuje stan filtrów z URL.
- Elementy: wrapper, `FiltersBar`, `HeaderActions`, `ContentArea`, `Pagination`, globalny `Toaster`.
- Interakcje:
  - Zmiana filtrów → aktualizacja URL → refetch listy.
  - Klik „Dodaj” → otwarcie `CreateFlashcardDialog`.
  - Odczyt parametru `?edit={id}` → otwarcie `EditFlashcardDialog` (prefetch fiszki jeśli brak w liście).
- Walidacja:
  - Normalizacja `page (≥1)`, `pageSize (10)`, `sort = "createdAt"`, `order ∈ {"asc","desc"}`.
  - `source ∈ {"manual","ai-full","ai-edited"}` lub pusty.
  - `generationId` musi być liczbą dodatnią (lub puste).
- Typy: `FlashcardsFiltersVM`, `FlashcardsListVM`, `ApiError`, `FlashcardDto`.
- Propsy: brak (główny widok).

### FiltersBar

- Opis: Pasek filtrów i sortowania.
- Elementy: `Select` (source), `Input type=number`/`Combobox` (generationId), `Select` (order), `Button` (Wyczyść).
- Interakcje:
  - OnChange pól → debounce (150–300 ms) → aktualizacja `searchParams` i refetch.
  - „Wyczyść” → reset do domyślnych.
- Walidacja:
  - `generationId` puste lub liczba całkowita ≥1.
  - `source` zgodnie z listą.
- Typy: `FlashcardsFiltersVM`.
- Propsy: `{ value: FlashcardsFiltersVM, onChange: (next) => void, busy?: boolean }`.

### HeaderActions

- Opis: Prawa część nagłówka z akcją dodawania.
- Elementy: `Button` (Dodaj).
- Interakcje: klik → `CreateFlashcardDialog`.
- Walidacja: n/d.
- Typy: n/d.
- Propsy: `{ onAdd: () => void }`.

### FlashcardsTable

- Opis: Tabela wyników.
- Elementy: `Table` z kolumnami: `front`, `back`, `source` (z `SourceBadge`), `generationId?`, `createdAt`, `actions`.
- Interakcje:
  - Klik „Edytuj” w wierszu → `EditFlashcardDialog`.
  - Klik „Usuń” w wierszu → `DeleteFlashcardAlert`.
  - Nagłówek `createdAt` przełącza `order` (asc/desc).
- Walidacja: prezentacja bez modyfikacji danych.
- Typy: `FlashcardRowVM`.
- Propsy: `{ items: FlashcardRowVM[], order: "asc"|"desc", onToggleOrder: () => void, onEdit: (id:number)=>void, onDelete:(id:number)=>void, busy?: boolean }`.

### FlashcardsTableRow

- Opis: Pojedynczy wiersz tabeli.
- Elementy: komórki + `RowActions`.
- Interakcje: delegowane do `RowActions`.
- Walidacja: n/d.
- Typy: `FlashcardRowVM`.
- Propsy: `{ item: FlashcardRowVM, onEdit:(id)=>void, onDelete:(id)=>void, busy?: boolean }`.

### SourceBadge

- Opis: Odznaka źródła.
- Elementy: `Badge` z mapowaniem koloru: manual (neutral), ai-full (primary), ai-edited (warning).
- Interakcje: n/d.
- Walidacja: `source` z dozwolonego zbioru.
- Typy: `FlashcardSource`.
- Propsy: `{ source: FlashcardSource }`.

### EditFlashcardDialog

- Opis: Modal edycji treści fiszki. Obsługuje deep‑link `?edit={id}`. Po zapisaniu odświeża wiersz w tabeli i ustawia `source='ai-edited'` dla kart AI.
- Elementy: `Dialog`, `Textarea` (front), `Textarea` (back), `Button` (Zapisz), `Button` (Anuluj).
- Interakcje:
  - Otwórz z parametru URL lub z przycisku w wierszu.
  - Zapis → PUT `/flashcards/:id`.
  - Zamknięcie przywraca focus do przycisku, który otworzył modal.
- Walidacja (frontend + API):
  - `front` 1..200, `back` 1..500.
  - Dla PUT: `source ∈ {"manual","ai-edited"}` (strategia: nie wysyłamy `source`, backend utrzyma lub zaktualizuje do `ai-edited` jeśli karta była AI i treść zmieniona; alternatywnie wyślij `source="ai-edited"` przy edycji treści karty AI).
- Typy: `UpdateFlashcardCommand`, `FlashcardDto`, `ApiError`.
- Propsy: `{ id: number|null, open: boolean, onOpenChange:(open:boolean)=>void, initial?: FlashcardDto }`.

### CreateFlashcardDialog

- Opis: Modal dodawania ręcznej fiszki.
- Elementy: `Dialog`, `Textarea` (front), `Textarea` (back), `Button` (Dodaj).
- Interakcje: Zapis → POST `/flashcards` z `source="manual"` i `generationId=null`.
- Walidacja: `front` 1..200, `back` 1..500.
- Typy: `CreateFlashcardsCommand`, `CreateFlashcardItemCommand`, `CreateFlashcardsResponseDto`, `ApiError`.
- Propsy: `{ open:boolean, onOpenChange:(open)=>void, onCreated:(created:FlashcardDto[])=>void }`.

### DeleteFlashcardAlert

- Opis: `AlertDialog` usuwania z potwierdzeniem.
- Elementy: `AlertDialog`, `Button` (Potwierdź), `Button` (Anuluj).
- Interakcje:
  - Potwierdź → `DELETE /flashcards/:id`.
  - Sukces → odśwież listę lub lokalnie usuń wiersz; pokaż toast o powodzeniu.
  - Błąd → pokaż toast błędu; element pozostaje.
- Walidacja: n/d.
- Typy: `ApiError`.
- Propsy: `{ id:number, open:boolean, onOpenChange:(open)=>void }`.

### Pagination

- Opis: Nawigacja stronami listy (10/strona).
- Elementy: przyciski „Poprzednia/Następna”, numery stron (opcjonalnie) i informacja o zakresie.
- Interakcje: zmiana `page` w URL → refetch.
- Walidacja: `page ≥ 1`, `page ≤ totalPages` (wyłącz przyciski, clamp).
- Typy: `PaginationDto`.
- Propsy: `{ page:number, pageSize:number, total:number, onPageChange:(p:number)=>void, busy?:boolean }`.

### EmptyState

- Opis: Pusty stan wyników.
- Elementy: ikonka, tekst, `Button` „Dodaj pierwszą fiszkę”.
- Interakcje: klik → otwarcie `CreateFlashcardDialog`.
- Propsy: `{ onAdd:()=>void }`.

### TableSkeleton

- Opis: Skeleton wierszy tabeli na czas ładowania.
- Propsy: `{ rows?:number }` (domyślnie 10).

## 5. Typy

Wykorzystujemy istniejące DTO z `src/types.ts` oraz uzupełniamy o lekkie ViewModel‑e do UI.

Istniejące (importowane):

- `FlashcardDto`, `ListFlashcardsResponseDto`, `CreateFlashcardsCommand`, `CreateFlashcardItemCommand`, `CreateFlashcardsResponseDto`, `UpdateFlashcardCommand`, `FlashcardListQueryParams`, `PaginationDto`, `FlashcardSource`.

Nowe typy UI:

```ts
// Filtry + sortowanie synchronizowane z URL
export type FlashcardsFiltersVM = {
  page: number; // ≥1
  pageSize: number; // stałe 10 w MVP (możliwa rozbudowa)
  sort: "createdAt"; // stałe w MVP
  order: "asc" | "desc";
  source?: FlashcardSource;
  generationId?: number;
};

// Rząd tabeli – powiększony o wartości sformatowane do UI
export type FlashcardRowVM = {
  id: number;
  front: string;
  back: string;
  source: FlashcardSource;
  generationId: number | null;
  createdAtISO: string;
  updatedAtISO: string;
  createdAtLabel: string; // Np. „2025‑11‑09 15:43”
};

// Odpowiedź listy przemapowana do UI
export type FlashcardsListVM = {
  items: FlashcardRowVM[];
  pagination: PaginationDto;
};

// Błąd API w jednolitym kształcie
export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};
```

## 6. Zarządzanie stanem

- Synchronizacja z URL: `useFlashcardsSearchParams` (parsuje, normalizuje, aktualizuje `history.pushState` bez przeładowania; debounce przy wpisywaniu).
- Pobranie listy: `useFlashcardsQuery(filters)` – `GET /flashcards`, zwraca `{ data, loading, error, refetch }`. Memoizacja parametrów zapobiega pętlom.
- Dialog edycji: `useEditDialogState()` – czyta/ustawia `?edit={id}`; przy otwarciu bez rekordu w liście robi `GET /flashcards/:id`.
- Mutacje:
  - `useCreateFlashcard()` – POST, po sukcesie: zamknij modal, pokaż toast, odśwież listę lub lokalnie wstaw rekord jeśli mieści się na bieżącej stronie.
  - `useUpdateFlashcard()` – PUT, po sukcesie: zamknij modal, zaktualizuj wiersz (i ewentualnie `source="ai-edited"`), pokaż toast.
  - `useDeleteFlashcard()` – DELETE, po sukcesie: odśwież listę; w razie błędu pokaż toast błędu.
- Globalne powiadomienia: `useToast` (shadcn).

## 7. Integracja API

Warstwa `src/lib/api/flashcards.ts` (fetch wrapper + mapowanie błędów do `ApiError`). Wszystkie żądania wysyłane z uwzględnieniem uwierzytelnienia (cookie/session). Błędy 401 → przekierowanie do logowania lub banner.

- `GET /flashcards`
  - Query: `page`, `pageSize=10`, `sort="createdAt"`, `order`, `source?`, `generationId?`
  - Res: `ListFlashcardsResponseDto`
- `GET /flashcards/:id`
  - Res: `FlashcardDto`
- `POST /flashcards`
  - Body: `CreateFlashcardsCommand` (w MVP 1 karta: `source="manual"`, `generationId=null`)
  - Res: `CreateFlashcardsResponseDto`
- `PUT /flashcards/:id`
  - Body: `UpdateFlashcardCommand` (front, back). Dla kart AI – po edycji traktuj jako `ai-edited` (ustalone po stronie serwera lub explicite wysyłane).
  - Res: `FlashcardDto`
- `DELETE /flashcards/:id`
  - Res: 204/200 (brak ciała)

## 8. Interakcje użytkownika

- Zmiana `source`/`generationId`/`order` → aktualizacja URL → refetch.
- Klik nagłówka `createdAt` → zmiana `order`.
- Klik „Dodaj” → modal dodawania → walidacja → POST → toast sukcesu → odświeżenie listy.
- Klik „Edytuj” (lub wejście na `?edit={id}`) → modal edycji → walidacja → PUT → aktualizacja wiersza i toast.
- Klik „Usuń” → potwierdzenie → (finalizacja DELETE).
- Paginacja: zmiana strony aktualizuje URL i listę.

## 9. Warunki i walidacja

- Filtry:
  - `page ≥ 1`, `pageSize=10`, `sort="createdAt"`, `order ∈ {"asc","desc"}`.
  - `source` tylko z dozwolonych wartości lub brak.
  - `generationId` puste albo liczba całkowita ≥1.
- Formularze (Create/Edit):
  - `front`: 1..200 znaków (trim).
  - `back`: 1..500 znaków (trim).
  - PUT: zachowaj `source` lub ustaw `ai-edited` dla edytowanych kart pochodzących z AI.
- Deep‑link `?edit={id}`: `id` liczba całkowita ≥1; błędne → zignoruj i usuń z URL.

## 10. Obsługa błędów

- 401 Unauthorized: pokaż komunikat i link do logowania lub przekieruj (jeśli globalny middleware nie przechwyci).
- 404 Not Found (GET/:id przy deep‑linku lub podczas edycji): zamknij modal, toast informujący, odśwież listę.
- 400 Bad Request (walidacja): pokaż błędy pól przy Create/Edit.
- Sieć/serwer 5xx: banner/ toast z opcją ponów.

## 11. Kroki implementacji

1. Strona i kontener

- Utwórz `src/pages/flashcards.astro` i zmontuj `FlashcardsView` (React, `client:load`).
- Przygotuj layout i kontener z Tailwind (responsywność, focus management).

2. API klient

- Dodaj `src/lib/api/flashcards.ts` z funkcjami: `listFlashcards`, `getFlashcard`, `createFlashcards`, `updateFlashcard`, `deleteFlashcard`.
- Standaryzuj obsługę błędów do `ApiError`.

3. Hooki stanu

- `useFlashcardsSearchParams` – parsowanie/normalizacja/aktualizacja URL.
- `useFlashcardsQuery` – pobieranie listy + mapowanie do `FlashcardsListVM`.
- `useEditDialogState` – synchronizacja `?edit` z dialogiem.
- Mutacje: `useCreateFlashcard`, `useUpdateFlashcard`.

4. Komponenty UI

- `FiltersBar`, `HeaderActions`, `FlashcardsTable`, `FlashcardsTableRow`, `SourceBadge`, `Pagination`, `EmptyState`, `TableSkeleton`.
- Dialogi: `CreateFlashcardDialog`, `EditFlashcardDialog`, `DeleteFlashcardAlert`.
- Skorzystaj z shadcn/ui (Dialog, AlertDialog, Button, Select, Badge, Toast, Table, Textarea). Jeśli brakuje – dołącz komponenty zgodnie z konwencją `src/components/ui`.

5. Integracja i przepływy

- Zepnij filtry z URL i `useFlashcardsQuery` (debounce zmian).
- Dodaj nagłówek sortowania `createdAt` (przełączanie `order`).
- Wdróż deep‑link `?edit={id}` (otwieranie edycji przy wejściu).

6. Walidacje i DX

- Walidacje formularzy (front/back) po stronie klienta (prosta walidacja długości + trim). Nie importuj serwerowych schematów do bundla frontu.
- Stan błędów z API mapowany do komunikatów przy polach i toastów.

7. UX i dostępność

- Focus restore po zamknięciu dialogów.
- Skeletony podczas ładowania; puste stany.
- Przyciski z `aria-label`, dialogi z poprawnymi rolami (shadcn).

8. Testy manualne (MVP)

- Filtry + paginacja + sort.
- Create/Edit/Delete (w tym deep‑link).
- 401/404/400 ścieżki błędów.

9. Porządki

- Przegląd pod kątem Rules of Hooks i stylów Tailwind.
- Lekka refaktoryzacja: early returny, brak zbędnych `else`.

## 12. Mapowanie na historyjki PRD

- US‑004: Widok listy (po generowaniu innego widoku) – tutaj zarządzanie zaakceptowanymi kartami (przegląd, edycja).
- US‑005: Edycja istniejących fiszek – `EditFlashcardDialog` + PUT + aktualizacja `source` do `ai-edited` dla kart AI.
- US‑006: Usuwanie fiszek – `DeleteFlashcardAlert` + `DELETE /flashcards/:id`, odświeżenie listy, toast.
- US‑007: Ręczne dodawanie – `CreateFlashcardDialog` + POST i wstawienie na listę.

## 13. Uwagi architektoniczne i ryzyka

- Nie importować server‑only typów/schematów do bundla frontu (zostajemy przy lekkiej walidacji klienta).
- Synchronizacja URL bez routera: używamy `history.pushState`/`replaceState` i `URLSearchParams` (astrowa strona SSR + wyspa).
- Spójność `order` przy klikaniu nagłówka – pamiętać o aktualizacji URL, nie tylko stanu.
