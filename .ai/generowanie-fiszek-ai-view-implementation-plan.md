## Plan implementacji widoku Generowanie fiszek (AI)

## 1. Przegląd

Widok umożliwia wklejenie długiego tekstu (1000–10000 znaków), uruchomienie generowania propozycji fiszek przez AI, następnie przegląd, edycję, akceptację/odrzucenie propozycji i zapis wybranych do bazy. W MVP nie ma zapisu draftu – użytkownik traci niewysłane zmiany przy odświeżeniu/nawigacji; pokażemy o tym jasną informację.

Założenia i zgodność z PRD/US:
- US‑003: formularz wejściowy, walidacja długości, wywołanie `POST /api/generations`, obsługa błędów.
- US‑004: lista propozycji, inline-edytowalność, selekcja do zapisu, zapis przez `POST /api/flashcards`.
- Maks. 30 propozycji widocznych na liście.

Stack i wytyczne:
- Astro 5 (strona `src/pages/generate.astro`) + React 19 (wyspa `GenerateView.tsx`).
- TypeScript 5, Tailwind 4, shadcn/ui (Textarea, Button, Checkbox, Badge, Table, Skeleton, Toast).
- Rules of Hooks; brak dedykowanych plików CSS; walidacje i logikę API prowadzimy w komponentach/hookach, wspólne narzędzia sieciowe w `src/lib`.

## 2. Routing widoku

- Ścieżka URL: `/generate`.
- Plik strony: `src/pages/generate.astro` (SSR wyłączone dla części, React island dla interaktywności).
- Montowanie React: `src/components/generate/GenerateView.tsx` jako wyspa.

## 3. Struktura komponentów

- `GeneratePage` (Astro)
  - wczytuje shadcn Toaster (jeśli globalnie nieobecny) i montuje wyspę React
- `GenerateView` (React)
  - `GenerationForm` (textarea + CTA „Generuj” + licznik + info o braku draftu)
  - `GenerationSummaryBar` (po generacji: model, liczba, czas, hash skrócony)
  - `ProposalsSection`
    - `ProposalsToolbar` (Zapisz zatwierdzone, Zaznacz/Odznacz wszystkie, Wyczyść)
    - `ProposalTable`
      - `ProposalRow` (checkbox, pola `front`/`back`, badge `source`, status/validacja)
    - `SkeletonList` (placeholdery podczas ładowania)
  - `ToastViewport` (shadcn)

Drzewo komponentów (wysoki poziom):

- GeneratePage (Astro)
  - GenerateView (React)
    - GenerationForm
    - GenerationSummaryBar
    - ProposalsSection
      - ProposalsToolbar
      - ProposalTable
        - ProposalRow × N
      - SkeletonList

## 4. Szczegóły komponentów

### GenerateView
- Opis: Kontener UX i orkiestracja stanu, łączy formularz, wyniki generacji i zapis.
- Główne elementy: wrapper `div`, sekcje formularza, podsumowania, listy propozycji, Toaster.
- Interakcje: reaguje na `onGenerate`, `onEditProposal`, `onToggleApprove`, `onSaveApproved`, zarządza stanem i blokadami.
- Walidacja: koordynuje globalne błędy (np. brak wybranych, błędy 400/500).
- Typy: `ViewState`, `GenerationResultViewModel`, `ProposalViewModel`.
- Propsy: brak (top-level).

### GenerationForm
- Opis: Wklejenie tekstu, licznik znaków, walidacja, CTA „Generuj”.
- Główne elementy: shadcn `Textarea`, licznik (np. „2450/10000”), `Button` „Generuj”, krótka notka o braku persistencji.
- Interakcje:
  - `onChange(text)`: trim + licznik, komunikaty walidacyjne.
  - `onSubmit()`: wywołuje `POST /api/generations` przy 1000–10000 znaków (po trim).
- Walidacja:
  - `trim(text).length ∈ [1000, 10000]` – inaczej CTA disabled + komunikat.
  - zliczanie w czasie rzeczywistym; podświetlenie na czerwono poza zakresem.
- Typy: `CreateGenerationCommand` (request), `CreateGenerationResponseDto` (response).
- Propsy:
  - `value: string`
  - `onChange(value: string)`
  - `onSubmit()`
  - `isLoading: boolean`
  - `errors?: string[]`

### GenerationSummaryBar
- Opis: Pokazuje metadane generacji po sukcesie.
- Główne elementy: wiersz metryk (model, liczba, czas, data), `Badge` z modelem.
- Interakcje: brak (tylko prezentacja).
- Walidacja: brak.
- Typy: `GenerationBaseDto`.
- Propsy: `generation: GenerationBaseDto`.

### ProposalsSection
- Opis: Sekcja listy propozycji wraz z akcjami.
- Główne elementy: toolbar, tabela, skeletony.
- Interakcje: `onSaveApproved`, `onApproveAll`, `onRejectAll`, `onClear`.
- Walidacja: wyłącz „Zapisz” gdy brak zatwierdzonych lub istnieją niepoprawne wiersze.
- Typy: `ProposalViewModel[]` i akcje mutujące.
- Propsy:
  - `proposals: ProposalViewModel[]`
  - `onEdit(id, changes)`
  - `onToggleApprove(id, approved: boolean)`
  - `onApproveAll()` / `onRejectAll()` / `onClear()`
  - `onSaveApproved()`
  - `isSaving: boolean`

### ProposalsToolbar
- Opis: Akcje nad listą.
- Główne elementy: `Button` zapisu, przełączniki zbiorcze.
- Interakcje: kliknięcia ww. akcji.
- Walidacja: przycisk „Zapisz zatwierdzone” disabled, gdy `approvedCount === 0` lub istnieją błędy walidacji w zatwierdzonych.
- Typy: liczniki, flagi błędów, callbacki.
- Propsy:
  - `approvedCount: number`
  - `hasApprovedErrors: boolean`
  - `onSaveApproved()`, `onApproveAll()`, `onRejectAll()`, `onClear()`
  - `isSaving: boolean`

### ProposalTable
- Opis: Prezentacja listy w tabeli, do 30 wierszy.
- Główne elementy: shadcn `Table`, sticky header, kolumny: Approve, Front, Back, Source, Status.
- Interakcje: deleguje do `ProposalRow`.
- Walidacja: wizualizacja błędów na komórkach (Tailwind klasy + komunikaty).
- Typy: `ProposalViewModel[]`.
- Propsy: `proposals`, callbacki do edycji i akceptacji/odrzucenia.

### ProposalRow
- Opis: Edytowalny wiersz z walidacją inline.
- Główne elementy: `Checkbox` (zatwierdź), `Input`/`Textarea` dla front/back (limit znaków), `Badge` źródła, status.
- Interakcje:
  - `onToggleApprove`
  - `onChangeFront`, `onChangeBack` (trim + walidacja długości)
  - automatyczna zmiana `source` na `ai-edited` gdy treść edytowana
- Walidacja:
  - `front.trim()` 1..200
  - `back.trim()` 1..500
  - błędy pokazywane inline; zatwierdzony wiersz z błędami oznacza `hasApprovedErrors=true`
- Typy: `ProposalViewModel`, pola walidacji.
- Propsy: `proposal`, callbacki `onEdit`, `onToggleApprove`.

### SkeletonList
- Opis: Placeholdery dla listy podczas `isLoading` generacji.
- Główne elementy: 10–20 skeletonów w kształcie wierszy tabeli.
- Interakcje/Walidacja: brak.
- Propsy: `rows?: number`.

## 5. Typy

Używane DTO (z `src/types.ts`):
- `CreateGenerationCommand` { sourceText: string }
- `CreateGenerationResponseDto` { generation: GenerationBaseDto; flashcardsProposals: FlashcardProposalDto[] }
- `GenerationBaseDto` { id, model, sourceTextHash, sourceTextLength, generatedCount, generationDuration, createdAt, updatedAt }
- `FlashcardProposalDto` { front, back, source: 'ai-full' }
- `CreateFlashcardsCommand` { cards: CreateFlashcardItemCommand[] }
- `CreateFlashcardItemCommand` { front, back, source, generationId? }
- `CreateFlashcardsResponseDto` { flashcards: FlashcardDto[] }

## 6. Zarządzanie stanem

- Zalecane: `useReducer` w `GenerateView` do spinania złożonych mutacji listy propozycji oraz liczników (mniej rerenderów wierszy).
- Reduktor: akcje `SET_TEXT`, `SET_PHASE`, `SET_GENERATION_RESULT`, `EDIT_PROPOSAL(id, partial)`, `TOGGLE_APPROVE(id)`, `APPROVE_ALL`, `REJECT_ALL`, `CLEAR_ALL`, `RESET`.
- Walidacja inline w akcji `EDIT_PROPOSAL` (front/back z trim i limitami). `approvedCount` i `hasApprovedErrors` utrzymywane jako pola pochodne w stanie.
- Dodatkowe hooki:
  - `useGeneration()` – POST `/api/generations`, zwraca `trigger(sourceText)` i statusy.
  - `useSaveApproved()` – POST `/api/flashcards`, buduje payload z zatwierdzonych i poprawnie zwalidowanych wierszy.
  - `useCharCounter(value)` – zwraca `trimmedLength` i flagi przekroczeń do formularza.

## 7. Integracja API

Wywołania:
- Generowanie: `POST /api/generations`
  - Request: `CreateGenerationCommand`
  - Response 201: `CreateGenerationResponseDto`
  - Front: po sukcesie zmapować `flashcardsProposals` -> `ProposalViewModel[]` (ustaw `source='ai-full'`, `approved=false`, walidacja inicjalnie `valid=true`).
  - Obsługa 400 (Zod issues), 500 (komunikat ogólny + log).
- Zapis fiszek: `POST /api/flashcards`
  - Request: `CreateFlashcardsCommand`, tylko dla zatwierdzonych i poprawnych wierszy:
    - `front`, `back`
    - `source`: jeśli użytkownik edytował – `ai-edited`, inaczej `ai-full`
    - `generationId`: `generation.id` z `GenerationBaseDto`
  - Response 201: `CreateFlashcardsResponseDto`
  - Obsługa: 400 (np. puste `cards` lub walidacja), 404 (brak `generationId` u użytkownika), 500.

Wspólna funkcja fetch:
- `postJson<TReq, TRes>(url, body): Promise<TRes>` – nagłówki JSON, obsługa błędów.

## 8. Interakcje użytkownika

- Wklejenie/edycja tekstu: aktualizuje licznik i walidacje.
- Klik „Generuj”: jeśli długość po trim w zakresie, pokazuje skeletony, po zwrotce – lista propozycji (+ pasek podsumowania).
- Edycja wiersza: natychmiastowa walidacja pól, zmiana źródła na `ai-edited` gdy treść się zmieni.
- Zaznaczanie/odznaczanie wierszy: wpływa na `approvedCount`; błędne zatwierdzone wiersze blokują zapis.
- Zapis zatwierdzonych: wysyła tylko zatwierdzone i poprawne; pokazuje sukces/porazkę w toast.
- Akcje zbiorcze: „Zaznacz wszystko”, „Odznacz wszystko”, „Wyczyść listę”.

## 9. Warunki i walidacja

- Formularz wejścia:
  - `trim(sourceText).length ∈ [1000, 10000]` – inaczej CTA „Generuj” disabled.
- Wiersze propozycji:
  - `front.trim().length ∈ [1, 200]`
  - `back.trim().length ∈ [1, 500]`
  - błąd pokazywany pod polem; zatwierdzony wiersz z błędem -> blokada „Zapisz”.
- Zapis:
  - przynajmniej jeden zatwierdzony wiersz
  - brak błędów walidacji wśród zatwierdzonych
  - posiadanie `generation.id` (zablokuj przycisk, jeśli brak wyników generacji)
- Limit listy: renderujemy maks. 30 wierszy (jeśli backend zwróci więcej – przytnij do 30 i pokaż info).

## 10. Obsługa błędów

- Sieć/HTTP:
  - 400 (Zod): pokaż listę problemów (toast + ewentualnie mapowanie do pól).
  - 404 (flashcards): komunikat „Generacja nieznaleziona…” + sugestia ponownej generacji.
  - 500: komunikat ogólny, log do konsoli w dev.
- UX:
  - Stan „loading” z skeletonami przy generowaniu.
  - Stan „saving” (spinner w przycisku zapisu, disabled).
  - Komunikat o braku persistencji draftu.

## 11. Kroki implementacji

1) Routing i szkielety
- Utwórz `src/pages/generate.astro` z montowaniem `GenerateView` oraz Toasterem shadcn (jeśli globalnie nieobecny).
- Utwórz strukturę katalogów: `src/components/generate/`.

2) UI formularza
- Zaimplementuj `GenerationForm` z shadcn `Textarea` + licznik + CTA „Generuj” + walidacja zakresu.
- Dodaj notkę o braku persistencji.

3) Logika generowania
- Dodaj hook `useGeneration()` i wspólny `postJson` w `src/lib/http.ts` (lub podobnie), wywołujący `POST /api/generations`.
- W `GenerateView` obsłuż stany: `idle` → `loading` → `ready`/`error`.
- Zmapuj odpowiedź na `GenerationResultViewModel` (utwórz `ProposalViewModel[]`, max 30).

4) Lista propozycji
- Zaimplementuj `ProposalsSection`, `ProposalsToolbar`, `ProposalTable`, `ProposalRow`, `SkeletonList`.
- Dodaj `useReducer` do zarządzania listą, walidacją i licznikami.

5) Edycja i walidacja inline
- W `ProposalRow` obsłuż zmianę pól, walidację i automatyczną zmianę `source` na `ai-edited` po edycji.
- Zadbaj o dostępność (label/aria, focus ringi Tailwind).

6) Zapis zatwierdzonych
- Dodaj hook `useSaveApproved()` do wywołania `POST /api/flashcards`.
- Buduj payload z zatwierdzonych i poprawnych wierszy, uwzględnij `generationId`.
- Pokaż toast sukcesu i zresetuj selekcje lub całą listę (ustalone w UX – na start: odznacz zaznaczenia).

7) Stany błędów i toasty
- Skonfiguruj shadcn Toast/Toaster.
- Przechwytuj 400/404/500 i pokazuj właściwe komunikaty; 400 mapuj do pól jeśli możliwe.

8) Stylowanie i dopracowanie UX
- Tailwind 4 dla layoutu, odstępów, kolorystyki walidacji; badge dla źródła.
- Sticky header tabeli, responsywność, focus management.

9) Testy i weryfikacja
- Scenariusze: zbyt krótki/długi tekst, brak sieci, 500 z backendu, edycje przekraczające limity, zapis z błędami, brak zaznaczonych.
- Sprawdź, że `POST /flashcards` odrzuci niepoprawne payloady; UI je nie wysyła.

10) Porządki
- Ewentualne wydzielenie helpers (walidacja, mapowanie DTO→VM) do `src/lib`.
- Przegląd lintera/typów, ostatni audit dostępności (tab order, aria-live dla błędów).


