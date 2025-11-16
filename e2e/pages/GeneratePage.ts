import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * GeneratePage - Page Object dla strony generowania fiszek
 * Strona chroniona - wymaga autoryzacji
 */
export class GeneratePage extends BasePage {
  readonly sourceTextArea: Locator;
  readonly generateButton: Locator;
  readonly pageHeading: Locator;

  constructor(page: Page) {
    super(page);

    // Inicjalizacja lokatorów
    this.sourceTextArea = page.getByTestId("generate-source-text");
    this.generateButton = page.getByTestId("generate-submit-button");
    this.pageHeading = page.getByRole("heading", { level: 1 });
  }

  /**
   * Nawiguje do strony generowania
   */
  async navigate() {
    await this.goto("/generate");
  }

  /**
   * Sprawdza czy użytkownik jest na stronie generowania
   */
  async isOnGeneratePage() {
    return this.page.url().includes("/generate");
  }

  /**
   * Sprawdza czy formularz generowania jest widoczny
   */
  async isGenerateFormVisible() {
    return await this.sourceTextArea.isVisible();
  }

  /**
   * Sprawdza czy użytkownik ma dostęp do strony (nie został przekierowany do logowania)
   */
  async hasAccess() {
    await this.page.waitForLoadState("networkidle");
    const currentUrl = this.page.url();
    return !currentUrl.includes("/auth/login") && currentUrl.includes("/generate");
  }

  /**
   * Czeka na pełne załadowanie strony generowania
   */
  async waitForPageLoad() {
    await super.waitForPageLoad();
    await this.sourceTextArea.waitFor({ state: "visible", timeout: 5000 });
  }
}
