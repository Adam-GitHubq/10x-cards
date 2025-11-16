import { test, expect } from "../fixtures/auth.fixture";

/**
 * Test Suite dla pełnego flow autoryzacji
 * Testuje logowanie, dostęp do chronionych stron i wylogowanie
 */
test.describe("Autoryzacja użytkownika", () => {
  const testEmail = process.env.E2E_USERNAME || "";
  const testPassword = process.env.E2E_PASSWORD || "";

  test.beforeAll(() => {
    if (!testEmail || !testPassword) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test file");
    }
  });

  test.describe("Logowanie z poprawnymi danymi", () => {
    test("powinien zalogować użytkownika i przekierować do /generate", async ({ loginPage, page }) => {
      await loginPage.navigate();

      // Wypełnij formularz logowania
      await loginPage.login(testEmail, testPassword);

      // Czekaj na przekierowanie
      await loginPage.waitForRedirect("/generate");

      // Weryfikuj że jesteśmy na stronie generowania
      expect(page.url()).toContain("/generate");
    });

    test("powinien wyświetlić komunikat sukcesu przed przekierowaniem", async ({ loginPage }) => {
      await loginPage.navigate();
      await loginPage.fillLoginForm(testEmail, testPassword);
      await loginPage.submit();

      // Czekaj na komunikat sukcesu
      await loginPage.waitForSuccessMessage();

      // Weryfikuj treść komunikatu
      const message = await loginPage.getErrorMessage();
      expect(message).toContain("Logowanie zakończone sukcesem");
    });

    test("powinien zachować parametr 'next' w URL po zalogowaniu", async ({ loginPage, page }) => {
      // Przejdź do logowania z parametrem next
      await page.goto("/auth/login?next=/flashcards");
      await page.waitForLoadState("networkidle");

      // Czekaj aż formularz będzie gotowy
      await loginPage.emailInput.waitFor({ state: "visible" });

      // Wypełnij formularz bez użycia metody login() (która czeka na /api/auth/login)
      await loginPage.fillLoginForm(testEmail, testPassword);

      // Czekaj na odpowiedź API
      const responsePromise = page.waitForResponse(
        (response) => response.url().includes("/api/auth/login") && response.request().method() === "POST"
      );

      await loginPage.submit();
      await responsePromise;

      // Powinien przekierować do /flashcards zamiast /generate
      await page.waitForURL("**/flashcards", { timeout: 10000 });
      expect(page.url()).toContain("/flashcards");
    });
  });

  test.describe("Dostęp do chronionych stron", () => {
    test("zalogowany użytkownik powinien mieć dostęp do /generate", async ({ authenticatedPage, generatePage }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { page } = authenticatedPage;

      await generatePage.navigate();
      await generatePage.waitForPageLoad();

      // Weryfikuj że jesteśmy na stronie i formularz jest widoczny
      expect(await generatePage.isOnGeneratePage()).toBe(true);
      expect(await generatePage.isGenerateFormVisible()).toBe(true);
    });

    test("zalogowany użytkownik powinien mieć dostęp do /flashcards", async ({ authenticatedPage }) => {
      const { page } = authenticatedPage;

      await page.goto("/flashcards");
      await page.waitForLoadState("networkidle");

      // Weryfikuj że nie zostaliśmy przekierowani do logowania
      expect(page.url()).toContain("/flashcards");
      expect(page.url()).not.toContain("/auth/login");
    });

    test("niezalogowany użytkownik powinien być przekierowany z /generate do /auth/login", async ({
      page,
      generatePage,
    }) => {
      await generatePage.navigate();

      // Czekaj na przekierowanie do logowania
      await page.waitForURL("**/auth/login**", { timeout: 10000 });

      expect(page.url()).toContain("/auth/login");
    });

    test("niezalogowany użytkownik powinien być przekierowany z /flashcards do /auth/login z parametrem next", async ({
      page,
    }) => {
      await page.goto("/flashcards");

      // Czekaj na przekierowanie
      await page.waitForURL("**/auth/login**", { timeout: 10000 });

      // Weryfikuj że URL zawiera parametr next
      const url = new URL(page.url());
      expect(url.pathname).toBe("/auth/login");
      expect(url.searchParams.get("next")).toBe("/flashcards");
    });
  });

  test.describe("Przekierowania dla zalogowanych użytkowników", () => {
    test("zalogowany użytkownik próbujący wejść na /auth/login powinien być przekierowany do /generate", async ({
      authenticatedPage,
    }) => {
      const { page } = authenticatedPage;

      // Nawiguj bezpośrednio - middleware przekieruje
      await page.goto("/auth/login");

      // Czekaj na przekierowanie
      await page.waitForURL("**/generate", { timeout: 10000 });

      expect(page.url()).toContain("/generate");
      expect(page.url()).not.toContain("/auth/login");
    });

    test("zalogowany użytkownik próbujący wejść na /auth/register powinien być przekierowany do /generate", async ({
      authenticatedPage,
    }) => {
      const { page } = authenticatedPage;

      await page.goto("/auth/register");

      // Czekaj na przekierowanie
      await page.waitForURL("**/generate", { timeout: 10000 });

      expect(page.url()).toContain("/generate");
      expect(page.url()).not.toContain("/auth/register");
    });
  });

  test.describe("Wylogowanie", () => {
    test("powinien wylogować użytkownika i przekierować do logowania przy próbie dostępu do chronionej strony", async ({
      authenticatedPage,
      generatePage,
    }) => {
      const { page } = authenticatedPage;

      // Wyloguj przez API
      await page.request.post("/api/auth/logout");

      // Spróbuj wejść na chronioną stronę
      await generatePage.navigate();

      // Powinien przekierować do logowania
      await page.waitForURL("**/auth/login**", { timeout: 10000 });
      expect(page.url()).toContain("/auth/login");
    });

    test("po wylogowaniu sesja powinna być unieważniona", async ({ authenticatedPage }) => {
      const { page } = authenticatedPage;

      // Wyloguj
      const response = await page.request.post("/api/auth/logout");
      expect(response.status()).toBe(204);

      // Spróbuj wejść na chronioną stronę
      await page.goto("/generate");
      await page.waitForLoadState("networkidle");

      // Powinien przekierować do logowania
      expect(page.url()).toContain("/auth/login");
    });
  });

  test.describe("Trwałość sesji", () => {
    test("sesja powinna być zachowana po odświeżeniu strony", async ({ authenticatedPage, generatePage }) => {
      const { page } = authenticatedPage;

      await generatePage.navigate();
      await generatePage.waitForPageLoad();

      // Odśwież stronę
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Powinniśmy nadal być na stronie generowania
      expect(await generatePage.isOnGeneratePage()).toBe(true);
      expect(await generatePage.isGenerateFormVisible()).toBe(true);
    });

    test("sesja powinna być zachowana podczas nawigacji między stronami", async ({ authenticatedPage }) => {
      const { page } = authenticatedPage;

      // Nawiguj do różnych chronionych stron
      await page.goto("/generate");
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain("/generate");

      await page.goto("/flashcards");
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain("/flashcards");

      // Wróć do generate
      await page.goto("/generate");
      await page.waitForLoadState("networkidle");
      expect(page.url()).toContain("/generate");
    });
  });

  test.describe("Bezpieczeństwo", () => {
    test("nie powinien zalogować użytkownika z nieprawidłowym hasłem", async ({ loginPage }) => {
      await loginPage.navigate();
      await loginPage.login(testEmail, "nieprawidlowe-haslo-123");

      // Czekaj na odpowiedź serwera
      await loginPage.page.waitForLoadState("networkidle");

      // Powinniśmy nadal być na stronie logowania
      expect(loginPage.page.url()).toContain("/auth/login");

      // Sprawdź czy pojawił się komunikat błędu
      const hasError = await loginPage.hasErrorMessage();
      expect(hasError).toBe(true);

      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage).toContain("Nieprawidłowy");
    });

    test("nie powinien zalogować użytkownika z nieistniejącym emailem", async ({ loginPage }) => {
      await loginPage.navigate();
      await loginPage.login("nieistniejacy-uzytkownik@example.com", "haslo123");

      await loginPage.page.waitForLoadState("networkidle");

      // Powinniśmy nadal być na stronie logowania
      expect(loginPage.page.url()).toContain("/auth/login");

      // Sprawdź komunikat błędu
      const hasError = await loginPage.hasErrorMessage();
      expect(hasError).toBe(true);
    });

    test("powinien zabezpieczyć dostęp do API bez autoryzacji", async ({ page }) => {
      // Spróbuj wywołać API endpoint wymagający autoryzacji bez sesji
      const response = await page.request.get("/api/flashcards");

      // Powinien zwrócić błąd autoryzacji
      expect(response.status()).toBeGreaterThanOrEqual(401);
    });
  });
});
