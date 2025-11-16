/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { GeneratePage } from "../pages/GeneratePage";

/**
 * Fixtures - rozszerzenie podstawowych funkcjonalności testowych Playwright
 * Umożliwia łatwe użycie Page Objects i współdzielenie konfiguracji
 */
type AuthFixtures = {
  loginPage: LoginPage;
  generatePage: GeneratePage;
  authenticatedPage: { page: import("@playwright/test").Page };
};

/**
 * Rozszerzony test z dostępem do Page Objects
 */
export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  generatePage: async ({ page }, use) => {
    const generatePage = new GeneratePage(page);
    await use(generatePage);
  },

  /**
   * Fixture dla zalogowanego użytkownika
   * Automatycznie loguje użytkownika testowego przed testem
   */
  authenticatedPage: async ({ page }, use) => {
    const email = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    if (!email || !password) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in environment variables for authenticated tests");
    }

    // Logowanie użytkownika
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(email, password);

    // Czekaj na przekierowanie do strony chronionej
    await page.waitForURL("**/generate", { timeout: 10000 });

    await use({ page });

    // Cleanup - wylogowanie po teście
    // Możemy to zrobić przez API lub przez UI
    try {
      await page.request.post("/api/auth/logout");
    } catch (error) {
      // Ignoruj błędy wylogowania w cleanup
      // eslint-disable-next-line no-console
      console.warn("Logout cleanup failed:", error);
    }
  },
});

export { expect } from "@playwright/test";
