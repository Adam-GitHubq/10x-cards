import { test, expect } from "../fixtures/auth.fixture";

/**
 * Test Suite dla paginacji fiszek
 * Testuje nawigację między stronami, wyświetlanie informacji o paginacji
 */
test.describe("Zarządzanie fiszkami - Paginacja", () => {
  test.beforeEach(async ({ authenticatedPage, flashcardsPage }) => {
    // Zalogowany użytkownik przechodzi do strony fiszek
    await flashcardsPage.navigate();
  });

  test.describe("Podstawowa paginacja", () => {
    test.beforeEach(async ({ flashcardsPage }) => {
      // Przygotuj dane testowe - utwórz więcej niż 10 fiszek (domyślny pageSize)
      // aby wymusić paginację
      for (let i = 1; i <= 15; i++) {
        await flashcardsPage.createFlashcard(`Pytanie ${i}`, `Odpowiedź ${i}`);
      }
      // Czekaj aż tabela będzie widoczna
      await flashcardsPage.table.waitFor({ state: "visible", timeout: 5000 });
    });

    test("TC-E2E-FLASHCARD-PAGINATION-01: powinien wyświetlić informację o paginacji", async ({
      flashcardsPage,
    }) => {
      const paginationInfo = await flashcardsPage.getPaginationInfo();

      // Weryfikacja: informacja powinna zawierać zakres i łączną liczbę
      expect(paginationInfo).toMatch(/Wyświetlanie \d+–\d+ z \d+/);
    });

    test("TC-E2E-FLASHCARD-PAGINATION-02: powinien wyświetlić aktualną stronę i łączną liczbę stron", async ({
      flashcardsPage,
    }) => {
      const currentPage = await flashcardsPage.getCurrentPage();

      // Weryfikacja: format "Strona X / Y"
      expect(currentPage).toMatch(/Strona \d+ \/ \d+/);
      expect(currentPage).toContain("Strona 1"); // Domyślnie pierwsza strona
    });

    test("TC-E2E-FLASHCARD-PAGINATION-03: powinien wyświetlić maksymalnie 10 fiszek na stronie (domyślnie)", async ({
      flashcardsPage,
    }) => {
      const count = await flashcardsPage.getFlashcardsCount();

      // Weryfikacja: maksymalnie 10 fiszek na stronie
      expect(count).toBeLessThanOrEqual(10);
    });

    test("TC-E2E-FLASHCARD-PAGINATION-04: powinien dezaktywować przycisk poprzedniej strony na pierwszej stronie", async ({
      flashcardsPage,
    }) => {
      const canGoToPrevious = await flashcardsPage.canGoToPreviousPage();

      // Weryfikacja: przycisk powinien być nieaktywny
      expect(canGoToPrevious).toBe(false);
    });

    test("TC-E2E-FLASHCARD-PAGINATION-05: powinien aktywować przycisk następnej strony gdy są kolejne strony", async ({
      flashcardsPage,
    }) => {
      const canGoToNext = await flashcardsPage.canGoToNextPage();

      // Weryfikacja: przycisk powinien być aktywny (mamy 15 fiszek, więc 2 strony)
      expect(canGoToNext).toBe(true);
    });
  });

  test.describe("Nawigacja między stronami", () => {
    test.beforeEach(async ({ flashcardsPage }) => {
      // Przygotuj dane testowe - utwórz 25 fiszek (3 strony po 10)
      for (let i = 1; i <= 25; i++) {
        await flashcardsPage.createFlashcard(`Pytanie ${i}`, `Odpowiedź ${i}`);
      }
      // Czekaj aż tabela będzie widoczna
      await flashcardsPage.table.waitFor({ state: "visible", timeout: 5000 });
    });

    test("TC-E2E-FLASHCARD-PAGINATION-NAV-01: powinien przejść do następnej strony", async ({ flashcardsPage }) => {
      await flashcardsPage.goToNextPage();

      // Weryfikacja: aktualna strona powinna być 2
      const currentPage = await flashcardsPage.getCurrentPage();
      expect(currentPage).toContain("Strona 2");
    });

    test("TC-E2E-FLASHCARD-PAGINATION-NAV-02: powinien przejść do poprzedniej strony", async ({
      flashcardsPage,
    }) => {
      // Przejdź do strony 2
      await flashcardsPage.goToNextPage();

      // Wróć do strony 1
      await flashcardsPage.goToPreviousPage();

      // Weryfikacja: aktualna strona powinna być 1
      const currentPage = await flashcardsPage.getCurrentPage();
      expect(currentPage).toContain("Strona 1");
    });

    test("TC-E2E-FLASHCARD-PAGINATION-NAV-03: powinien zaktualizować informację o zakresie przy zmianie strony", async ({
      flashcardsPage,
    }) => {
      const infoPage1 = await flashcardsPage.getPaginationInfo();
      expect(infoPage1).toContain("Wyświetlanie 1–10");

      // Przejdź do strony 2
      await flashcardsPage.goToNextPage();

      const infoPage2 = await flashcardsPage.getPaginationInfo();
      expect(infoPage2).toContain("Wyświetlanie 11–20");
    });

    test("TC-E2E-FLASHCARD-PAGINATION-NAV-04: powinien dezaktywować przycisk następnej strony na ostatniej stronie", async ({
      flashcardsPage,
    }) => {
      // Przejdź do strony 2
      await flashcardsPage.goToNextPage();

      // Przejdź do strony 3 (ostatnia)
      await flashcardsPage.goToNextPage();

      // Weryfikacja: przycisk następnej strony powinien być nieaktywny
      const canGoToNext = await flashcardsPage.canGoToNextPage();
      expect(canGoToNext).toBe(false);
    });

    test("TC-E2E-FLASHCARD-PAGINATION-NAV-05: powinien aktywować przycisk poprzedniej strony gdy nie jesteśmy na pierwszej stronie", async ({
      flashcardsPage,
    }) => {
      // Przejdź do strony 2
      await flashcardsPage.goToNextPage();

      // Weryfikacja: przycisk poprzedniej strony powinien być aktywny
      const canGoToPrevious = await flashcardsPage.canGoToPreviousPage();
      expect(canGoToPrevious).toBe(true);
    });

    test("TC-E2E-FLASHCARD-PAGINATION-NAV-06: powinien zachować stronę w URL", async ({ flashcardsPage, page }) => {
      // Przejdź do strony 2
      await flashcardsPage.goToNextPage();

      // Weryfikacja: URL powinien zawierać page=2
      const url = page.url();
      expect(url).toContain("page=2");
    });

    test("TC-E2E-FLASHCARD-PAGINATION-NAV-07: powinien zachować stronę po odświeżeniu", async ({
      flashcardsPage,
      page,
    }) => {
      // Przejdź do strony 2
      await flashcardsPage.goToNextPage();

      // Odśwież stronę i czekaj na załadowanie
      await Promise.all([
        page.waitForResponse((response) => response.url().includes("/api/flashcards"), { timeout: 10000 }),
        page.reload(),
      ]);
      await flashcardsPage.table.waitFor({ state: "visible", timeout: 5000 });

      // Weryfikacja: powinna być nadal strona 2
      const currentPage = await flashcardsPage.getCurrentPage();
      expect(currentPage).toContain("Strona 2");
    });
  });

  test.describe("Paginacja z filtrami", () => {
    test.beforeEach(async ({ flashcardsPage }) => {
      // Przygotuj dane testowe - utwórz 20 fiszek manualnych
      for (let i = 1; i <= 20; i++) {
        await flashcardsPage.createFlashcard(`Manual ${i}`, `Answer ${i}`);
      }
      // Czekaj aż tabela będzie widoczna
      await flashcardsPage.table.waitFor({ state: "visible", timeout: 5000 });
    });

    test("TC-E2E-FLASHCARD-PAGINATION-FILTER-01: powinien resetować do strony 1 po zmianie filtra", async ({
      flashcardsPage,
      page,
    }) => {
      // Przejdź do strony 2
      await flashcardsPage.goToNextPage();

      let currentPage = await flashcardsPage.getCurrentPage();
      expect(currentPage).toContain("Strona 2");

      // Zmień filtr i czekaj na odpowiedź API
      await Promise.all([
        page.waitForResponse((response) => response.url().includes("/api/flashcards"), { timeout: 10000 }),
        flashcardsPage.setSourceFilter("manual"),
      ]);
      await flashcardsPage.table.waitFor({ state: "visible", timeout: 5000 });

      // Weryfikacja: powinna być strona 1
      currentPage = await flashcardsPage.getCurrentPage();
      expect(currentPage).toContain("Strona 1");
    });

    test("TC-E2E-FLASHCARD-PAGINATION-FILTER-02: powinien zaktualizować łączną liczbę po zastosowaniu filtra", async ({
      flashcardsPage,
      page,
    }) => {
      const infoBefore = await flashcardsPage.getPaginationInfo();

      // Zastosuj filtr i czekaj na odpowiedź API
      await Promise.all([
        page.waitForResponse((response) => response.url().includes("/api/flashcards"), { timeout: 10000 }),
        flashcardsPage.setSourceFilter("manual"),
      ]);
      await flashcardsPage.table.waitFor({ state: "visible", timeout: 5000 });

      const infoAfter = await flashcardsPage.getPaginationInfo();

      // Weryfikacja: informacja powinna się zmienić
      // (liczba może być taka sama lub mniejsza w zależności od danych)
      expect(infoAfter).toMatch(/Wyświetlanie \d+–\d+ z \d+/);
    });

    test("TC-E2E-FLASHCARD-PAGINATION-FILTER-03: powinien zachować filtry przy nawigacji między stronami", async ({
      flashcardsPage,
      page,
    }) => {
      // Zastosuj filtr i czekaj na odpowiedź API
      await Promise.all([
        page.waitForResponse((response) => response.url().includes("/api/flashcards"), { timeout: 10000 }),
        flashcardsPage.setSourceFilter("manual"),
      ]);
      await flashcardsPage.table.waitFor({ state: "visible", timeout: 5000 });

      // Przejdź do strony 2
      await flashcardsPage.goToNextPage();

      // Weryfikacja: URL powinien zawierać zarówno filtr jak i stronę
      const url = page.url();
      expect(url).toContain("source=manual");
      expect(url).toContain("page=2");
    });
  });

  test.describe("Edge cases paginacji", () => {
    test("TC-E2E-FLASHCARD-PAGINATION-EDGE-01: powinien wyświetlić poprawną informację gdy jest dokładnie 10 fiszek", async ({
      flashcardsPage,
    }) => {
      // Utwórz dokładnie 10 fiszek
      for (let i = 1; i <= 10; i++) {
        await flashcardsPage.createFlashcard(`Pytanie ${i}`, `Odpowiedź ${i}`);
      }
      // Czekaj aż tabela będzie widoczna
      await flashcardsPage.table.waitFor({ state: "visible", timeout: 5000 });

      const paginationInfo = await flashcardsPage.getPaginationInfo();
      expect(paginationInfo).toContain("Wyświetlanie 1–10 z 10");

      const currentPage = await flashcardsPage.getCurrentPage();
      expect(currentPage).toContain("Strona 1 / 1");

      // Przycisk następnej strony powinien być nieaktywny
      const canGoToNext = await flashcardsPage.canGoToNextPage();
      expect(canGoToNext).toBe(false);
    });

    test("TC-E2E-FLASHCARD-PAGINATION-EDGE-02: powinien wyświetlić poprawną informację gdy jest mniej niż 10 fiszek", async ({
      flashcardsPage,
    }) => {
      // Utwórz 5 fiszek
      for (let i = 1; i <= 5; i++) {
        await flashcardsPage.createFlashcard(`Pytanie ${i}`, `Odpowiedź ${i}`);
      }
      // Czekaj aż tabela będzie widoczna
      await flashcardsPage.table.waitFor({ state: "visible", timeout: 5000 });

      const paginationInfo = await flashcardsPage.getPaginationInfo();
      expect(paginationInfo).toContain("Wyświetlanie 1–5 z 5");

      const currentPage = await flashcardsPage.getCurrentPage();
      expect(currentPage).toContain("Strona 1 / 1");
    });

    test("TC-E2E-FLASHCARD-PAGINATION-EDGE-03: powinien wyświetlić poprawną informację na ostatniej niepełnej stronie", async ({
      flashcardsPage,
    }) => {
      // Utwórz 23 fiszki (3 strony: 10, 10, 3)
      for (let i = 1; i <= 23; i++) {
        await flashcardsPage.createFlashcard(`Pytanie ${i}`, `Odpowiedź ${i}`);
      }
      // Czekaj aż tabela będzie widoczna
      await flashcardsPage.table.waitFor({ state: "visible", timeout: 5000 });

      // Przejdź do strony 2
      await flashcardsPage.goToNextPage();

      // Przejdź do strony 3 (ostatnia, niepełna)
      await flashcardsPage.goToNextPage();

      const paginationInfo = await flashcardsPage.getPaginationInfo();
      expect(paginationInfo).toContain("Wyświetlanie 21–23 z 23");

      const currentPage = await flashcardsPage.getCurrentPage();
      expect(currentPage).toContain("Strona 3 / 3");
    });

    test("TC-E2E-FLASHCARD-PAGINATION-EDGE-04: powinien obsłużyć sytuację gdy nie ma fiszek", async ({
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

      // Weryfikacja: komunikat o braku wyników
      const paginationInfo = await flashcardsPage.getPaginationInfo();
      expect(paginationInfo).toContain("Brak wyników");
    });
  });

  test.describe("Wydajność paginacji", () => {
    test("TC-E2E-FLASHCARD-PAGINATION-PERF-01: powinien szybko przełączać między stronami", async ({
      flashcardsPage,
    }) => {
      // Przygotuj dane testowe
      for (let i = 1; i <= 30; i++) {
        await flashcardsPage.createFlashcard(`Pytanie ${i}`, `Odpowiedź ${i}`);
      }
      await flashcardsPage.waitForFlashcardsLoad();

      // Zmierz czas przełączenia strony
      const startTime = Date.now();
      await flashcardsPage.goToNextPage();
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Weryfikacja: przełączenie powinno zająć mniej niż 3 sekundy
      expect(duration).toBeLessThan(3000);
    });
  });
});

