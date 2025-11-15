# Changelog

Wszystkie istotne zmiany w projekcie 10xCards.

Format oparty na [Keep a Changelog](https://keepachangelog.com/pl/1.0.0/).

## [Unreleased]

## [0.2.0] - 2024-11-15

### 🎉 Dodano

#### Integracja OpenRouter AI

- **OpenRouter Service** (`src/lib/services/openrouter.service.ts`)
  - Pełna integracja z API OpenRouter
  - Wsparcie dla Claude 3.5 Sonnet i innych modeli LLM
  - Mechanizm retry z exponential backoff (3 próby)
  - 9 typów błędów z przyjaznymi komunikatami po polsku
  - Pełne typowanie TypeScript dla wszystkich parametrów i odpowiedzi
  - Walidacja danych wejściowych i konfiguracji
  - Wsparcie dla JSON Schema w odpowiedziach

- **Konfiguracja OpenRouter** (`src/lib/services/ai/openrouter.config.ts`)
  - Dedykowana konfiguracja dla generowania fiszek
  - Szczegółowy system message z 8 zasadami tworzenia fiszek
  - JSON Schema dla struktury odpowiedzi
  - Factory functions i singleton pattern
  - Domyślna konfiguracja: Claude 3.5 Sonnet, temperature 0.7, 4096 tokenów

- **Generator fiszek AI** (przepisany `src/lib/services/ai/flashcardsGenerator.ts`)
  - Prawdziwe generowanie fiszek przez AI (zamiast mockowanych danych)
  - Walidacja długości tekstu (minimum 50 znaków)
  - Dedykowany typ błędu `FlashcardGenerationError`
  - 4 typy błędów: INVALID_INPUT, TEXT_TOO_SHORT, API_ERROR, NO_FLASHCARDS_GENERATED
  - Inteligentne pytania testujące zrozumienie materiału
  - 3-10 fiszek adaptacyjnie (zależnie od tekstu)

#### Dokumentacja

- **QUICKSTART.md** - Przewodnik szybkiego startu (5 minut)
- **ENVIRONMENT_VARIABLES.md** - Szczegółowa dokumentacja zmiennych środowiskowych
- **INTEGRATION_SUMMARY.md** - Kompletne podsumowanie integracji
- **openrouter.README.md** - Dokumentacja API serwisu OpenRouter
- **openrouter.example.ts** - 8 przykładów użycia serwisu
- **CHANGELOG.md** - Ten plik

#### Testy

- **openrouter.service.test.ts** - Testy jednostkowe serwisu OpenRouter
- **flashcardsGenerator.unit.test.ts** - Testy jednostkowe generatora (mockowane)
- **flashcardsGenerator.integration.test.ts** - Testy integracyjne z prawdziwym API

### 🔄 Zmieniono

- **generations.service.ts**
  - Zaktualizowano obsługę błędów z generatora fiszek
  - Zmieniono domyślny model na `openai/gpt-4o-mini`
  - Dodano mapowanie błędów walidacji na kod HTTP 400
  - Ulepszone logowanie błędów z szczegółowymi komunikatami

- **README.md**
  - Przepisano na język polski
  - Dodano sekcję "Funkcjonalności" z roadmapą
  - Dodano sekcję "Dokumentacja" z linkami
  - Dodano sekcję "Koszty" z szacunkami
  - Dodano instrukcje deployment
  - Zaktualizowano strukturę projektu

- **env.d.ts**
  - Zmienna `OPENROUTER_API_KEY` już była zdefiniowana ✅

### 📦 Zależności

Brak nowych zależności - wykorzystano natywne `fetch` API.

### 🔧 Konfiguracja

- Dodano wymaganą zmienną środowiskową: `OPENROUTER_API_KEY`
- Zaktualizowano dokumentację konfiguracji

### 📊 Statystyki

- **Nowe pliki:** 9
- **Zmodyfikowane pliki:** 3
- **Linie kodu:** ~2000+ nowych linii
- **Dokumentacja:** ~1500+ linii
- **Testy:** ~500+ linii

### 🎯 Breaking Changes

**Brak** - integracja jest backward compatible. Istniejące funkcjonalności działają bez zmian.

### ⚠️ Wymagania

- Node.js v22.14.0+
- Konto OpenRouter z kredytami (minimum $5)
- Zmienna środowiskowa `OPENROUTER_API_KEY`

### 🐛 Naprawiono

- Brak - to pierwsza wersja integracji

### 🔒 Bezpieczeństwo

- Klucz API przechowywany w zmiennych środowiskowych
- Walidacja wszystkich danych wejściowych
- HTTPS dla wszystkich połączeń z API
- Brak logowania wrażliwych danych

### 📝 Notatki

#### Migracja z mockowanych danych

Jeśli używałeś wcześniejszej wersji z mockowanymi danymi:

1. Dodaj `OPENROUTER_API_KEY` do `.env`
2. Dodaj kredyty na koncie OpenRouter
3. Zrestartuj serwer
4. Wszystko powinno działać automatycznie

#### Różnice w generowanych fiszkach

**Przed:**

- Proste pytania "O czym mówi zdanie nr X?"
- Maksymalnie 5 fiszek
- Szybkie (bez opóźnień)
- Darmowe

**Po:**

- Inteligentne pytania testujące zrozumienie
- 3-10 fiszek (adaptacyjnie)
- 2-5 sekund opóźnienia
- ~$0.003 za generację

## [0.1.0] - 2024-11-09

### 🎉 Dodano

- Podstawowa struktura projektu (Astro 5 + React 19 + TypeScript 5)
- Integracja z Supabase (backend + database)
- CRUD operations dla fiszek
- Historia generacji
- Filtrowanie i sortowanie
- UI z Shadcn/ui + Tailwind CSS 4
- Mockowany generator fiszek (dzielenie tekstu na zdania)
- Migracje bazy danych
- Middleware Astro
- API endpoints

### 📦 Zależności

- Astro 5.13.7
- React 19.1.1
- TypeScript 5
- Tailwind CSS 4.1.13
- Supabase 2.80.0
- Shadcn/ui components

---

## Legenda

- 🎉 **Dodano** - nowe funkcjonalności
- 🔄 **Zmieniono** - zmiany w istniejących funkcjonalnościach
- 🐛 **Naprawiono** - poprawki błędów
- 🔒 **Bezpieczeństwo** - poprawki bezpieczeństwa
- ⚠️ **Przestarzałe** - funkcjonalności do usunięcia
- 🗑️ **Usunięto** - usunięte funkcjonalności
- 📦 **Zależności** - zmiany w zależnościach
- 🔧 **Konfiguracja** - zmiany w konfiguracji
- 📝 **Dokumentacja** - zmiany w dokumentacji
- 🎯 **Breaking Changes** - zmiany łamiące kompatybilność

---

[Unreleased]: https://github.com/your-repo/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/your-repo/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/your-repo/releases/tag/v0.1.0
