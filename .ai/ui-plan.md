# Architektura UI dla 10x-cards

## 1. Przegląd struktury UI

- **Zakres i priorytety (MVP)**: logowanie/rejestracja, generowanie propozycji fiszek przez AI, przegląd/akceptacja/edycja/odrzucenie propozycji, zapis zatwierdzonych fiszek, lista i edycja „Moich fiszek”, usuwanie, lista generacji i szczegóły generacji. Wykorzystujemy responsywny design oparty na Tailwind ,gotowych komponentów Shadcn/ui oraz React.
- **Strony/widoki**:
  - Publiczne: `/login`
  - Prywatne: `/generate`, `/flashcards`, `/generations`, `/generations/:id`, `/account`
- **Layout i ochrona tras**: wspólny `AppLayout` z topbarem (Navigation Menu + mobile Drawer/Sheet), „skip link” do treści; ochrona tras w `src/middleware/index.ts` (goście widzą tylko `/login`). Po logowaniu redirect → `/generate`.
- **Integracja z API**: wyłącznie REST z `src/pages/api`; hooki i `ApiProvider` do obsługi żądań, abortów, mapowania 401 → `/login`. Brak obsługi 429 w MVP (z decyzji).
- **Zarządzanie stanem**: React hooks + Context; stan recenzji propozycji lokalnie w widoku `/generate`; brak TanStack Query; brak persistencji draftu.
- **Dostępność (WCAG AA)**: focus management, `Dialog`/`AlertDialog` zgodnie z ARIA, `aria-live` dla toastów i błędów, „skip link”, kontrast i klawiaturowa nawigacja, responsywność (Tailwind breakpoints sm/md/lg).
- **Bezpieczeństwo**: Supabase Auth po stronie klienta, ukrywanie pozycji menu dla gości, RLS w DB, brak użycia service role w kliencie; komunikaty błędów bez wrażliwych szczegółów.
- **Punkty bólu i rozwiązania**:
  - Długi czas generowania: skeletony, jednoznaczne CTA z blokadą i licznik znaków, informacja o limicie 1000–10000 znaków.
  - Przeciążenie listą propozycji: max 30 pozycji (MVP), edycja inline, zbiorczy zapis tylko zaakceptowanych.
  - Utrata zmian: wyraźny stan „zatwierdzony/edytowany”, przycisk „Zapisz” widoczny i „undo” po usunięciu fiszek.

## 2. Lista widoków

1) - **Nazwa widoku**: Uwierzytelnianie
   - **Ścieżka widoku**: `register` i `login`
   - **Główny cel**: Logowanie/rejestracja użytkownika (Supabase Auth).
   - **Kluczowe informacje do wyświetlenia**: Formularz e‑mail/hasło, komunikaty o błędach walidacji i uwierzytelniania.
   - **Kluczowe komponenty widoku**: Input, Label, Button, Form, Alert/Toast, Link do przełączania trybu logowanie/rejestracja.
   - **UX, dostępność i względy bezpieczeństwa**: Walidacja pól z natychmiastowym feedbackiem; focus trap; minimalne komunikaty błędów; zabezpieczenia JWT.
   - Powiązane endpointy API: (Supabase Auth – po stronie klienta).
   - Powiązane historyjki PRD: US‑001, US‑002.

2) - **Nazwa widoku**: Generowanie fiszek (AI)
   - **Ścieżka widoku**: `/generate`
   - **Główny cel**: Wklejenie tekstu (1000–10000 znaków), wywołanie AI, przegląd/akceptacja/edycja/odrzucenie propozycji, zapis zaakceptowanych.
   - **Kluczowe informacje do wyświetlenia**:
     - Textarea z licznikiem i walidacją zakresu.
     - Lista maks. 30 propozycji: `front`, `back`, status (zatwierdzona/odrzucona/edytowana).
   - **Kluczowe komponenty widoku**: Textarea (z licznikiem), Button (CTA generuj, zapisz), Table/List, Checkbox „Zatwierdź”, Inputy inline `front`/`back`, Badge dla `source`, Skeletony, Toast.
   - **UX, dostępność i względy bezpieczeństwa**:
     - CTA zablokowane poza 1000–10000 znaków; loading state i skeletony.
     - Edycja w wierszu z walidacją: `front ≤ 200`, `back ≤ 500`, trim.
     - Jeden przycisk „Zapisz” wysyła tylko zatwierdzone (źródło: `ai-full`/`ai-edited`) wraz z `generationId`.
     - Brak persistencji draftu w MVP; jasna informacja o tym zachowaniu.
   - Powiązane endpointy API: `POST /generations`, `POST /flashcards`.
   - Powiązane historyjki PRD: US‑003, US‑004.

3) - **Nazwa widoku**: Moje fiszki (lista i filtry)
   - **Ścieżka widoku**: `/flashcards`
   - **Główny cel**: Przegląd i zarządzanie fiszkami (filtry, paginacja, edycja, usuwanie).
   - **Kluczowe informacje do wyświetlenia**:
     - Tabela listy: `front`, `back`, `source` (`manual`/`ai-full`/`ai-edited`), `generationId?`, `createdAt`.
     - Filtry: `source`, `generationId`, sort po `createdAt`, paginacja (10/strona).
   - **Kluczowe komponenty widoku**: Table, Select/Combobox (filtry), komponent modal edycji, Pagination, Button (Dodaj), Dialog (edycja), AlertDialog (usuń), Badge, Toast.
   - **UX, dostępność i względy bezpieczeństwa**:
     - Edycja w modalu z deep‑linkiem `?edit={id}`; bez „nast./poprz.” w MVP.
     - Usuwanie optimistyczne z toastem „Cofnij” i rollbackiem przy błędzie.
     - Puste stany i skeletony; focus restore po zamknięciu modalu.
   - Powiązane endpointy API: `GET /flashcards`, `GET /flashcards/:id`, `PUT /flashcards/:id`, `DELETE /flashcards/:id`, `POST /flashcards` (dodanie ręczne).
   - Powiązane historyjki PRD: US‑004, US‑005, US‑006, US‑007.

4) - **Modal edycji fiszek**
   - **Ścieżka widoku**: Wyświetlany nad widokiem listy fiszek
   - **Główny cel**: Edycja fiszek z walidacją w czasie rzeczywistym
   - **Kluczowe informacje do wyświetlenia**:
     - Formularz edycji fiszki, pola `front` i `back`, komunikaty walidacyjne.
   - **Kluczowe komponenty widoku**: Modal z formularzem, przyciski "Zapisz" i "Anuluj".
   - **UX, dostępność i względy bezpieczeństwa**: Intuicyjny modal, dostępność dla czytników ekranu, walidacja danych po stronie klienta.

5) - **Nazwa widoku**: Generacje (lista)
   - **Ścieżka widoku**: `/generations`
   - **Główny cel**: Przegląd metadanych generacji i metryk (per PRD „statystyki generowania”).
   - **Kluczowe informacje do wyświetlenia**:
     - `model`, `sourceTextLength`, `generatedCount`, `generationDuration`, `createdAt`.
     - Paginacja; link do szczegółu `/generations/:id`.
   - **Kluczowe komponenty widoku**: Table, Pagination, Badge/Tag na model, Link do szczegółu.
   - **UX, dostępność i względy bezpieczeństwa**: Prosta tabela, sort po `createdAt` (opcjonalny), czytelne metadane; dostęp tylko dla właściciela (RLS).
   - Powiązane endpointy API: `GET /generations`.
   - Powiązane historyjki PRD: wspiera metryki z sekcji 6 (PRD).

6) - **Nazwa widoku**: Konto
   - **Ścieżka widoku**: `/account`
   - **Główny cel**: Wylogowanie użytkownika.
   - **Kluczowe informacje do wyświetlenia**: Przyciski „Wyloguj”.
   - **Kluczowe komponenty widoku**: Button, Alert/Toast.
   - **UX, dostępność i względy bezpieczeństwa**: Po wylogowaniu redirect → `/login`; wyczyść stan; dostęp tylko dla zalogowanych.
   - Powiązane endpointy API: (Supabase Auth – po stronie klienta).
   - Powiązane historyjki PRD: US‑002, US‑009.

7) - **Nazwa widoku**: Sesja nauki (placeholder)
   - **Ścieżka widoku**: `/study`
   - **Główny cel**: Zarezerwowane miejsce pod integrację z algorytmem powtórek (poza MVP).
   - **Kluczowe informacje do wyświetlenia**: Komunikat „Wkrótce”.
   - **Kluczowe komponenty widoku**: Empty State.
   - **UX, dostępność i względy bezpieczeństwa**: Widoczne tylko dla zalogowanych; brak działań w MVP.
   - Powiązane endpointy API: n/d w MVP.
   - Powiązane historyjki PRD: US‑008 (zaplanowane; poza MVP).

8) - **Nazwa widoku**: 404 (opcjonalny)
   - **Ścieżka widoku**: (globalny fallback)
   - **Główny cel**: Czytelna informacja o braku zasobu i linki powrotu.
   - **Kluczowe informacje do wyświetlenia**: Komunikat i linki do `/generate` oraz `/flashcards`.
   - **Kluczowe komponenty widoku**: Empty State, Button/Link.
   - **UX, dostępność i względy bezpieczeństwa**: Łatwy powrót do głównych widoków; brak ujawniania szczegółów.
   - Powiązane endpointy API: brak.

## 3. Mapa podróży użytkownika

- **Gość → Logowanie**:
  1) Użytkownik wchodzi na aplikację → middleware przekierowuje gościa na `/login`.
  2) Użytkownik loguje się/rejestruje (Supabase) → redirect → `/generate`.
  3) Topbar aktualizuje widoczne pozycje (ukryte dla gościa, widoczne dla zalogowanego).

- **Generowanie → Recenzja → Zapis** (główny scenariusz US‑003/US‑004):
  1) Na `/generate` użytkownik wkleja tekst (1000–10000). Licznik i walidacja blokują CTA poza zakresem.
  2) Kliknięcie „Generuj” wyświetla loading i skeletony; po 200 OK pojawia się lista propozycji (max 30) oraz metadane generacji.
  3) Użytkownik przegląda propozycje: checkbox „Zatwierdź”, edycja inline `front`/`back` (walidacje).
  4) Klik „Zapisz” wysyła tylko zatwierdzone (`source: ai-full/ai-edited`) z `generationId`. Po sukcesie toast z linkiem do „Moje fiszki” (z filtrem `generationId`) i opcją przejścia.

- **Zarządzanie fiszkami**:
  1) Na `/flashcards` użytkownik używa filtrów (`source`, `generationId`), sortowania i paginacji (10/strona).
  2) Edycja: klik „Edytuj” → `Dialog` z deep‑linkiem `?edit={id}` → `PUT /flashcards/:id` → toast.
  3) Usuwanie: `DELETE /flashcards/:id` → optimistic update, toast „Cofnij” (rollback na błąd).
  4) Dodanie ręczne: „Nowa fiszka” → `POST /flashcards` (`source=manual`) → toast, odświeżenie listy.

- **Przegląd generacji**:
  1) Na `/generations` lista generacji z metadanymi; klik w wiersz → `/generations/:id`.
  2) Na szczególe generacji można „Usuń” → 204 → powrót/odśwież listę z toastem.

- **Konto**:
  1) Na `/account` klik „Wyloguj” → wyczyszczenie sesji → redirect `/login`.

- **Stany brzegowe i błędy (przepływowo)**:
  - 401/wygaśnięta sesja: middleware oraz `ApiProvider` redirect → `/login`.
  - 500 przy generowaniu: komunikat w obszarze wyników + toast, zapis błędu po stronie backendu; możliwość ponowienia.
  - Brak wyników: pusty stan listy propozycji/fiszek/generacji.
  - Sieć przerwana: anulowanie żądania (AbortController), informacja „Spróbuj ponownie”.

## 4. Układ i struktura nawigacji

- **AppLayout**:
  - Góra: Topbar (logo/brand), Navigation Menu (shadcn/ui), po prawej sekcja konta.
  - Mobile: Navigation Drawer/Sheet, te same pozycje co w desktop, sterowane przyciskiem menu (hamburger).
  - „Skip link” do `<main>` tuż po załadowaniu.

- **Pozycje menu (dla zalogowanych)**:
  - „Generuj” → `/generate`
  - „Moje fiszki” → `/flashcards`
  - „Generacje” → `/generations`
  - „Konto” → `/account`

- **Pozycje menu (dla gości)**:
  - „Zaloguj” → `/login` (pozostałe ukryte)

- **Zachowania nawigacyjne**:
  - Po logowaniu redirect → `/generate`.
  - Aktywne stany i fokus widoczny; na mobile Drawer pełnoekranowy.
  - Linki do „powrotu” ze szczegółów generacji; deep‑link do edycji fiszki `?edit={id}`.

## 5. Kluczowe komponenty

- **AppLayout**: wspólny układ z topbarem, kontenerem treści, skip linkiem.
- **Topbar / NavigationMenu / MobileDrawer**: adaptacyjna nawigacja, ukrywanie pozycji dla gości.
- **SkipLink**: skok do `<main>` dla a11y.
- **AuthForm**: formularz logowania/rejestracji (Supabase), obsługa błędów, redirect.
- **TextareaWithCounter**: textarea z licznikiem znaków i walidacją zakresu (1000–10000).
- **ProposalsTable**: lista propozycji AI (max 30): kolumny `front`, `back`, „Zatwierdź”, znacznik edycji.
- **ProposalRow**: checkbox „Zatwierdź”, pola edycji inline, walidacje, status zmian.
- **SaveSelectedBar / PrimaryCTA**: główne „Zapisz” do `POST /flashcards` (tylko zatwierdzone).
- **FlashcardsTable**: tabela fiszek z kolumnami `front`, `back`, `source`, `generationId`, `createdAt`.
- **FlashcardFilters**: `Select/Combobox` dla `source` i `generationId`, sort `createdAt`, reset filtrów.
- **PaginationBar**: 10/strona, obsługa `page`, `pageSize`.
- **FlashcardEditDialog**: modal edycji z deep‑linkiem `?edit={id}`, walidacje, focus management.
- **ConfirmDeleteDialog**: `AlertDialog` z potwierdzeniem; integracja z optimistic update i „Cofnij”.
- **ToastProvider**: `aria-live` dla komunikatów sukcesu/błędu, cofnięcie operacji.
- **GenerationsTable**: lista generacji z metadanymi, link do szczegółów.
- **GenerationDetailsCard**: podsumowanie metadanych i przycisk „Usuń”.
- **EmptyState / ErrorState / Skeletons**: spójne komponenty stanów list/ekranów.
- **ApiProvider + hooki (useApi, useFlashcardsApi, useGenerationsApi)**: fetch z AbortController, mapowanie 401, retry/backoff dla 500.
- **AuthGuard (fallback kliencki)**: ukrywanie zawartości zanim middleware przekieruje (migotanie UX).


