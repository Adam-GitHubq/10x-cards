# Konfiguracja Adaptera - Node vs Cloudflare

## Problem

Po przejściu na adapter Cloudflare w `astro.config.mjs`, testy E2E przestały działać poprawnie. Adapter Cloudflare wymaga specyficznej konfiguracji runtime, która nie jest dostępna w środowisku testowym.

## Rozwiązanie

Zaimplementowano dynamiczny wybór adaptera w zależności od środowiska:
- **Development & Testing**: Adapter Node (`@astrojs/node`)
- **Production (Cloudflare Pages)**: Adapter Cloudflare (`@astrojs/cloudflare`)

## Implementacja

### 1. Konfiguracja Astro (`astro.config.mjs`)

```javascript
import node from "@astrojs/node";
import cloudflare from "@astrojs/cloudflare";

const useNodeAdapter = process.env.USE_NODE_ADAPTER === "true" || process.env.NODE_ENV === "test";

export default defineConfig({
  // ...
  adapter: useNodeAdapter
    ? node({ mode: "standalone" })
    : cloudflare({ platformProxy: { enabled: true } }),
});
```

### 2. Skrypty NPM (`package.json`)

Wszystkie skrypty deweloperskie i testowe używają `cross-env USE_NODE_ADAPTER=true`:

```json
{
  "scripts": {
    "dev": "cross-env USE_NODE_ADAPTER=true astro dev",
    "dev:e2e": "cross-env USE_NODE_ADAPTER=true astro dev --mode test",
    "test:e2e": "cross-env USE_NODE_ADAPTER=true playwright test",
    "test:e2e:ui": "cross-env USE_NODE_ADAPTER=true playwright test --ui",
    "test:e2e:debug": "cross-env USE_NODE_ADAPTER=true playwright test --debug",
    "build": "astro build",
    "build:node": "cross-env USE_NODE_ADAPTER=true astro build"
  }
}
```

### 3. Konfiguracja Playwright (`playwright.config.ts`)

```typescript
const TEST_ENV = {
  USE_NODE_ADAPTER: process.env.USE_NODE_ADAPTER || "true",
  // ... inne zmienne
};

export default defineConfig({
  webServer: {
    command: "npm run dev:e2e -- --port 3001",
    env: TEST_ENV,
  },
});
```

### 4. GitHub Actions (`.github/workflows/pull-request.yml`)

```yaml
e2e-test:
  env:
    USE_NODE_ADAPTER: true
    # ... inne zmienne
```

## Użycie

### Lokalne developowanie
```bash
npm run dev          # Używa adaptera Node
```

### Testy E2E
```bash
npm run test:e2e     # Używa adaptera Node
npm run test:e2e:ui  # Używa adaptera Node
```

### Build produkcyjny
```bash
npm run build        # Używa adaptera Cloudflare (domyślnie)
```

### Build z adapterem Node (jeśli potrzebny)
```bash
npm run build:node   # Używa adaptera Node
```

## Dlaczego to działa?

1. **Adapter Node** jest prostszy i nie wymaga specyficznych zmiennych runtime Cloudflare
2. **Testy E2E** działają w standardowym środowisku Node.js
3. **Middleware** (`src/middleware/index.ts`) obsługuje oba adaptery:
   - Dla Cloudflare: `locals.runtime?.env`
   - Dla Node: `import.meta.env`
4. **Supabase client** (`src/db/supabaseServer.ts`) akceptuje opcjonalne `env`, więc działa z oboma adapterami

## Kompatybilność

- ✅ Testy jednostkowe (Vitest)
- ✅ Testy E2E (Playwright)
- ✅ Lokalne developowanie
- ✅ GitHub Actions CI/CD
- ✅ Produkcja na Cloudflare Pages

## Uwagi

- Zmienna `USE_NODE_ADAPTER` musi być ustawiona **przed** uruchomieniem Astro
- Cloudflare Pages automatycznie używa adaptera Cloudflare (brak zmiennej środowiskowej)
- Adapter Node jest używany tylko w środowisku deweloperskim i testowym

