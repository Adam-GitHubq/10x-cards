import { test, expect } from "../fixtures/auth.fixture";

/**
 * Test Suite dla operacji CRUD na fiszkach
 * Testuje tworzenie, odczyt, aktualizację i usuwanie fiszek
 */
test.describe("Zarządzanie fiszkami - CRUD", () => {
  test.beforeEach(async ({ authenticatedPage, flashcardsPage }) => {
    // Zalogowany użytkownik przechodzi do strony fiszek
    await flashcardsPage.navigate();
  });

  test.describe("Tworzenie fiszek", () => {
    test("TC-E2E-FLASHCARD-CREATE-01: powinien otworzyć dialog tworzenia fiszki", async ({ flashcardsPage }) => {
      await flashcardsPage.openCreateDialog();

      await expect(flashcardsPage.createDialog).toBeVisible();
      await expect(flashcardsPage.page.getByText("Dodaj ręczną fiszkę")).toBeVisible();
    });

    test("TC-E2E-FLASHCARD-CREATE-02: powinien utworzyć nową fiszkę z poprawnymi danymi", async ({
      flashcardsPage,
    }) => {
      const front = `Pytanie testowe ${Date.now()}`;
      const back = `Odpowiedź testowa ${Date.now()}`;

      await flashcardsPage.createFlashcard(front, back);

      // Czekaj aż tabela będzie widoczna (lista może się automatycznie odświeżyć)
      await flashcardsPage.table.waitFor({ state: "visible", timeout: 5000 });

      // Weryfikacja: fiszka powinna pojawić się na liście
      const count = await flashcardsPage.getFlashcardsCount();
      expect(count).toBeGreaterThan(0);

      // Sprawdź czy pierwsza fiszka zawiera naszą treść (najnowsze najpierw)
      const firstRow = flashcardsPage.page.locator('[data-testid^="flashcard-row-"]').first();
      await expect(firstRow).toContainText(front);
    });

    test("TC-E2E-FLASHCARD-CREATE-03: powinien wyświetlić błąd przy pustym przodzie", async ({ flashcardsPage }) => {
      await flashcardsPage.openCreateDialog();

      const frontInput = flashcardsPage.page.getByTestId("create-flashcard-front");
      const backInput = flashcardsPage.page.getByTestId("create-flashcard-back");
      const submitButton = flashcardsPage.page.getByTestId("create-flashcard-submit");

      await frontInput.fill("");
      await backInput.fill("Odpowiedź testowa");
      await submitButton.evaluate((button) => (button as HTMLElement).click());

      // Weryfikacja: błąd walidacji
      const error = await flashcardsPage.getCreateDialogError("front");
      expect(error).toBeTruthy();
      expect(error).toContain("nie może być pusty");
    });

    test("TC-E2E-FLASHCARD-CREATE-04: powinien wyświetlić błąd przy pustym tyle", async ({ flashcardsPage }) => {
      await flashcardsPage.openCreateDialog();

      const frontInput = flashcardsPage.page.getByTestId("create-flashcard-front");
      const backInput = flashcardsPage.page.getByTestId("create-flashcard-back");
      const submitButton = flashcardsPage.page.getByTestId("create-flashcard-submit");

      await frontInput.fill("Pytanie testowe");
      await backInput.fill("");
      await submitButton.evaluate((button) => (button as HTMLElement).click());

      // Weryfikacja: błąd walidacji
      const error = await flashcardsPage.getCreateDialogError("back");
      expect(error).toBeTruthy();
      expect(error).toContain("nie może być pusty");
    });

    test("TC-E2E-FLASHCARD-CREATE-05: powinien wyświetlić błąd przy przekroczeniu limitu znaków (przód)", async ({
      flashcardsPage,
    }) => {
      await flashcardsPage.openCreateDialog();

      const frontInput = flashcardsPage.page.getByTestId("create-flashcard-front");
      const backInput = flashcardsPage.page.getByTestId("create-flashcard-back");
      const submitButton = flashcardsPage.page.getByTestId("create-flashcard-submit");

      // Przód ma limit 200 znaków
      const longText = "a".repeat(201);
      await frontInput.fill(longText);
      await backInput.fill("Odpowiedź testowa");
      await submitButton.evaluate((button) => (button as HTMLElement).click());

      // Weryfikacja: błąd walidacji
      const error = await flashcardsPage.getCreateDialogError("front");
      expect(error).toBeTruthy();
      expect(error).toContain("maksymalnie 200 znaków");
    });

    test("TC-E2E-FLASHCARD-CREATE-06: powinien wyświetlić błąd przy przekroczeniu limitu znaków (tył)", async ({
      flashcardsPage,
    }) => {
      await flashcardsPage.openCreateDialog();

      const frontInput = flashcardsPage.page.getByTestId("create-flashcard-front");
      const backInput = flashcardsPage.page.getByTestId("create-flashcard-back");
      const submitButton = flashcardsPage.page.getByTestId("create-flashcard-submit");

      // Tył ma limit 500 znaków
      const longText = "a".repeat(501);
      await frontInput.fill("Pytanie testowe");
      await backInput.fill(longText);
      await submitButton.evaluate((button) => (button as HTMLElement).click());

      // Weryfikacja: błąd walidacji
      const error = await flashcardsPage.getCreateDialogError("back");
      expect(error).toBeTruthy();
      expect(error).toContain("maksymalnie 500 znaków");
    });

    test("TC-E2E-FLASHCARD-CREATE-07: powinien anulować tworzenie fiszki", async ({ flashcardsPage }) => {
      await flashcardsPage.openCreateDialog();

      const cancelButton = flashcardsPage.page.getByTestId("create-flashcard-cancel");
      await cancelButton.evaluate((button) => (button as HTMLElement).click());

      // Weryfikacja: dialog powinien się zamknąć
      await expect(flashcardsPage.createDialog).not.toBeVisible();
    });
  });

  test.describe("Edycja fiszek", () => {
    let testFlashcardId: number;

    test.beforeEach(async ({ flashcardsPage }) => {
      // Utwórz fiszkę testową przed każdym testem edycji
      const front = `Fiszka do edycji ${Date.now()}`;
      const back = `Odpowiedź do edycji ${Date.now()}`;

      await flashcardsPage.createFlashcard(front, back);
      
      // Czekaj aż tabela będzie widoczna
      await flashcardsPage.table.waitFor({ state: "visible", timeout: 5000 });

      // Pobierz ID pierwszej fiszki (najnowszej)
      const firstRow = flashcardsPage.page.locator('[data-testid^="flashcard-row-"]').first();
      const testId = await firstRow.getAttribute("data-testid");
      testFlashcardId = parseInt(testId?.replace("flashcard-row-", "") || "0");
    });

    test("TC-E2E-FLASHCARD-EDIT-01: powinien otworzyć dialog edycji fiszki", async ({ flashcardsPage }) => {
      await flashcardsPage.openEditDialog(testFlashcardId);

      await expect(flashcardsPage.editDialog).toBeVisible();
      await expect(flashcardsPage.page.getByText("Edytuj fiszkę")).toBeVisible();
    });

    test("TC-E2E-FLASHCARD-EDIT-02: powinien załadować dane fiszki w formularzu edycji", async ({
      flashcardsPage,
    }) => {
      await flashcardsPage.openEditDialog(testFlashcardId);

      const frontInput = flashcardsPage.page.getByTestId("edit-flashcard-front");
      const backInput = flashcardsPage.page.getByTestId("edit-flashcard-back");

      // Weryfikacja: pola powinny być wypełnione
      const frontValue = await frontInput.inputValue();
      const backValue = await backInput.inputValue();

      expect(frontValue).toContain("Fiszka do edycji");
      expect(backValue).toContain("Odpowiedź do edycji");
    });

    test("TC-E2E-FLASHCARD-EDIT-03: powinien zaktualizować fiszkę z nowymi danymi", async ({ flashcardsPage }) => {
      const newFront = `Zaktualizowane pytanie ${Date.now()}`;
      const newBack = `Zaktualizowana odpowiedź ${Date.now()}`;

      await flashcardsPage.editFlashcard(testFlashcardId, newFront, newBack);

      // Czekaj aż tabela będzie widoczna
      await flashcardsPage.table.waitFor({ state: "visible", timeout: 5000 });
      
      // Weryfikacja: fiszka powinna mieć nowe dane
      const frontText = await flashcardsPage.getFlashcardFront(testFlashcardId).textContent();
      const backText = await flashcardsPage.getFlashcardBack(testFlashcardId).textContent();

      expect(frontText).toContain(newFront);
      expect(backText).toContain(newBack);
    });

    test("TC-E2E-FLASHCARD-EDIT-04: powinien wyświetlić błąd przy pustym przodzie", async ({ flashcardsPage }) => {
      await flashcardsPage.openEditDialog(testFlashcardId);

      const frontInput = flashcardsPage.page.getByTestId("edit-flashcard-front");
      const submitButton = flashcardsPage.page.getByTestId("edit-flashcard-submit");

      await frontInput.clear();
      await frontInput.fill("");
      await submitButton.evaluate((button) => (button as HTMLElement).click());

      // Weryfikacja: błąd walidacji
      const error = await flashcardsPage.getEditDialogError("front");
      expect(error).toBeTruthy();
      expect(error).toContain("nie może być pusty");
    });

    test("TC-E2E-FLASHCARD-EDIT-05: powinien anulować edycję fiszki", async ({ flashcardsPage }) => {
      await flashcardsPage.openEditDialog(testFlashcardId);

      const cancelButton = flashcardsPage.page.getByTestId("edit-flashcard-cancel");
      await cancelButton.evaluate((button) => (button as HTMLElement).click());

      // Weryfikacja: dialog powinien się zamknąć
      await expect(flashcardsPage.editDialog).not.toBeVisible();
    });
  });

  test.describe("Usuwanie fiszek", () => {
    let testFlashcardId: number;

    test.beforeEach(async ({ flashcardsPage }) => {
      // Utwórz fiszkę testową przed każdym testem usuwania
      const front = `Fiszka do usunięcia ${Date.now()}`;
      const back = `Odpowiedź do usunięcia ${Date.now()}`;

      await flashcardsPage.createFlashcard(front, back);
      
      // Czekaj aż tabela będzie widoczna
      await flashcardsPage.table.waitFor({ state: "visible", timeout: 5000 });

      // Pobierz ID pierwszej fiszki (najnowszej)
      const firstRow = flashcardsPage.page.locator('[data-testid^="flashcard-row-"]').first();
      const testId = await firstRow.getAttribute("data-testid");
      testFlashcardId = parseInt(testId?.replace("flashcard-row-", "") || "0");
    });

    test("TC-E2E-FLASHCARD-DELETE-01: powinien otworzyć alert potwierdzenia usunięcia", async ({
      flashcardsPage,
    }) => {
      await flashcardsPage.getDeleteButton(testFlashcardId).click();

      await expect(flashcardsPage.deleteAlert).toBeVisible();
      await expect(flashcardsPage.page.getByText("Usuń fiszkę?")).toBeVisible();
      await expect(flashcardsPage.page.getByText("Tej operacji nie można cofnąć")).toBeVisible();
    });

    test("TC-E2E-FLASHCARD-DELETE-02: powinien usunąć fiszkę po potwierdzeniu", async ({ flashcardsPage }) => {
      await flashcardsPage.deleteFlashcard(testFlashcardId);

      // Czekaj aż tabela będzie widoczna
      await flashcardsPage.table.waitFor({ state: "visible", timeout: 5000 });
      
      // Weryfikacja: fiszka powinna zniknąć z listy
      const hasFlashcard = await flashcardsPage.hasFlashcard(testFlashcardId);
      expect(hasFlashcard).toBe(false);

      // Sprawdź czy fiszka rzeczywiście zniknęła z bazy (nie ma jej w DOM)
      const flashcardRow = flashcardsPage.getFlashcardRow(testFlashcardId);
      await expect(flashcardRow).not.toBeVisible();
    });

    test("TC-E2E-FLASHCARD-DELETE-03: powinien anulować usuwanie fiszki", async ({ flashcardsPage }) => {
      await flashcardsPage.getDeleteButton(testFlashcardId).click();
      await flashcardsPage.cancelDelete();

      // Weryfikacja: fiszka powinna nadal istnieć
      const hasFlashcard = await flashcardsPage.hasFlashcard(testFlashcardId);
      expect(hasFlashcard).toBe(true);
    });
  });

  test.describe("Odczyt i wyświetlanie fiszek", () => {
    test("TC-E2E-FLASHCARD-READ-01: powinien wyświetlić listę fiszek", async ({ flashcardsPage }) => {
      // Utwórz kilka fiszek testowych
      await flashcardsPage.createFlashcard("Pytanie 1", "Odpowiedź 1");
      await flashcardsPage.createFlashcard("Pytanie 2", "Odpowiedź 2");
      
      // Czekaj aż tabela będzie widoczna
      await flashcardsPage.table.waitFor({ state: "visible", timeout: 5000 });

      // Weryfikacja: lista powinna zawierać fiszki
      const count = await flashcardsPage.getFlashcardsCount();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    test("TC-E2E-FLASHCARD-READ-02: powinien wyświetlić szczegóły fiszki w wierszu tabeli", async ({
      flashcardsPage,
    }) => {
      const front = `Pytanie szczegółowe ${Date.now()}`;
      const back = `Odpowiedź szczegółowa ${Date.now()}`;

      await flashcardsPage.createFlashcard(front, back);
      
      // Czekaj aż tabela będzie widoczna
      await flashcardsPage.table.waitFor({ state: "visible", timeout: 5000 });

      // Pobierz ID pierwszej fiszki
      const firstRow = flashcardsPage.page.locator('[data-testid^="flashcard-row-"]').first();
      const testId = await firstRow.getAttribute("data-testid");
      const flashcardId = parseInt(testId?.replace("flashcard-row-", "") || "0");

      // Weryfikacja: wiersz powinien zawierać wszystkie dane
      const frontText = await flashcardsPage.getFlashcardFront(flashcardId).textContent();
      const backText = await flashcardsPage.getFlashcardBack(flashcardId).textContent();

      expect(frontText).toContain(front);
      expect(backText).toContain(back);

      // Sprawdź czy przyciski akcji są widoczne
      await expect(flashcardsPage.getEditButton(flashcardId)).toBeVisible();
      await expect(flashcardsPage.getDeleteButton(flashcardId)).toBeVisible();
    });

    test("TC-E2E-FLASHCARD-READ-03: powinien wyświetlić komunikat o pustej liście gdy brak fiszek", async ({
      flashcardsPage,
      page,
    }) => {
      // Usuń wszystkie fiszki (jeśli istnieją)
      let count = await flashcardsPage.getFlashcardsCount();
      while (count > 0) {
        const firstRow = page.locator('[data-testid^="flashcard-row-"]').first();
        const testId = await firstRow.getAttribute("data-testid");
        const flashcardId = parseInt(testId?.replace("flashcard-row-", "") || "0");
        await flashcardsPage.deleteFlashcard(flashcardId);
        
        // Czekaj aż tabela będzie widoczna lub empty state
        await page.waitForTimeout(1000);
        count = await flashcardsPage.getFlashcardsCount();
      }

      // Weryfikacja: komunikat o pustej liście
      const hasEmptyState = await flashcardsPage.hasEmptyState();
      expect(hasEmptyState).toBe(true);
    });
  });
});

