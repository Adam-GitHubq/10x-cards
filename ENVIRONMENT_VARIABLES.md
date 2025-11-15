# Zmienne środowiskowe

Ten dokument opisuje wszystkie zmienne środowiskowe wymagane do uruchomienia aplikacji 10xCards.

## Konfiguracja

Utwórz plik `.env` w głównym katalogu projektu i dodaj następujące zmienne:

## Wymagane zmienne

### Supabase

```env
# URL Twojego projektu Supabase
SUPABASE_URL=https://your-project.supabase.co

# Klucz publiczny (anon key) z ustawień projektu Supabase
SUPABASE_KEY=your-anon-key
```

Gdzie znaleźć:

1. Zaloguj się do [Supabase Dashboard](https://app.supabase.com)
2. Wybierz swój projekt
3. Przejdź do Settings → API
4. Skopiuj "Project URL" i "anon/public key"

### Uwierzytelnianie (tymczasowe)

```env
# Tymczasowy ID użytkownika (zostanie zastąpiony prawdziwą autentykacją)
DEFAULT_SUPABASE_USER_ID=your-user-id
```

Jak uzyskać:

1. Zaloguj się do Supabase Dashboard
2. Przejdź do Authentication → Users
3. Skopiuj UUID wybranego użytkownika

### OpenRouter API

```env
# Klucz API do OpenRouter (wymagany do generowania fiszek AI)
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

Jak uzyskać:

1. Zarejestruj się na [OpenRouter](https://openrouter.ai)
2. Przejdź do [API Keys](https://openrouter.ai/keys)
3. Utwórz nowy klucz API
4. Skopiuj klucz (zaczyna się od `sk-or-v1-`)

**Ważne:**

- Nie udostępniaj swojego klucza API publicznie
- Dodaj `.env` do `.gitignore` (już dodane)
- Klucz API jest płatny - sprawdź [cennik OpenRouter](https://openrouter.ai/docs#models)

## Przykładowy plik .env

```env
# Supabase Configuration
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Default User ID
DEFAULT_SUPABASE_USER_ID=12345678-1234-1234-1234-123456789abc

# OpenRouter API
OPENROUTER_API_KEY=sk-or-v1-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

## Weryfikacja konfiguracji

Po utworzeniu pliku `.env`, zweryfikuj konfigurację:

1. Uruchom aplikację:

   ```bash
   npm run dev
   ```

2. Sprawdź logi w konsoli - nie powinno być błędów o brakujących zmiennych

3. Przetestuj generowanie fiszek:
   - Przejdź do `/generate`
   - Wklej tekst i kliknij "Generuj"
   - Jeśli wszystko działa, zobaczysz wygenerowane fiszki

## Rozwiązywanie problemów

### Błąd: "Brak klucza OPENROUTER_API_KEY"

**Przyczyna:** Zmienna `OPENROUTER_API_KEY` nie jest ustawiona lub jest pusta.

**Rozwiązanie:**

1. Sprawdź czy plik `.env` istnieje w głównym katalogu projektu
2. Sprawdź czy zmienna jest poprawnie ustawiona (bez spacji wokół `=`)
3. Zrestartuj serwer deweloperski (`npm run dev`)

### Błąd: "Nieprawidłowy klucz API OpenRouter"

**Przyczyna:** Klucz API jest nieprawidłowy lub wygasł.

**Rozwiązanie:**

1. Sprawdź czy klucz zaczyna się od `sk-or-v1-`
2. Wygeneruj nowy klucz na [OpenRouter](https://openrouter.ai/keys)
3. Zaktualizuj `.env` i zrestartuj serwer

### Błąd: "Przekroczono limit zapytań do API"

**Przyczyna:** Wyczerpano limit zapytań lub kredytów w OpenRouter.

**Rozwiązanie:**

1. Sprawdź saldo na [OpenRouter Dashboard](https://openrouter.ai/credits)
2. Dodaj kredyty jeśli to konieczne
3. Sprawdź limity rate limit dla wybranego modelu

### Błąd: "Brak wartości DEFAULT_SUPABASE_USER_ID"

**Przyczyna:** Zmienna `DEFAULT_SUPABASE_USER_ID` nie jest ustawiona.

**Rozwiązanie:**

1. Dodaj zmienną do pliku `.env`
2. Użyj UUID istniejącego użytkownika z Supabase
3. Zrestartuj serwer

## Bezpieczeństwo

⚠️ **NIGDY NIE:**

- Commituj pliku `.env` do repozytorium
- Udostępniaj kluczy API publicznie
- Używaj kluczy produkcyjnych w środowisku deweloperskim

✅ **ZAWSZE:**

- Używaj różnych kluczy dla różnych środowisk (dev/staging/prod)
- Regularnie rotuj klucze API
- Monitoruj użycie API i koszty
- Dodaj `.env` do `.gitignore`

## Środowiska

### Development (lokalne)

Użyj pliku `.env` w głównym katalogu projektu.

### Production (Vercel/Netlify/inne)

Ustaw zmienne środowiskowe w panelu konfiguracyjnym platformy:

**Vercel:**

1. Przejdź do Settings → Environment Variables
2. Dodaj każdą zmienną osobno
3. Wybierz środowisko (Production/Preview/Development)

**Netlify:**

1. Przejdź do Site settings → Environment variables
2. Dodaj zmienne w sekcji "Environment variables"

## Więcej informacji

- [Dokumentacja Astro - Environment Variables](https://docs.astro.build/en/guides/environment-variables/)
- [Dokumentacja Supabase](https://supabase.com/docs)
- [Dokumentacja OpenRouter](https://openrouter.ai/docs)
