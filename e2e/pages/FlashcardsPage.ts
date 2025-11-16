import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * FlashcardsPage - Page Object dla strony zarządzania fiszkami
 * Implementuje Page Object Model dla łatwiejszego utrzymania testów E2E
 */
export class FlashcardsPage extends BasePage {
  // Główne elementy strony
  readonly addButton: Locator;
  readonly table: Locator;
  readonly filters: Locator;
  readonly pagination: Locator;

  // Filtry
  readonly filterSource: Locator;
  readonly filterGenerationId: Locator;
  readonly filterOrder: Locator;
  readonly filterResetButton: Locator;

  // Sortowanie
  readonly sortButton: Locator;

  // Paginacja
  readonly paginationInfo: Locator;
  readonly paginationCurrent: Locator;
  readonly paginationPrev: Locator;
  readonly paginationNext: Locator;

  // Dialogi
  readonly createDialog: Locator;
  readonly editDialog: Locator;
  readonly deleteAlert: Locator;

  constructor(page: Page) {
    super(page);

    // Główne elementy
    this.addButton = page.getByTestId("flashcards-add-button");
    this.table = page.getByTestId("flashcards-table");
    this.filters = page.getByTestId("flashcards-filters");
    this.pagination = page.getByTestId("flashcards-pagination");

    // Filtry
    this.filterSource = page.getByTestId("flashcards-filter-source");
    this.filterGenerationId = page.locator("#flashcards-generation");
    this.filterOrder = page.getByTestId("flashcards-filter-order");
    this.filterResetButton = page.getByTestId("flashcards-filter-reset");

    // Sortowanie
    this.sortButton = page.getByTestId("flashcards-sort-button");

    // Paginacja
    this.paginationInfo = page.getByTestId("flashcards-pagination-info");
    this.paginationCurrent = page.getByTestId("flashcards-pagination-current");
    this.paginationPrev = page.getByTestId("flashcards-pagination-prev");
    this.paginationNext = page.getByTestId("flashcards-pagination-next");

    // Dialogi
    this.createDialog = page.getByTestId("create-flashcard-dialog");
    this.editDialog = page.getByTestId("edit-flashcard-dialog");
    this.deleteAlert = page.getByTestId("delete-flashcard-alert");
  }

  /**
   * Nawiguje do strony fiszek
   */
  async navigate() {
    await this.goto("/flashcards");
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("networkidle");
    // Czekaj aż tabela lub komunikat o braku fiszek będzie widoczny
    await this.page.waitForSelector('[data-testid="flashcards-table"], [data-testid="flashcards-empty-state"]', {
      timeout: 10000,
    });
  }

  /**
   * Pobiera wiersz fiszki po ID
   */
  getFlashcardRow(id: number): Locator {
    return this.page.getByTestId(`flashcard-row-${id}`);
  }

  /**
   * Pobiera przycisk edycji dla fiszki
   */
  getEditButton(id: number): Locator {
    return this.page.getByTestId(`flashcard-edit-button-${id}`);
  }

  /**
   * Pobiera przycisk usunięcia dla fiszki
   */
  getDeleteButton(id: number): Locator {
    return this.page.getByTestId(`flashcard-delete-button-${id}`);
  }

  /**
   * Pobiera tekst przodu fiszki
   */
  getFlashcardFront(id: number): Locator {
    return this.page.getByTestId(`flashcard-front-${id}`);
  }

  /**
   * Pobiera tekst tyłu fiszki
   */
  getFlashcardBack(id: number): Locator {
    return this.page.getByTestId(`flashcard-back-${id}`);
  }

  /**
   * Pobiera ID generacji fiszki
   */
  getFlashcardGenerationId(id: number): Locator {
    return this.page.getByTestId(`flashcard-generation-${id}`);
  }

  /**
   * Otwiera dialog tworzenia fiszki
   */
  async openCreateDialog() {
    await this.addButton.click();
    await this.createDialog.waitFor({ state: "visible", timeout: 5000 });
  }

  /**
   * Tworzy nową fiszkę
   */
  async createFlashcard(front: string, back: string) {
    await this.openCreateDialog();

    const frontInput = this.page.getByTestId("create-flashcard-front");
    const backInput = this.page.getByTestId("create-flashcard-back");
    const submitButton = this.page.getByTestId("create-flashcard-submit");

    await frontInput.fill(front);
    await backInput.fill(back);

    // Czekaj na odpowiedź API - rozpocznij nasłuchiwanie PRZED kliknięciem
    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes("/api/flashcards") && response.request().method() === "POST",
      { timeout: 15000 }
    );

    // Użyj evaluate aby kliknąć przez JavaScript (omija problemy z viewport)
    await submitButton.evaluate((button) => (button as HTMLElement).click());

    // Czekaj na odpowiedź
    await responsePromise;

    // Czekaj aż dialog się zamknie
    await this.createDialog.waitFor({ state: "hidden", timeout: 5000 });
  }

  /**
   * Otwiera dialog edycji fiszki
   */
  async openEditDialog(id: number) {
    await this.getEditButton(id).click();
    await this.editDialog.waitFor({ state: "visible", timeout: 5000 });
  }

  /**
   * Edytuje fiszkę
   */
  async editFlashcard(id: number, front: string, back: string) {
    await this.openEditDialog(id);

    const frontInput = this.page.getByTestId("edit-flashcard-front");
    const backInput = this.page.getByTestId("edit-flashcard-back");
    const submitButton = this.page.getByTestId("edit-flashcard-submit");

    // Czekaj aż formularz się załaduje
    await frontInput.waitFor({ state: "visible" });

    await frontInput.clear();
    await frontInput.fill(front);
    await backInput.clear();
    await backInput.fill(back);

    // Czekaj na odpowiedź API - rozpocznij nasłuchiwanie PRZED kliknięciem
    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes(`/api/flashcards/${id}`) && response.request().method() === "PUT",
      { timeout: 15000 }
    );

    // Użyj evaluate aby kliknąć przez JavaScript (omija problemy z viewport)
    await submitButton.evaluate((button) => (button as HTMLElement).click());

    // Czekaj na odpowiedź
    await responsePromise;

    // Czekaj aż dialog się zamknie
    await this.editDialog.waitFor({ state: "hidden", timeout: 5000 });
  }

  /**
   * Usuwa fiszkę
   */
  async deleteFlashcard(id: number) {
    await this.getDeleteButton(id).click();
    await this.deleteAlert.waitFor({ state: "visible", timeout: 5000 });

    const confirmButton = this.page.getByTestId("delete-flashcard-confirm");

    // Czekaj na odpowiedź API - rozpocznij nasłuchiwanie PRZED kliknięciem
    const responsePromise = this.page.waitForResponse(
      (response) => response.url().includes(`/api/flashcards/${id}`) && response.request().method() === "DELETE",
      { timeout: 15000 }
    );

    // Użyj evaluate aby kliknąć przez JavaScript (omija problemy z viewport)
    await confirmButton.evaluate((button) => (button as HTMLElement).click());

    // Czekaj na odpowiedź
    await responsePromise;

    // Czekaj aż alert się zamknie
    await this.deleteAlert.waitFor({ state: "hidden", timeout: 5000 });
  }

  /**
   * Anuluje usuwanie fiszki
   */
  async cancelDelete() {
    const cancelButton = this.page.getByTestId("delete-flashcard-cancel");
    await cancelButton.evaluate((button) => (button as HTMLElement).click());
    await this.deleteAlert.waitFor({ state: "hidden", timeout: 5000 });
  }

  /**
   * Ustawia filtr źródła
   */
  async setSourceFilter(source: "all" | "manual" | "ai-full" | "ai-edited") {
    await this.filterSource.click();

    const sourceLabels = {
      all: "Wszystkie",
      manual: "Manualne",
      "ai-full": "AI",
      "ai-edited": "AI (edytowane)",
    };

    await this.page.getByRole("option", { name: sourceLabels[source] }).click();

    // Czekaj na odpowiedź API
    await this.page.waitForResponse((response) => response.url().includes("/api/flashcards"), { timeout: 10000 });
  }

  /**
   * Ustawia filtr ID generacji
   */
  async setGenerationIdFilter(generationId: string) {
    await this.filterGenerationId.fill(generationId);

    // Czekaj na debounce i odpowiedź API (1500ms debounce + request)
    await this.page.waitForTimeout(2000);
    await this.page.waitForResponse((response) => response.url().includes("/api/flashcards"), { timeout: 10000 });
  }

  /**
   * Ustawia kolejność sortowania
   */
  async setOrderFilter(order: "asc" | "desc") {
    await this.filterOrder.click();

    const orderLabels = {
      desc: "Najnowsze najpierw",
      asc: "Najstarsze najpierw",
    };

    await this.page.getByRole("option", { name: orderLabels[order] }).click();

    // Czekaj na odpowiedź API
    await this.page.waitForResponse((response) => response.url().includes("/api/flashcards"), { timeout: 10000 });
  }

  /**
   * Resetuje filtry
   */
  async resetFilters() {
    await this.filterResetButton.click();

    // Czekaj na odpowiedź API
    await this.page.waitForResponse((response) => response.url().includes("/api/flashcards"), { timeout: 10000 });
  }

  /**
   * Przełącza sortowanie (asc/desc)
   */
  async toggleSort() {
    await this.sortButton.click();

    // Czekaj na odpowiedź API
    await this.page.waitForResponse((response) => response.url().includes("/api/flashcards"), { timeout: 10000 });
  }

  /**
   * Przechodzi do następnej strony
   */
  async goToNextPage() {
    await this.paginationNext.click();

    // Czekaj na odpowiedź API
    await this.page.waitForResponse((response) => response.url().includes("/api/flashcards"), { timeout: 10000 });
  }

  /**
   * Przechodzi do poprzedniej strony
   */
  async goToPreviousPage() {
    await this.paginationPrev.click();

    // Czekaj na odpowiedź API
    await this.page.waitForResponse((response) => response.url().includes("/api/flashcards"), { timeout: 10000 });
  }

  /**
   * Sprawdza czy fiszka istnieje na liście
   */
  async hasFlashcard(id: number): Promise<boolean> {
    return await this.getFlashcardRow(id).isVisible();
  }

  /**
   * Pobiera liczbę widocznych fiszek
   */
  async getFlashcardsCount(): Promise<number> {
    const rows = await this.page.locator('[data-testid^="flashcard-row-"]').count();
    return rows;
  }

  /**
   * Pobiera informację o paginacji (np. "Wyświetlanie 1–10 z 25")
   */
  async getPaginationInfo(): Promise<string> {
    return (await this.paginationInfo.textContent()) || "";
  }

  /**
   * Pobiera aktualną stronę i łączną liczbę stron (np. "Strona 1 / 3")
   */
  async getCurrentPage(): Promise<string> {
    return (await this.paginationCurrent.textContent()) || "";
  }

  /**
   * Sprawdza czy przycisk następnej strony jest aktywny
   */
  async canGoToNextPage(): Promise<boolean> {
    return await this.paginationNext.isEnabled();
  }

  /**
   * Sprawdza czy przycisk poprzedniej strony jest aktywny
   */
  async canGoToPreviousPage(): Promise<boolean> {
    return await this.paginationPrev.isEnabled();
  }

  /**
   * Czeka na załadowanie listy fiszek
   */
  async waitForFlashcardsLoad() {
    await this.page.waitForResponse((response) => response.url().includes("/api/flashcards"), { timeout: 10000 });
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Weryfikuje czy wyświetlany jest komunikat o pustej liście
   */
  async hasEmptyState(): Promise<boolean> {
    return await this.page
      .getByTestId("flashcards-empty-state")
      .isVisible()
      .catch(() => false);
  }

  /**
   * Weryfikuje błąd walidacji w dialogu tworzenia
   */
  async getCreateDialogError(field: "front" | "back"): Promise<string | null> {
    const errorLocator = this.page.getByTestId(`create-flashcard-${field}-error`);
    const isVisible = await errorLocator.isVisible().catch(() => false);
    return isVisible ? await errorLocator.textContent() : null;
  }

  /**
   * Weryfikuje błąd walidacji w dialogu edycji
   */
  async getEditDialogError(field: "front" | "back"): Promise<string | null> {
    const errorLocator = this.page.getByTestId(`edit-flashcard-${field}-error`);
    const isVisible = await errorLocator.isVisible().catch(() => false);
    return isVisible ? await errorLocator.textContent() : null;
  }
}
