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

    // Inicjalizacja lokatorów
    this.emailInput = page.getByLabel("E-mail", { exact: true });
    this.passwordInput = page.getByLabel("Hasło", { exact: true });
    this.submitButton = page.getByRole("button", { name: "Zaloguj się" });
    this.errorMessage = page.locator('[role="status"]');
  }

  /**
   * Nawiguje do strony logowania
   */
  async navigate() {
    await this.goto("/auth/login");
  }

  /**
   * Wypełnia formularz logowania
   */
  async fillLoginForm(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /**
   * Wysyła formularz logowania
   */
  async submit() {
    await this.submitButton.click();
  }

  /**
   * Wykonuje pełną procedurę logowania
   */
  async login(email: string, password: string) {
    await this.fillLoginForm(email, password);
    await this.submit();
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
}
