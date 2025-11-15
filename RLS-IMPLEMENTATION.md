# Row Level Security (RLS) - Implementacja

## ✅ Co zostało zrobione

### 1. **Migracja SQL** 
Utworzono: `supabase/migrations/20251115224500_enable_rls_policies.sql`

Migracja:
- Włącza RLS na wszystkich tabelach (`flashcards`, `generations`, `generation_error_logs`)
- Tworzy polityki bezpieczeństwa dla każdej tabeli
- Każdy użytkownik widzi tylko swoje dane (filtrowane po `user_id`)

### 2. **Zaktualizowane serwisy**
- ✅ `src/lib/services/flashcards.service.ts` - używa `locals.user.id` zamiast `DEFAULT_SUPABASE_USER_ID`
- ✅ `src/lib/services/generations.service.ts` - używa `locals.user.id` zamiast `DEFAULT_SUPABASE_USER_ID`

### 3. **Usunięte zmienne**
- ❌ `DEFAULT_SUPABASE_USER_ID` - nie jest już potrzebny
- ✅ Wszystkie operacje używają teraz prawdziwego ID użytkownika z sesji

## 🚀 Jak uruchomić migrację

### Opcja A: Supabase CLI (zalecane)
```bash
# Upewnij się że masz zainstalowane Supabase CLI
supabase db push

# Lub jeśli chcesz tylko tę jedną migrację:
supabase db push --include-all
```

### Opcja B: Supabase Dashboard
1. Przejdź do Supabase Dashboard → SQL Editor
2. Otwórz plik `supabase/migrations/20251115224500_enable_rls_policies.sql`
3. Skopiuj całą zawartość
4. Wklej do SQL Editor
5. Kliknij "Run"

## 🔐 Jak działa RLS

### Przed RLS (niebezpieczne):
```typescript
// Każdy użytkownik mógł zobaczyć wszystkie fiszki
const { data } = await supabase
  .from('flashcards')
  .select('*');
// ❌ Zwraca WSZYSTKIE fiszki ze wszystkich użytkowników
```

### Po RLS (bezpieczne):
```typescript
// Supabase automatycznie filtruje po auth.uid()
const { data } = await supabase
  .from('flashcards')
  .select('*');
// ✅ Zwraca TYLKO fiszki zalogowanego użytkownika
```

## 📋 Polityki RLS

### Tabela: `flashcards`
- ✅ **SELECT**: Użytkownik widzi tylko swoje fiszki
- ✅ **INSERT**: Użytkownik może tworzyć fiszki tylko z własnym `user_id`
- ✅ **UPDATE**: Użytkownik może edytować tylko swoje fiszki
- ✅ **DELETE**: Użytkownik może usuwać tylko swoje fiszki

### Tabela: `generations`
- ✅ **SELECT**: Użytkownik widzi tylko swoją historię generowania
- ✅ **INSERT**: Użytkownik może tworzyć generacje tylko z własnym `user_id`
- ✅ **UPDATE**: Użytkownik może aktualizować tylko swoje generacje
- ✅ **DELETE**: Użytkownik może usuwać tylko swoje generacje

### Tabela: `generation_error_logs`
- ✅ **SELECT**: Użytkownik widzi tylko swoje logi błędów
- ✅ **INSERT**: Użytkownik może tworzyć logi tylko z własnym `user_id`

## 🧪 Jak przetestować

### 1. Uruchom migrację
```bash
supabase db push
```

### 2. Usuń `DEFAULT_SUPABASE_USER_ID` z `.env`
```env
# ❌ Usuń tę linię:
DEFAULT_SUPABASE_USER_ID=...

# ✅ Zostaw tylko te:
SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SITE_URL=...
OPENROUTER_API_KEY=...
```

### 3. Restart serwera
```bash
npm run dev
```

### 4. Testuj z dwoma użytkownikami

**Krok 1: Użytkownik A**
1. Zarejestruj się jako `user-a@example.com`
2. Utwórz kilka fiszek
3. Zanotuj ID fiszki (np. `123`)

**Krok 2: Wyloguj się**
1. Kliknij UserMenu → Wyloguj się

**Krok 3: Użytkownik B**
1. Zarejestruj się jako `user-b@example.com`
2. Spróbuj pobrać fiszkę użytkownika A:
   ```
   GET /api/flashcards/123
   ```
3. ✅ Powinno zwrócić **404 Not Found** (RLS blokuje dostęp)

**Krok 4: Lista fiszek**
1. Jako `user-b@example.com` pobierz listę fiszek:
   ```
   GET /api/flashcards
   ```
2. ✅ Powinno zwrócić **pustą listę** (użytkownik B nie ma jeszcze fiszek)
3. ✅ Nie widzi fiszek użytkownika A

### 5. Sprawdź w Supabase Dashboard

Przejdź do: **Table Editor → flashcards**
- Zobaczysz wszystkie fiszki (jako admin)
- Sprawdź kolumnę `user_id` - każda fiszka ma ID właściciela
- RLS działa tylko dla zapytań z aplikacji (nie w Table Editor)

## ⚠️ Ważne uwagi

### 1. Service Role Key
`SUPABASE_SERVICE_ROLE_KEY` **omija RLS**. Używaj go tylko:
- W operacjach administracyjnych (np. usuwanie konta)
- NIGDY nie eksponuj go w kliencie
- Przechowuj tylko w zmiennych środowiskowych serwera

### 2. Middleware chroni trasy
Middleware już sprawdza czy użytkownik jest zalogowany:
```typescript
// Middleware automatycznie przekierowuje niezalogowanych
if (!user && isProtectedPath(url.pathname)) {
  return redirect('/auth/login?next=...');
}
```

### 3. RLS to dodatkowa warstwa
- Middleware = ochrona tras (czy użytkownik jest zalogowany?)
- RLS = ochrona danych (czy użytkownik ma dostęp do tego wiersza?)

## 🎯 Korzyści RLS

1. ✅ **Bezpieczeństwo na poziomie bazy** - nawet jeśli kod ma błąd, baza chroni dane
2. ✅ **Automatyczne filtrowanie** - nie musisz pamiętać o `.eq('user_id', userId)` w każdym zapytaniu
3. ✅ **Zgodność z RODO** - użytkownicy nie mogą zobaczyć danych innych użytkowników
4. ✅ **Prosty kod** - mniej boilerplate, mniej błędów

## 🐛 Troubleshooting

### Problem: "new row violates row-level security policy"
**Przyczyna**: Próbujesz wstawić wiersz z `user_id` innym niż zalogowany użytkownik.

**Rozwiązanie**: Upewnij się że używasz `locals.user.id`:
```typescript
const userId = ctx.locals.user?.id;
await supabase.from('flashcards').insert({
  ...data,
  user_id: userId, // ✅ Musi być ID zalogowanego użytkownika
});
```

### Problem: "permission denied for table"
**Przyczyna**: Użytkownik nie jest zalogowany (brak `auth.uid()`).

**Rozwiązanie**: Upewnij się że middleware ustawia `locals.user`:
```typescript
// W middleware
const { data: { user } } = await supabase.auth.getUser();
locals.user = user ? { id: user.id, email: user.email } : null;
```

### Problem: Zapytania zwracają puste wyniki
**Przyczyna**: RLS filtruje wszystko bo `user_id` w bazie nie pasuje do `auth.uid()`.

**Rozwiązanie**: 
1. Sprawdź czy `user_id` w tabeli to UUID (nie string)
2. Sprawdź czy `auth.uid()` zwraca prawidłowe ID
3. Sprawdź w SQL Editor:
   ```sql
   SELECT auth.uid(); -- Powinno zwrócić ID zalogowanego użytkownika
   ```

## ✅ Gotowe!

RLS jest teraz w pełni zaimplementowane i chroni Twoje dane! 🎉

