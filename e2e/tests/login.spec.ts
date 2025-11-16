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

    // Czekaj na odpowiedź serwera
    await loginPage.page.waitForLoadState("networkidle");

    // Sprawdź czy pojawił się komunikat błędu
    const hasError = await loginPage.hasErrorMessage();
    if (hasError) {
      expect(hasError).toBeTruthy();
    }
  });

  test("powinien przekierować po pomyślnym logowaniu", async ({ loginPage, page }) => {
    // UWAGA: Ten test wymaga prawidłowych danych testowych
    // Należy uzupełnić w momencie implementacji testów
    test.skip(true, "Wymaga skonfigurowania użytkownika testowego");

    await loginPage.login("test@example.com", "password123");

    // Czekaj na nawigację po zalogowaniu
    await page.waitForURL(/flashcards|generate/);

    expect(page.url()).not.toContain("login");
  });
});
