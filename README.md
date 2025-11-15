# 10xCards

Aplikacja webowa do automatycznego generowania fiszek edukacyjnych przy użyciu sztucznej inteligencji.

## Opis

10xCards to nowoczesna aplikacja umożliwiająca szybkie przekształcanie tekstu w wysokiej jakości fiszki do nauki. Wystarczy wkleić tekst, a AI automatycznie wygeneruje zestaw pytań i odpowiedzi testujących zrozumienie materiału.

## Tech Stack

- [Astro](https://astro.build/) v5 - Modern web framework
- [React](https://react.dev/) v19 - UI library
- [TypeScript](https://www.typescriptlang.org/) v5 - Type-safe JavaScript
- [Tailwind CSS](https://tailwindcss.com/) v4 - Utility-first CSS
- [Supabase](https://supabase.com/) - Backend & Database
- [OpenRouter](https://openrouter.ai/) - AI API (Claude 3.5 Sonnet)

## Wymagania

- Node.js v22.14.0 (określone w `.nvmrc`)
- npm (dołączony do Node.js)
- Konto Supabase (darmowe)
- Konto OpenRouter z kredytami (minimum $5)

## 🚀 Szybki start

**Szczegółowy przewodnik:** Zobacz [QUICKSTART.md](./QUICKSTART.md)

### 1. Klonowanie i instalacja

```bash
git clone <repository-url>
cd 10x-cards
npm install
```

### 2. Konfiguracja zmiennych środowiskowych

Utwórz plik `.env`:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
DEFAULT_SUPABASE_USER_ID=your-user-id

# OpenRouter (wymagane do generowania fiszek AI)
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

**Jak uzyskać klucze:**
- Supabase: https://app.supabase.com → Settings → API
- OpenRouter: https://openrouter.ai/keys

**Szczegóły:** Zobacz [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)

### 3. Uruchomienie

```bash
# Development
npm run dev

# Production build
npm run build
npm run preview
```

### 4. Testowanie

Otwórz http://localhost:4321/generate i wklej przykładowy tekst:

```
Fotosynteza to proces biochemiczny zachodzący w chloroplastach roślin.
Podczas fotosyntezy energia świetlna jest przekształcana w energię chemiczną.
W wyniku powstaje glukoza i tlen.
```

Kliknij "Generuj" i poczekaj na wygenerowane fiszki! 🎉

## Dostępne komendy

- `npm run dev` - Uruchom serwer deweloperski
- `npm run build` - Build produkcyjny
- `npm run preview` - Podgląd buildu produkcyjnego
- `npm run lint` - Uruchom ESLint
- `npm run lint:fix` - Napraw błędy ESLint
- `npm run format` - Formatuj kod (Prettier)

## Struktura projektu

```
.
├── src/
│   ├── layouts/              # Astro layouts
│   ├── pages/                # Astro pages
│   │   ├── api/              # API endpoints
│   │   ├── generate.astro    # Generowanie fiszek
│   │   └── flashcards.astro  # Lista fiszek
│   ├── components/           # UI components (Astro & React)
│   │   ├── ui/               # Shadcn/ui components
│   │   ├── flashcards/       # Komponenty fiszek
│   │   └── generate/         # Komponenty generowania
│   ├── lib/
│   │   ├── services/         # Serwisy biznesowe
│   │   │   ├── openrouter.service.ts      # Serwis OpenRouter
│   │   │   ├── flashcards.service.ts      # Serwis fiszek
│   │   │   ├── generations.service.ts     # Serwis generacji
│   │   │   └── ai/
│   │   │       ├── flashcardsGenerator.ts # Generator fiszek AI
│   │   │       └── openrouter.config.ts   # Konfiguracja AI
│   │   ├── schemas/          # Schematy walidacji (Zod)
│   │   └── utils/            # Utility functions
│   ├── db/                   # Supabase clients & types
│   ├── types.ts              # Shared types (DTOs)
│   └── middleware/           # Astro middleware
├── supabase/                 # Supabase migrations
└── public/                   # Public assets
```

## Funkcjonalności

### ✅ Zaimplementowane

- 🤖 **Generowanie fiszek AI** - Claude 3.5 Sonnet przez OpenRouter
- 📝 **Zarządzanie fiszkami** - CRUD operations
- 🔍 **Filtrowanie i sortowanie** - Zaawansowane filtry
- 📊 **Historia generacji** - Śledzenie wszystkich generacji
- 🎨 **Nowoczesny UI** - Shadcn/ui + Tailwind CSS
- 🔒 **Backend** - Supabase (PostgreSQL)
- ⚡ **Szybkie** - SSR + View Transitions

### 🚧 W planach

- 👤 Autentykacja użytkowników (Supabase Auth)
- 📱 Tryb nauki (flashcard review)
- 📈 Statystyki i postępy
- 🌐 Eksport/import (Anki, Quizlet)
- 🎯 Tagi i kategorie
- 🔄 Synchronizacja między urządzeniami

## Dokumentacja

### Dla użytkowników

- 🚀 [QUICKSTART.md](./QUICKSTART.md) - Szybki start (5 minut)
- 🔧 [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) - Konfiguracja zmiennych środowiskowych

### Dla deweloperów

- 📋 [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md) - Podsumowanie integracji OpenRouter
- 📖 [src/lib/services/openrouter.README.md](./src/lib/services/openrouter.README.md) - Dokumentacja API OpenRouter
- 💡 [src/lib/services/examples/openrouter.example.ts](./src/lib/services/examples/openrouter.example.ts) - Przykłady użycia

### Zasady kodowania

Projekt używa AI-assisted development z regułami w:
- `.cursor/rules/` - Zasady dla Cursor IDE
- `.github/copilot-instructions.md` - Instrukcje dla GitHub Copilot
- `.windsurfrules` - Konfiguracja Windsurf

## Koszty

### OpenRouter (AI)

- **Claude 3.5 Sonnet:** ~$0.003 za generację (~0.3 centa)
- **$5 kredytów:** ~1500 generacji
- **$10 kredytów:** ~3000 generacji

### Supabase (Backend)

- **Free tier:** 500 MB database, 2 GB transfer/miesiąc
- **Wystarczające dla:** Kilku użytkowników, tysiące fiszek
- **Upgrade:** $25/miesiąc dla większej skali

## Testowanie

```bash
# Testy jednostkowe
npm test

# Testy konkretnego pliku
npm test openrouter.service.test.ts

# Testy integracyjne (wymagają API key)
npm test flashcardsGenerator.integration.test.ts
```

## Deployment

### Vercel (zalecane)

1. Push do GitHub
2. Import projektu w Vercel
3. Dodaj zmienne środowiskowe
4. Deploy! 🚀

### Inne platformy

- Netlify
- Cloudflare Pages
- Railway
- Render

**Uwaga:** Ustaw zmienne środowiskowe w panelu platformy.

## Rozwiązywanie problemów

Zobacz sekcję "Rozwiązywanie problemów" w:
- [QUICKSTART.md](./QUICKSTART.md) - Podstawowe problemy
- [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md) - Zaawansowane problemy
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) - Problemy z konfiguracją

## Contributing

1. Fork projektu
2. Utwórz branch (`git checkout -b feature/amazing-feature`)
3. Commit zmian (`git commit -m 'Add amazing feature'`)
4. Push do brancha (`git push origin feature/amazing-feature`)
5. Otwórz Pull Request

**Zasady:**
- Przestrzegaj zasad z `.cursor/rules/`
- Dodaj testy dla nowych funkcjonalności
- Zaktualizuj dokumentację
- Używaj konwencji commit messages

## Licencja

MIT

## Autorzy

Projekt stworzony jako część kursu 10xCards.

## Wsparcie

- 📧 Email: support@10xcards.app
- 💬 Discord: [link]
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
