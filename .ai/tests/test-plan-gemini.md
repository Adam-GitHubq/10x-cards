Jako doświadczony inżynier QA, po dokładnej analizie dostarczonych informacji o projekcie, przedstawiam kompleksowy plan testów aplikacji 10xCards.

***

# Plan Testów dla Aplikacji 10xCards

## 1. Wprowadzenie i Cele Testowania

### 1.1. Wprowadzenie
Niniejszy dokument określa strategię, zakres, zasoby i harmonogram działań testowych dla aplikacji 10xCards. Projekt jest nowoczesną aplikacją webową opartą o stack technologiczny Astro, React, TypeScript i Supabase, której kluczową funkcjonalnością jest generowanie fiszek edukacyjnych z tekstu źródłowego przy użyciu AI. Plan ten ma na celu zapewnienie, że finalny produkt będzie spełniał najwyższe standardy jakości, stabilności i bezpieczeństwa.

### 1.2. Cele Testowania
Główne cele procesu testowego to:
*   **Weryfikacja funkcjonalna:** Upewnienie się, że wszystkie funkcjonalności aplikacji działają zgodnie ze specyfikacją i oczekiwaniami użytkownika.
*   **Zapewnienie stabilności:** Identyfikacja i eliminacja błędów, które mogłyby prowadzić do awarii systemu lub nieprzewidywalnego zachowania.
*   **Weryfikacja bezpieczeństwa:** Sprawdzenie, czy mechanizmy uwierzytelniania, autoryzacji i zarządzania danymi są bezpieczne i chronią prywatność użytkowników.
*   **Ocena użyteczności (UX/UI):** Zapewnienie, że interfejs użytkownika jest intuicyjny, responsywny i spójny na różnych urządzeniach i przeglądarkach.
*   **Weryfikacja integracji:** Potwierdzenie poprawnej komunikacji między frontendem, backendem (API) oraz usługami zewnętrznymi (Supabase, OpenRouter AI).
*   **Zapewnienie jakości danych:** Sprawdzenie poprawności walidacji, przetwarzania i przechowywania danych w systemie.

## 2. Zakres Testów

### 2.1. Funkcjonalności objęte testami
*   **Moduł Uwierzytelniania Użytkowników:**
    *   Rejestracja nowego użytkownika.
    *   Logowanie i wylogowywanie.
    *   Mechanizm resetowania hasła (żądanie i realizacja).
    *   Walidacja formularzy (po stronie klienta i serwera).
    *   Obsługa błędów uwierzytelniania.
*   **Moduł Generowania Fiszek (AI):**
    *   Formularz wprowadzania tekstu źródłowego (walidacja długości tekstu).
    *   Proces generowania propozycji fiszek (interakcja z API AI).
    *   Wyświetlanie i edycja wygenerowanych propozycji.
    *   Zatwierdzanie i odrzucanie propozycji.
    *   Zapisywanie zatwierdzonych fiszek w bazie danych.
    *   Obsługa stanów (ładowanie, sukces, błąd) interfejsu.
*   **Moduł Zarządzania Fiszkami (CRUD):**
    *   Wyświetlanie listy fiszek użytkownika.
    *   Paginacja, sortowanie i filtrowanie listy fiszek (wg źródła, ID generacji).
    *   Ręczne tworzenie nowej fiszki.
    *   Edycja istniejącej fiszki.
    *   Usuwanie fiszki.
*   ** Middleware i Autoryzacja:**
    *   Ochrona ścieżek wymagających zalogowania.
    *   Przekierowania dla zalogowanych i niezalogowanych użytkowników.
    *   Izolacja danych między użytkownikami na poziomie API.
*   **Ogólne Elementy Aplikacji:**
    *   Responsywność interfejsu (RWD) na urządzeniach mobilnych i desktopowych.
    *   Przełącznik motywu (jasny/ciemny).
    *   Menu użytkownika.

### 2.2. Funkcjonalności wyłączone z testów
*   Testy wydajnościowe samego modelu AI (usługa zewnętrzna OpenRouter).
*   Testy obciążeniowe infrastruktury Supabase (zakładamy zgodność z SLA dostawcy).
*   Szczegółowe testy statycznej analizy kodu (ESLint, Prettier) - zakładamy ich poprawne działanie w ramach CI/CD.

## 3. Typy Testów

W ramach projektu przeprowadzone zostaną następujące rodzaje testów:

| Typ Testu | Opis | Narzędzia | Odpowiedzialność |
| :--- | :--- | :--- | :--- |
| **Testy Jednostkowe** | Weryfikacja pojedynczych funkcji, komponentów UI i logiki biznesowej w izolacji. Skupienie na hookach React, funkcjach mapujących, walidatorach Zod i logice serwisów (z mockami). | Vitest, React Testing Library | Deweloperzy |
| **Testy Integracyjne** | Testowanie współpracy między komponentami. Weryfikacja logiki serwisów po stronie serwera w interakcji z mockowaną lub testową bazą danych oraz testowanie przepływu danych w komponetach frontendowych. | Vitest, Supertest, React Testing Library | Deweloperzy, QA |
| **Testy API (End-to-End)**| Testowanie publicznego API (`/api/...`) z perspektywy klienta HTTP. Weryfikacja kontraktu API, kodów odpowiedzi, obsługi błędów i walidacji. | Postman, Vitest (z Supertest/fetch) | Inżynier QA |
| **Testy End-to-End (E2E)** | Symulacja rzeczywistych scenariuszy użytkownika w przeglądarce. Testowanie kompletnych przepływów, np. od rejestracji, przez generowanie fiszek, aż po ich edycję. | Playwright / Cypress | Inżynier QA |
| **Testy Użyteczności i UI** | Manualna weryfikacja interfejsu pod kątem spójności, intuicyjności i zgodności z projektem graficznym. | - | Inżynier QA, UX Designer |
| **Testy Kompatybilności** | Sprawdzenie poprawnego działania i wyświetlania aplikacji na różnych przeglądarkach i systemach operacyjnych. | Przeglądarki (Chrome, Firefox, Safari), narzędzia deweloperskie | Inżynier QA |
| **Testy Manualne Eksploracyjne** | Swobodne testowanie aplikacji w celu znalezienia nieprzewidzianych błędów i problemów z użytecznością. | - | Inżynier QA |

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

### 4.1. Uwierzytelnianie
*   **TC-AUTH-01:** Pomyślne logowanie przy użyciu poprawnych danych.
*   **TC-AUTH-02:** Nieudane logowanie z powodu błędnego hasła lub e-maila (oczekiwany komunikat błędu).
*   **TC-AUTH-03:** Pomyślna rejestracja nowego użytkownika i automatyczne zalogowanie.
*   **TC-AUTH-04:** Nieudana rejestracja z powodu użycia istniejącego adresu e-mail.
*   **TC-AUTH-05:** Walidacja formularzy rejestracji i logowania (np. niepoprawny format e-mail, zbyt krótkie hasło).
*   **TC-AUTH-06:** Pomyślne wylogowanie i usunięcie sesji.
*   **TC-AUTH-07:** Dostęp do chronionej ścieżki (`/generate`) przez niezalogowanego użytkownika (oczekiwane przekierowanie na `/auth/login`).
*   **TC-AUTH-08:** Dostęp do strony logowania przez zalogowanego użytkownika (oczekiwane przekierowanie na `/generate`).

### 4.2. Generowanie Fiszek
*   **TC-GEN-01:** Pomyślne wygenerowanie propozycji fiszek po wprowadzeniu poprawnego tekstu źródłowego.
*   **TC-GEN-02:** Próba generowania z tekstem zbyt krótkim lub zbyt długim (oczekiwany błąd walidacji).
*   **TC-GEN-03:** Edycja treści wygenerowanej propozycji (zmiana `front` i `back`).
*   **TC-GEN-04:** Zatwierdzenie (`approve`) kilku propozycji i ich zapisanie (oczekiwany sukces i wyczyszczenie listy).
*   **TC-GEN-05:** Próba zapisu zatwierdzonych fiszek, gdy jedna z nich ma błąd walidacji (np. pusta treść) - oczekiwany komunikat błędu.
*   **TC-GEN-06:** Użycie przycisków "Zaznacz wszystkie" / "Odznacz wszystkie".
*   **TC-GEN-07:** Wyświetlenie paska podsumowania generacji po pomyślnym procesie.

### 4.3. Zarządzanie Fiszkami
*   **TC-MAN-01:** Wyświetlenie listy fiszek i weryfikacja poprawności paginacji.
*   **TC-MAN-02:** Filtrowanie listy fiszek po źródle (np. "AI", "Manualne") i weryfikacja wyników.
*   **TC-MAN-03:** Sortowanie listy fiszek po dacie utworzenia (rosnąco/malejąco).
*   **TC-MAN-04:** Pomyślne utworzenie nowej, manualnej fiszki i jej pojawienie się na liście.
*   **TC-MAN-05:** Edycja istniejącej fiszki i weryfikacja zaktualizowanych danych.
*   **TC-MAN-06:** Usunięcie fiszki i jej zniknięcie z listy.
*   **TC-MAN-07:** Wyświetlenie pustego stanu, gdy brak fiszek lub filtry nie zwracają wyników.

## 5. Środowisko Testowe

*   **Środowisko deweloperskie (Lokalne):** Używane przez deweloperów do uruchamiania testów jednostkowych i integracyjnych.
*   **Środowisko Staging (QA):** Osobna instancja aplikacji z własną bazą danych Supabase, odzwierciedlająca środowisko produkcyjne. Na tym środowisku będą przeprowadzane testy E2E, API oraz manualne.
*   **Przeglądarki:**
    *   Chrome (najnowsza wersja)
    *   Firefox (najnowsza wersja)
    *   Safari (najnowsza wersja)
*   **Systemy operacyjne:** Windows 11, macOS (Sonoma), iOS, Android (do testów RWD).

## 6. Narzędzia do Testowania

| Narzędzie | Zastosowanie |
| :--- | :--- |
| **Vitest** | Framework do uruchamiania testów jednostkowych i integracyjnych w środowisku Node.js. |
| **React Testing Library** | Biblioteka do testowania komponentów React w sposób zorientowany na użytkownika. |
| **Playwright** | Framework do testów E2E, umożliwiający automatyzację interakcji w przeglądarce. |
| **Postman / Insomnia** | Ręczne testowanie i eksploracja API. |
| **Storybook** | (Rekomendacja) Narzędzie do izolowanego budowania i testowania komponentów UI. |
| **GitHub Actions** | Platforma CI/CD do automatycznego uruchamiania testów po każdym commicie/pull requeście. |
| **Jira / Trello** | System do zarządzania zadaniami i raportowania błędów. |

## 7. Harmonogram Testów

Proces testowy będzie prowadzony w sposób ciągły, równolegle z procesem deweloperskim.

*   **Sprint Planning:** Analiza nowych historyjek użytkownika i tworzenie scenariuszy testowych.
*   **W trakcie Sprintu:**
    *   Deweloperzy piszą testy jednostkowe i integracyjne dla tworzonych funkcjonalności.
    *   QA przygotowuje automatyczne testy E2E i API.
    *   Testy eksploracyjne nowych funkcjonalności na środowisku Staging.
*   **Przed wdrożeniem (Code Freeze):**
    *   Pełna regresja manualna i automatyczna na środowisku Staging.
    *   Testy kompatybilności.
*   **Po wdrożeniu (Produkcja):**
    *   Testy dymne (Smoke Tests) w celu weryfikacji kluczowych funkcjonalności.

## 8. Kryteria Akceptacji Testów

### 8.1. Kryteria Wejścia (Rozpoczęcie Testów)
*   Funkcjonalność została zaimplementowana i wdrożona na środowisku Staging.
*   Testy jednostkowe i integracyjne napisane przez deweloperów przechodzą pomyślnie.
*   Build aplikacji na CI/CD zakończył się sukcesem.

### 8.2. Kryteria Wyjścia (Zakończenie Testów)
*   Wszystkie zdefiniowane scenariusze testowe zostały wykonane.
*   100% testów krytycznych (np. logowanie, podstawowe CRUD) zakończyło się sukcesem.
*   Co najmniej 95% testów o wysokim priorytecie zakończyło się sukcesem.
*   Brak znanych błędów blokujących (Blocker) i krytycznych (Critical).
*   Wszystkie zgłoszone błędy zostały przeanalizowane, a ich status (np. "Do naprawy", "Won't fix") jest znany.

## 9. Role i Odpowiedzialności

| Rola | Odpowiedzialność |
| :--- | :--- |
| **Product Owner** | Definiowanie wymagań, priorytetyzacja funkcjonalności, akceptacja wyników testów. |
| **Deweloperzy** | Pisanie testów jednostkowych i integracyjnych, naprawa zgłoszonych błędów, wsparcie w diagnozowaniu problemów. |
| **Inżynier QA** | Tworzenie i utrzymanie planu testów, projektowanie i wykonywanie scenariuszy testowych (manualnych i automatycznych), raportowanie błędów, weryfikacja poprawek, ostateczna rekomendacja dotycząca wdrożenia. |
| **UX Designer** | Wsparcie w testach użyteczności i weryfikacji spójności interfejsu. |

## 10. Procedury Raportowania Błędów

Każdy zidentyfikowany błąd musi zostać zgłoszony w systemie do śledzenia błędów (np. Jira) i zawierać następujące informacje:
*   **Tytuł:** Zwięzły i jednoznaczny opis problemu.
*   **Środowisko:** Gdzie wystąpił błąd (np. Staging, Chrome 125).
*   **Kroki do odtworzenia:** Szczegółowa, numerowana lista kroków prowadzących do wystąpienia błędu.
*   **Wynik oczekiwany:** Co powinno się wydarzyć.
*   **Wynik aktualny:** Co faktycznie się wydarzyło.
*   **Priorytet:** (np. Blocker, Critical, Major, Minor) - ocena wpływu błędu na działanie aplikacji.
*   **Załączniki:** Zrzuty ekranu, nagrania wideo, logi z konsoli.