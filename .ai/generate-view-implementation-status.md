# Status implementacji widoku Generowanie fiszek (AI)

## Zrealizowane kroki

- Routing `/generate` w Astro z wyspą React `GenerateView`.
- Formularz generowania z walidacją długości, licznik znaków i CTA.
- Reduktor stanu z obsługą lifecycle generowania, walidacją wierszy, licznikiem zatwierdzonych.
- Hooki `useGeneration`, `useSaveApproved` i helper `postJson` do integracji z API.
- Mapowanie DTO → VM z ograniczeniem listy do 30 propozycji i sygnalizacją przycięcia.
- Sekcja propozycji (toolbar, tabela, wiersze, skeletony) z walidacją inline i masowymi akcjami.
- Toastery `sonner` dla sukcesów/błędów generowania i zapisu.
- Przekierowanie `/` → `/generate` oraz czysty lint/format po aktualizacji konfiguracji.

## Kolejne kroki

- Refaktoryzacja komponentów UI do faktycznych importów shadcn (gdy zdecydujemy się na CLI).
- Ewentualne testy jednostkowe/reducerów i hooków (pominięte na Twoją prośbę, można wrócić przy QA).
- Audyt UX/API po stronie backendu (np. stabilizacja logowania błędów, monitoring).
