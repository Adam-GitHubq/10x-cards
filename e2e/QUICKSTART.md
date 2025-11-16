# Szybki start - Testy E2E

## TL;DR - Pierwsze uruchomienie

```bash
# 1. Uruchom Supabase Local (tylko pierwszy raz lub po restarcie systemu)
npm run supabase:start

# 2. Uruchom testy e2e
npm run test:e2e
```

## Co się dzieje?

### Krok 1: `npm run supabase:start`

Uruchamia lokalną instancję Supabase (wymaga Docker):
- **PostgreSQL** na porcie `54322`
- **Supabase API** na porcie `54321`
- **Stosuje migracje** z `supabase/migrations/`

To zajmie ~30-60 sekund przy pierwszym uruchomieniu (pobieranie obrazów Docker).

**Sprawdzenie czy działa:**
```bash
# Status Supabase Local
supabase status
```

Powinieneś zobaczyć:
```
API URL: http://127.0.0.1:54321
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
```

### Krok 2: `npm run test:e2e`

Playwright automatycznie:
1. Uruchamia aplikację na porcie **3001** z konfiguracją testową
2. Aplikacja łączy się z **Supabase Local** (nie z Twoją dev bazą!)
3. Uruchamia testy
4. Zatrzymuje aplikację

## Izolacja danych

✅ **Twoje dane deweloperskie są bezpieczne!**

```
┌─────────────────────────┐
│  Dev Server (port 3000) │
│  ↓                      │
│  Twoja baza Supabase    │  ← Twoje prawdziwe dane
└─────────────────────────┘

┌─────────────────────────┐
│  E2E Tests (port 3001)  │
│  ↓                      │
│  Supabase Local (54321) │  ← Dane testowe (czyścimy po testach)
└─────────────────────────┘
```

## Przydatne komendy

```bash
# Zatrzymaj Supabase Local
npm run supabase:stop

# Resetuj bazę testową (usuń wszystkie dane, zastosuj migracje)
npm run supabase:reset

# Testy w trybie UI (interaktywny)
npm run test:e2e:ui

# Testy z debuggerem
npm run test:e2e:debug

# Pokaż ostatni raport
npm run test:e2e:report

# Otwórz Supabase Studio (GUI dla bazy testowej)
# URL: http://127.0.0.1:54323
```

## Troubleshooting

### Problem: "Timed out waiting from config.webServer"

**Rozwiązanie 1**: Sprawdź czy używasz Node 22.9.0
```bash
nvs use 22.9.0
npm run test:e2e
```

**Rozwiązanie 2**: Sprawdź czy Supabase Local działa
```bash
supabase status
```

Jeśli nie działa:
```bash
npm run supabase:stop
npm run supabase:start
```

### Problem: "Port 3001 already in use"

Masz uruchomione testy lub aplikację testową w tle:

```bash
# Windows PowerShell
Get-NetTCPConnection -LocalPort 3001 | Select-Object OwningProcess
Stop-Process -Id <PID>

# Lub zabij wszystkie procesy Node
taskkill /F /IM node.exe
```

### Problem: "Database connection error"

Supabase Local nie działa lub nie zastosował migracji:

```bash
npm run supabase:stop
npm run supabase:start
```

### Problem: "Cannot connect to Docker"

Upewnij się że Docker Desktop jest uruchomiony.

```bash
docker ps
```

Jeśli nie działa, uruchom Docker Desktop i spróbuj ponownie.

## Workflow deweloperski

### Typowy dzień z testami e2e:

```bash
# Rano / po restarcie systemu
npm run supabase:start

# Pracujesz z dev serverem
npm run dev   # Port 3000, używa Twojej bazy

# Przed commitem - uruchamiasz testy
npm run test:e2e   # Port 3001, używa Supabase Local

# Wieczorem (opcjonalne)
npm run supabase:stop
```

### Przed pull requestem:

```bash
# 1. Upewnij się że Supabase Local działa
supabase status

# 2. Resetuj bazę testową (świeże dane)
npm run supabase:reset

# 3. Uruchom wszystkie testy
npm run test:e2e

# 4. Sprawdź raport
npm run test:e2e:report
```

## FAQ

**Q: Czy muszę uruchamiać Supabase Local za każdym razem?**
A: Nie. Jeśli uruchomiłeś `npm run supabase:start`, działa w tle do momentu restartu systemu lub `npm run supabase:stop`.

**Q: Czy mogę uruchomić dev server i testy jednocześnie?**
A: Tak! Używają różnych portów (3000 vs 3001) i różnych baz danych.

**Q: Czy Supabase Local zużywa dużo zasobów?**
A: Wymaga Docker (zużywa ~500MB RAM). Możesz go zatrzymać gdy nie testujesz.

**Q: Jak dodać dane testowe?**
A: Utwórz seed script w `supabase/seed.sql` lub dodaj setup w test fixtures.

**Q: Czy muszę mieć Docker?**
A: Tak, Supabase Local wymaga Docker Desktop.

