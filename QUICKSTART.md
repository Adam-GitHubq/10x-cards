# 🚀 Szybki start - OpenRouter Integration

Ten przewodnik pomoże Ci uruchomić generowanie fiszek AI w 5 minut.

## Krok 1: Uzyskaj klucz API OpenRouter

1. Zarejestruj się na https://openrouter.ai
2. Przejdź do https://openrouter.ai/keys
3. Kliknij "Create Key"
4. Skopiuj klucz (zaczyna się od `sk-or-v1-`)

## Krok 2: Dodaj kredyty

1. Przejdź do https://openrouter.ai/credits
2. Kliknij "Add Credits"
3. Dodaj minimum $5 (wystarczy na ~1500 generacji)

## Krok 3: Skonfiguruj zmienne środowiskowe

Utwórz plik `.env` w głównym katalogu projektu:

```env
# Istniejące zmienne (jeśli jeszcze nie masz)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
DEFAULT_SUPABASE_USER_ID=your-user-id

# Dodaj tę linię:
OPENROUTER_API_KEY=sk-or-v1-paste-your-key-here
```

**⚠️ Ważne:** Zamień `sk-or-v1-paste-your-key-here` na swój prawdziwy klucz!

## Krok 4: Zainstaluj zależności i uruchom

```bash
# Zainstaluj zależności (jeśli jeszcze nie zrobiłeś)
npm install

# Uruchom aplikację
npm run dev
```

## Krok 5: Przetestuj generowanie

1. Otwórz http://localhost:4321/generate
2. Wklej przykładowy tekst:

```
Fotosynteza to proces biochemiczny zachodzący w chloroplastach roślin zielonych.
Podczas fotosyntezy energia świetlna jest przekształcana w energię chemiczną.
W wyniku tego procesu powstaje glukoza i tlen, który jest uwalniany do atmosfery.
Fotosynteza jest kluczowa dla życia na Ziemi.
```

3. Kliknij "Generuj"
4. Poczekaj 2-5 sekund
5. 🎉 Gotowe! Zobaczysz wygenerowane fiszki

## Weryfikacja

Jeśli wszystko działa poprawnie, powinieneś zobaczyć:

✅ Brak błędów w konsoli  
✅ 3-10 wygenerowanych fiszek  
✅ Pytania są różnorodne i inteligentne  
✅ Odpowiedzi są zwięzłe i precyzyjne  

## Rozwiązywanie problemów

### ❌ "Brak klucza OPENROUTER_API_KEY"

**Przyczyna:** Plik `.env` nie istnieje lub zmienna nie jest ustawiona.

**Rozwiązanie:**
1. Sprawdź czy plik `.env` jest w głównym katalogu (obok `package.json`)
2. Sprawdź czy nie ma literówki w nazwie zmiennej
3. Zrestartuj serwer (`Ctrl+C` i `npm run dev`)

### ❌ "Nieprawidłowy klucz API"

**Przyczyna:** Klucz jest nieprawidłowy lub wygasł.

**Rozwiązanie:**
1. Sprawdź czy klucz zaczyna się od `sk-or-v1-`
2. Wygeneruj nowy klucz na https://openrouter.ai/keys
3. Upewnij się, że nie ma spacji przed/po kluczu

### ❌ "Insufficient credits"

**Przyczyna:** Brak kredytów na koncie OpenRouter.

**Rozwiązanie:**
1. Przejdź do https://openrouter.ai/credits
2. Dodaj kredyty (minimum $5)

### ❌ "Tekst zbyt krótki"

**Przyczyna:** Tekst ma mniej niż 50 znaków.

**Rozwiązanie:**
- Dodaj więcej treści do tekstu
- Minimum to ~2-3 zdania

## Koszty

- **Claude 3.5 Sonnet:** ~$0.003 za generację (~0.3 centa)
- **$5 kredytów:** ~1500 generacji
- **$10 kredytów:** ~3000 generacji

## Następne kroki

Po pomyślnym uruchomieniu:

1. 📖 Przeczytaj [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md) - pełne podsumowanie
2. 📚 Przeczytaj [src/lib/services/openrouter.README.md](./src/lib/services/openrouter.README.md) - dokumentacja API
3. 💡 Zobacz [src/lib/services/examples/openrouter.example.ts](./src/lib/services/examples/openrouter.example.ts) - przykłady użycia
4. 🔧 Przeczytaj [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) - szczegóły konfiguracji

## Pomoc

Jeśli masz problemy:

1. Sprawdź logi w konsoli przeglądarki (F12)
2. Sprawdź logi serwera w terminalu
3. Zobacz sekcję "Rozwiązywanie problemów" w [INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)
4. Sprawdź status API: https://status.openrouter.ai

---

**Gotowe!** 🎉 Twoja aplikacja teraz generuje fiszki przy użyciu AI!

