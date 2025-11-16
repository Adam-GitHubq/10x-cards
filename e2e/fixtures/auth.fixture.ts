/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

/**
 * Fixtures - rozszerzenie podstawowych funkcjonalności testowych Playwright
 * Umożliwia łatwe użycie Page Objects i współdzielenie konfiguracji
 */
type AuthFixtures = {
  loginPage: LoginPage;
};

/**
 * Rozszerzony test z dostępem do Page Objects
 */
export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
});

export { expect } from "@playwright/test";
