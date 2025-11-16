// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";
import node from "@astrojs/node";

// Wybór adaptera w zależności od środowiska
// Dla testów E2E i lokalnego developmentu używamy Node
// Dla produkcji (Cloudflare Pages) używamy Cloudflare
const useNodeAdapter = process.env.USE_NODE_ADAPTER === "true" || process.env.NODE_ENV === "test";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: useNodeAdapter
    ? node({
        mode: "standalone",
      })
    : cloudflare({
        platformProxy: {
          enabled: true,
        },
      }),
});
