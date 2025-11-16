# Setup E2E Tests - Przewodnik konfiguracji

## Wymagania wstępne

1. **Node.js** (v18 lub nowszy)
2. **npm** lub **yarn**
3. **Konto Supabase** z aktywnym projektem
4. **Playwright** (instalowany automatycznie)

## Krok 1: Instalacja zależności

```bash
npm install
```

## Krok 2: Instalacja Playwright

```bash
npx playwright install chromium
```

## Krok 3: Konfiguracja zmiennych środowiskowych

### 3.1. Skopiuj plik przykładowy

```bash
cp .env.test.example .env.test
```

### 3.2. Uzupełnij dane Supabase

Otwórz plik `.env.test` i uzupełnij:

```env
SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_KEY=twoj-anon-key
```

Dane znajdziesz w:
- Supabase Dashboard → Settings → API

### 3.3. Uzupełnij klucz OpenRouter (opcjonalnie)

Jeśli chcesz testować generowanie fiszek:

```env
OPENROUTER_API_KEY=twoj-klucz-openrouter
```

## Krok 4: Utworzenie użytkownika testowego

### Opcja A: Przez Supabase Dashboard (zalecane)

1. Otwórz Supabase Dashboard
2. Przejdź do **Authentication** → **Users**
3. Kliknij **Add User** → **Create new user**
4. Wypełnij formularz:
   - **Email:** `test@example.com` (lub inny)
   - **Password:** `TestPassword123` (lub inne - min. 8 znaków, litera + cyfra)
   - **Auto Confirm User:** ✅ (zaznacz!)
5. Kliknij **Create User**
6. Skopiuj **User UID** z listy użytkowników

### Opcja B: Przez SQL Editor

1. Otwórz Supabase Dashboard → **SQL Editor**
2. Wykonaj zapytanie:

```sql
-- Utwórz użytkownika testowego
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(), -- To będzie E2E_USERNAME_ID
  'authenticated',
  'authenticated',
  'test@example.com', -- To będzie E2E_USERNAME
  crypt('TestPassword123', gen_salt('bf')), -- To będzie E2E_PASSWORD
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
RETURNING id, email;
```

3. Skopiuj zwrócone `id` (UUID użytkownika)

### Opcja C: Przez Supabase Auth API

```bash
curl -X POST 'https://twoj-projekt.supabase.co/auth/v1/admin/users' \
  -H "apikey: TWOJ_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer TWOJ_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "email_confirm": true
  }'
```

**UWAGA:** Użyj `service_role` key, nie `anon` key!

## Krok 5: Uzupełnij dane użytkownika testowego w .env.test

```env
E2E_USERNAME_ID=uuid-z-kroku-4
E2E_USERNAME=test@example.com
E2E_PASSWORD=TestPassword123
```

## Krok 6: Weryfikacja konfiguracji

### 6.1. Sprawdź czy użytkownik może się zalogować

Otwórz aplikację w przeglądarce i spróbuj się zalogować:
- URL: `http://localhost:4321/auth/login`
- Email: wartość z `E2E_USERNAME`
- Hasło: wartość z `E2E_PASSWORD`

### 6.2. Uruchom test weryfikacyjny

```bash
npx playwright test login.spec.ts -g "powinien wyświetlić formularz"
```

Jeśli test przeszedł ✅ - konfiguracja jest poprawna!

## Krok 7: Uruchom wszystkie testy

```bash
npm run test:e2e
```

lub

```bash
npx playwright test
```

## Troubleshooting

### Problem: "E2E_USERNAME and E2E_PASSWORD must be set"

**Rozwiązanie:**
- Sprawdź czy plik `.env.test` istnieje
- Sprawdź czy zmienne są poprawnie ustawione (bez cudzysłowów)
- Zrestartuj terminal

### Problem: "Invalid login credentials"

**Możliwe przyczyny:**
1. Użytkownik nie istnieje w bazie
2. Hasło jest nieprawidłowe
3. Email nie został potwierdzony (`email_confirmed_at` jest NULL)

**Rozwiązanie:**
```sql
-- Potwierdź email użytkownika
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'test@example.com';
```

### Problem: "User already registered"

**Rozwiązanie:**
- Użytkownik już istnieje - użyj go lub usuń i utwórz ponownie
- Możesz zmienić email w `.env.test` na inny

### Problem: Testy timeout

**Rozwiązanie:**
1. Sprawdź czy serwer dev działa: `npm run dev:e2e`
2. Zwiększ timeout w `playwright.config.ts`:
   ```typescript
   use: {
     timeout: 30000, // 30 sekund
   }
   ```

### Problem: "Cannot connect to Supabase"

**Rozwiązanie:**
- Sprawdź `SUPABASE_URL` i `SUPABASE_KEY`
- Sprawdź połączenie internetowe
- Sprawdź status Supabase: https://status.supabase.com

## Bezpieczeństwo

### ⚠️ WAŻNE

1. **NIE commituj pliku `.env.test`** do repozytorium
2. **NIE używaj prawdziwych danych użytkowników** w testach
3. **Użyj dedykowanego projektu Supabase** dla testów E2E
4. **Regularnie zmieniaj hasło** użytkownika testowego
5. **Ogranicz uprawnienia** użytkownika testowego (tylko do niezbędnych)

### Zalecana konfiguracja CI/CD

Dla GitHub Actions / GitLab CI:

```yaml
env:
  E2E_USERNAME: ${{ secrets.E2E_USERNAME }}
  E2E_PASSWORD: ${{ secrets.E2E_PASSWORD }}
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
```

Dodaj secrets w ustawieniach repozytorium.

## Czyszczenie danych testowych

Po testach możesz chcieć wyczyścić dane:

```sql
-- Usuń fiszki utworzone przez użytkownika testowego
DELETE FROM flashcards 
WHERE user_id = 'E2E_USERNAME_ID';

-- Usuń generacje
DELETE FROM generations 
WHERE user_id = 'E2E_USERNAME_ID';
```

**UWAGA:** NIE usuwaj samego użytkownika testowego - będzie potrzebny do kolejnych testów.

## Następne kroki

Po pomyślnej konfiguracji:

1. Przeczytaj [README-AUTH-TESTS.md](./README-AUTH-TESTS.md)
2. Uruchom wszystkie testy: `npm run test:e2e`
3. Eksploruj testy w trybie UI: `npx playwright test --ui`
4. Sprawdź raport HTML: `npx playwright show-report`

## Pomoc

Jeśli masz problemy:
1. Sprawdź [Playwright Documentation](https://playwright.dev)
2. Sprawdź [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
3. Otwórz issue w repozytorium projektu

