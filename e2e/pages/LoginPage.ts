import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * LoginPage - Page Object dla strony logowania
 * Implementuje Page Object Model dla łatwiejszego utrzymania testów
 */
export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);

    // Inicjalizacja lokatorów - używamy data-testid (potwierdzone w testach diagnostycznych)
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-button");
    this.errorMessage = page.getByTestId("login-status-message");
  }

  /**
   * Nawiguje do strony logowania
   */
  async navigate() {
    await this.goto("/auth/login");
    // Czekaj na pełne załadowanie strony i hydratację React
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("networkidle");
    // Czekaj aż formularz będzie gotowy i interaktywny
    await this.emailInput.waitFor({ state: "visible" });
    await this.submitButton.waitFor({ state: "visible" });
  }

  /**
   * Wypełnia formularz logowania
   */
  async fillLoginForm(email: string, password: string) {
    // Czekaj aż pola będą widoczne i interaktywne
    await this.emailInput.waitFor({ state: "visible" });
    await this.passwordInput.waitFor({ state: "visible" });

    // Wyczyść i wypełnij pola
    await this.emailInput.clear();
    await this.emailInput.fill(email);

    await this.passwordInput.clear();
    await this.passwordInput.fill(password);
  }

  /**
   * Wysyła formularz logowania
   */
  async submit() {
    await this.submitButton.waitFor({ state: "visible" });
    await this.submitButton.click();
  }

  /**
   * Wykonuje pełną procedurę logowania
   */
  async login(email: string, password: string) {
    await this.fillLoginForm(email, password);

    // Czekaj na żądanie API podczas submitu
    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes("/api/auth/login") && response.request().method() === "POST",
      { timeout: 10000 }
    );

    await this.submit();

    // Czekaj na odpowiedź z API
    await responsePromise;

    // Daj czas na renderowanie komunikatu
    await this.page.waitForTimeout(500);
  }

  /**
   * Sprawdza czy wyświetlany jest komunikat błędu
   */
  async hasErrorMessage() {
    return await this.errorMessage.isVisible();
  }

  /**
   * Pobiera treść komunikatu błędu
   */
  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }

  /**
   * Sprawdza czy wyświetlany jest komunikat sukcesu
   */
  async hasSuccessMessage() {
    const statusType = await this.errorMessage.getAttribute("data-status-type");
    return statusType === "success";
  }

  /**
   * Czeka na komunikat sukcesu logowania
   */
  async waitForSuccessMessage() {
    await this.errorMessage.waitFor({ state: "visible" });
    const statusType = await this.errorMessage.getAttribute("data-status-type");
    if (statusType !== "success") {
      throw new Error(`Expected success message, but got status type: ${statusType}`);
    }
  }

  /**
   * Czeka na przekierowanie po zalogowaniu
   */
  async waitForRedirect(expectedPath = "/generate") {
    await this.page.waitForURL(`**${expectedPath}`, { timeout: 10000 });
  }

  /**
   * Wykonuje pełny flow logowania z weryfikacją
   */
  async loginAndVerify(email: string, password: string, expectedRedirect = "/generate") {
    await this.login(email, password);
    await this.waitForRedirect(expectedRedirect);
  }
}
