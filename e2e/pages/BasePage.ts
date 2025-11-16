import { Page } from '@playwright/test';

/**
 * BasePage - klasa bazowa dla wszystkich Page Objects
 * Zawiera wspólne metody i właściwości używane przez wszystkie strony
 */
export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Nawiguje do określonego URL
   */
  async goto(path: string) {
    await this.page.goto(path);
  }

  /**
   * Czeka na załadowanie strony
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Pobiera tytuł strony
   */
  async getTitle() {
    return await this.page.title();
  }

  /**
   * Wykonuje screenshot strony
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }
}

