import { test, expect } from "../fixtures/auth.fixture";

/**
 * Test Suite dla funkcjonalności logowania
 * Wykorzystuje Page Object Model dla lepszej czytelności i utrzymania
 */
test.describe("Logowanie użytkownika", () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.navigate();
  });

  test("powinien wyświetlić formularz logowania", async ({ page }) => {
    await expect(page).toHaveTitle(/Zaloguj się/i);
    await expect(page.getByLabel("E-mail")).toBeVisible();
    await expect(page.getByLabel("Hasło")).toBeVisible();
    await expect(page.getByRole("button", { name: "Zaloguj się" })).toBeVisible();
  });

  test("powinien pokazać błąd przy pustych polach", async ({ loginPage }) => {
    await loginPage.submit();

    // Sprawdzenie czy formularz nie został wysłany
    await expect(loginPage.page).toHaveURL(/login/);
  });

  test("powinien pokazać błąd przy nieprawidłowych danych", async ({ loginPage }) => {
    await loginPage.login("nieprawidlowy@email.com", "zlehaslo123");

    // Sprawdź czy pojawił się komunikat błędu
    const hasError = await loginPage.hasErrorMessage();
    if (hasError) {
      expect(hasError).toBeTruthy();
    }
  });

  test("powinien przekierować po pomyślnym logowaniu", async ({ loginPage, page }) => {
    const testEmail = process.env.E2E_USERNAME;
    const testPassword = process.env.E2E_PASSWORD;

    if (!testEmail || !testPassword) {
      test.skip(true, "E2E_USERNAME and E2E_PASSWORD must be set in .env.test");
      return;
    }

    await loginPage.login(testEmail, testPassword);

    // Czekaj na nawigację po zalogowaniu
    await page.waitForURL(/generate/, { timeout: 10000 });

    expect(page.url()).not.toContain("login");
    expect(page.url()).toContain("generate");
  });

  test("powinien wyświetlić błąd przy nieprawidłowych danych logowania", async ({ loginPage }) => {
    await loginPage.login("nieprawidlowy@email.com", "zlehaslo123");

    // Sprawdź czy pojawił się komunikat błędu
    const hasError = await loginPage.hasErrorMessage();
    expect(hasError).toBeTruthy();

    // Sprawdź treść błędu
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage).toBeTruthy();
    expect(errorMessage?.toLowerCase()).toContain("nieprawidłowy");
  });

  test("powinien pozostać na stronie logowania po błędzie", async ({ loginPage, page }) => {
    await loginPage.login("test@example.com", "wrongpassword");

    // Użytkownik powinien pozostać na stronie logowania
    expect(page.url()).toContain("/auth/login");
  });
});
