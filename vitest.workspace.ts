import { defineWorkspace } from "vitest/config";

/**
 * Workspace Vitest - pozwala na definiowanie różnych konfiguracji
 * dla różnych typów testów (unit, integration, etc.)
 */
export default defineWorkspace([
  // Testy jednostkowe
  {
    extends: "./vitest.config.ts",
    test: {
      name: "unit",
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      exclude: ["src/**/*.integration.{test,spec}.{ts,tsx}", "e2e/**"],
      environment: "happy-dom",
    },
  },
  // Testy integracyjne
  {
    extends: "./vitest.config.ts",
    test: {
      name: "integration",
      include: ["src/**/*.integration.{test,spec}.{ts,tsx}"],
      exclude: ["e2e/**"],
      environment: "happy-dom",
      // Testy integracyjne mogą wymagać dłuższego timeoutu
      testTimeout: 10000,
    },
  },
]);
