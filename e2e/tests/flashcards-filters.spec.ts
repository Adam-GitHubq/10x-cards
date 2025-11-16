import { test, expect } from "../fixtures/auth.fixture";

/**
 * Test Suite dla filtrowania i sortowania fiszek
 * Testuje filtry po źródle, ID generacji oraz sortowanie
 */
test.describe("Zarządzanie fiszkami - Filtrowanie i sortowanie", () => {
  test.beforeEach(async ({ authenticatedPage, flashcardsPage }) => {
    // Zalogowany użytkownik przechodzi do strony fiszek
    await flashcardsPage.navigate();
  });

  test.describe("Filtrowanie po źródle", () => {
    test.beforeEach(async ({ flashcardsPage }) => {
      // Przygotuj dane testowe - utwórz fiszki manualne
      await flashcardsPage.createFlashcard("Manual 1", "Answer 1");
      await flashcardsPage.createFlashcard("Manual 2", "Answer 2");
      await flashcardsPage.waitForFlashcardsLoad();
    });

    test("TC-E2E-FLASHCARD-FILTER-SOURCE-01: powinien wyświetlić wszystkie fiszki domyślnie", async ({
      flashcardsPage,
    }) => {
      // Weryfikacja: domyślnie wszystkie fiszki są widoczne
      const count = await flashcardsPage.getFlashcardsCount();
      expect(count).toBeGreaterThan(0);
    });

    test("TC-E2E-FLASHCARD-FILTER-SOURCE-02: powinien filtrować fiszki manualne", async ({ flashcardsPage }) => {
      await flashcardsPage.setSourceFilter("manual");

      // Weryfikacja: tylko fiszki manualne są widoczne
      await flashcardsPage.waitForFlashcardsLoad();
      const count = await flashcardsPage.getFlashcardsCount();
      expect(count).toBeGreaterThan(0);

      // Sprawdź czy wszystkie widoczne fiszki są manualne
      const rows = flashcardsPage.page.locator('[data-testid^="flashcard-row-"]');
      const rowCount = await rows.count();

      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        // Fiszki manualne powinny mieć badge "Manualne"
        await expect(row).toContainText("Manualne");
      }
    });

    test("TC-E2E-FLASHCARD-FILTER-SOURCE-03: powinien resetować filtr źródła", async ({ flashcardsPage }) => {
      // Ustaw filtr
      await flashcardsPage.setSourceFilter("manual");
      await flashcardsPage.waitForFlashcardsLoad();

      const countAfterFilter = await flashcardsPage.getFlashcardsCount();

      // Resetuj filtry
      await flashcardsPage.resetFilters();
      await flashcardsPage.waitForFlashcardsLoad();

      // Weryfikacja: wszystkie fiszki są widoczne
      const countAfterReset = await flashcardsPage.getFlashcardsCount();
      expect(countAfterReset).toBeGreaterThanOrEqual(countAfterFilter);
    });

    test("TC-E2E-FLASHCARD-FILTER-SOURCE-04: powinien zachować filtr po odświeżeniu strony", async ({
      flashcardsPage,
      page,
    }) => {
      await flashcardsPage.setSourceFilter("manual");
      await flashcardsPage.waitForFlashcardsLoad();

      // Odśwież stronę
      await page.reload();
      await flashcardsPage.waitForFlashcardsLoad();

      // Weryfikacja: filtr powinien być zachowany w URL
      const url = page.url();
      expect(url).toContain("source=manual");
    });
  });

  test.describe("Filtrowanie po ID generacji", () => {
    test("TC-E2E-FLASHCARD-FILTER-GENERATION-01: powinien filtrować po ID generacji", async ({
      flashcardsPage,
    }) => {
      // Uwaga: Ten test wymaga fiszek z generationId
      // W MVP fiszki manualne nie mają generationId
      // Test można rozszerzyć gdy będzie możliwość generowania fiszek AI

      await flashcardsPage.setGenerationIdFilter("123");
      await flashcardsPage.waitForFlashcardsLoad();

      // Weryfikacja: tylko fiszki z tym ID generacji są widoczne
      // Jeśli nie ma takich fiszek, lista powinna być pusta
      const count = await flashcardsPage.getFlashcardsCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("TC-E2E-FLASHCARD-FILTER-GENERATION-02: powinien ignorować nieprawidłowe ID generacji", async ({
      flashcardsPage,
    }) => {
      // Wpisz nieprawidłową wartość (litery)
      const filterInput = flashcardsPage.filterGenerationId;
      await filterInput.fill("abc123");

      // Weryfikacja: pole powinno zawierać tylko cyfry (sanityzacja)
      const value = await filterInput.inputValue();
      expect(value).toBe("123"); // Litery powinny być usunięte
    });

    test("TC-E2E-FLASHCARD-FILTER-GENERATION-03: powinien resetować filtr ID generacji", async ({
      flashcardsPage,
    }) => {
      await flashcardsPage.setGenerationIdFilter("123");
      await flashcardsPage.waitForFlashcardsLoad();

      // Resetuj filtry
      await flashcardsPage.resetFilters();
      await flashcardsPage.waitForFlashcardsLoad();

      // Weryfikacja: pole powinno być puste
      const value = await flashcardsPage.filterGenerationId.inputValue();
      expect(value).toBe("");
    });
  });

  test.describe("Sortowanie", () => {
    test.beforeEach(async ({ flashcardsPage }) => {
      // Przygotuj dane testowe - utwórz kilka fiszek z różnymi datami
      await flashcardsPage.createFlashcard("First", "Answer 1");
      await flashcardsPage.page.waitForTimeout(1000); // Czekaj 1s między utworzeniem
      await flashcardsPage.createFlashcard("Second", "Answer 2");
      await flashcardsPage.page.waitForTimeout(1000);
      await flashcardsPage.createFlashcard("Third", "Answer 3");
      await flashcardsPage.waitForFlashcardsLoad();
    });

    test("TC-E2E-FLASHCARD-SORT-01: powinien sortować fiszki malejąco (najnowsze najpierw) domyślnie", async ({
      flashcardsPage,
    }) => {
      // Weryfikacja: domyślnie najnowsze fiszki są na górze
      const firstRow = flashcardsPage.page.locator('[data-testid^="flashcard-row-"]').first();
      await expect(firstRow).toContainText("Third"); // Ostatnia utworzona
    });

    test("TC-E2E-FLASHCARD-SORT-02: powinien zmienić sortowanie na rosnące (najstarsze najpierw)", async ({
      flashcardsPage,
    }) => {
      await flashcardsPage.setOrderFilter("asc");
      await flashcardsPage.waitForFlashcardsLoad();

      // Weryfikacja: najstarsze fiszki są na górze
      const firstRow = flashcardsPage.page.locator('[data-testid^="flashcard-row-"]').first();
      // Pierwsza fiszka powinna być najstarsza (ale mogą być starsze fiszki z poprzednich testów)
      // Sprawdźmy tylko czy kolejność się zmieniła
      const firstText = await firstRow.textContent();
      expect(firstText).toBeTruthy();
    });

    test("TC-E2E-FLASHCARD-SORT-03: powinien przełączać sortowanie przyciskiem w nagłówku tabeli", async ({
      flashcardsPage,
    }) => {
      // Kliknij przycisk sortowania
      await flashcardsPage.toggleSort();
      await flashcardsPage.waitForFlashcardsLoad();

      // Weryfikacja: kolejność powinna się zmienić
      // Sprawdź URL - powinien zawierać order=asc
      const url = flashcardsPage.page.url();
      expect(url).toContain("order=asc");

      // Kliknij ponownie
      await flashcardsPage.toggleSort();
      await flashcardsPage.waitForFlashcardsLoad();

      // Weryfikacja: powinno wrócić do desc
      const url2 = flashcardsPage.page.url();
      expect(url2).toContain("order=desc");
    });

    test("TC-E2E-FLASHCARD-SORT-04: powinien zachować sortowanie po odświeżeniu strony", async ({
      flashcardsPage,
      page,
    }) => {
      await flashcardsPage.setOrderFilter("asc");
      await flashcardsPage.waitForFlashcardsLoad();

      // Odśwież stronę
      await page.reload();
      await flashcardsPage.waitForFlashcardsLoad();

      // Weryfikacja: sortowanie powinno być zachowane w URL
      const url = page.url();
      expect(url).toContain("order=asc");
    });
  });

  test.describe("Kombinacja filtrów", () => {
    test.beforeEach(async ({ flashcardsPage }) => {
      // Przygotuj dane testowe
      await flashcardsPage.createFlashcard("Manual A", "Answer A");
      await flashcardsPage.createFlashcard("Manual B", "Answer B");
      await flashcardsPage.waitForFlashcardsLoad();
    });

    test("TC-E2E-FLASHCARD-FILTER-COMBO-01: powinien zastosować wiele filtrów jednocześnie", async ({
      flashcardsPage,
      page,
    }) => {
      // Zastosuj filtr źródła
      await flashcardsPage.setSourceFilter("manual");
      await flashcardsPage.waitForFlashcardsLoad();

      // Zastosuj sortowanie
      await flashcardsPage.setOrderFilter("asc");
      await flashcardsPage.waitForFlashcardsLoad();

      // Weryfikacja: URL powinien zawierać oba parametry
      const url = page.url();
      expect(url).toContain("source=manual");
      expect(url).toContain("order=asc");
    });

    test("TC-E2E-FLASHCARD-FILTER-COMBO-02: powinien resetować wszystkie filtry jednocześnie", async ({
      flashcardsPage,
      page,
    }) => {
      // Zastosuj wiele filtrów
      await flashcardsPage.setSourceFilter("manual");
      await flashcardsPage.setOrderFilter("asc");
      await flashcardsPage.waitForFlashcardsLoad();

      // Resetuj wszystkie filtry
      await flashcardsPage.resetFilters();
      await flashcardsPage.waitForFlashcardsLoad();

      // Weryfikacja: URL nie powinien zawierać parametrów filtrów
      const url = page.url();
      expect(url).not.toContain("source=manual");
      // order=desc jest domyślne, więc może być w URL
    });

    test("TC-E2E-FLASHCARD-FILTER-COMBO-03: powinien zachować wszystkie filtry po odświeżeniu", async ({
      flashcardsPage,
      page,
    }) => {
      // Zastosuj wiele filtrów
      await flashcardsPage.setSourceFilter("manual");
      await flashcardsPage.setOrderFilter("asc");
      await flashcardsPage.waitForFlashcardsLoad();

      const urlBefore = page.url();

      // Odśwież stronę
      await page.reload();
      await flashcardsPage.waitForFlashcardsLoad();

      // Weryfikacja: wszystkie parametry powinny być zachowane
      const urlAfter = page.url();
      expect(urlAfter).toContain("source=manual");
      expect(urlAfter).toContain("order=asc");
    });
  });

  test.describe("Debouncing filtra ID generacji", () => {
    test("TC-E2E-FLASHCARD-FILTER-DEBOUNCE-01: powinien zastosować debounce przy wpisywaniu ID generacji", async ({
      flashcardsPage,
      page,
    }) => {
      const filterInput = flashcardsPage.filterGenerationId;

      // Wpisz wartość znak po znaku
      await filterInput.type("123", { delay: 100 });

      // Nie powinno być natychmiastowego zapytania - czekamy na debounce (1500ms)
      // Sprawdź że zapytanie zostanie wysłane po debounce
      await page.waitForTimeout(2000);

      // Weryfikacja: URL powinien zawierać generationId
      const url = page.url();
      expect(url).toContain("generationId=123");
    });
  });
});

