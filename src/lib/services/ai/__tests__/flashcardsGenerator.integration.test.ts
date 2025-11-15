/**
 * Testy integracyjne dla generatora fiszek
 * 
 * UWAGA: Te testy wymagają prawdziwego klucza API OpenRouter
 * i będą wykonywać rzeczywiste wywołania API (co generuje koszty).
 * 
 * Aby uruchomić testy integracyjne:
 * 1. Ustaw OPENROUTER_API_KEY w pliku .env
 * 2. Uruchom: npm test -- flashcardsGenerator.integration.test.ts
 * 
 * Testy są oznaczone jako .skip - usuń .skip aby je uruchomić.
 */

import { describe, it, expect } from "vitest";
import {
  generateFlashcardProposals,
  FlashcardGenerationError,
} from "../flashcardsGenerator";

describe.skip("FlashcardsGenerator - Integration Tests", () => {
  describe("generateFlashcardProposals", () => {
    it("powinien wygenerować fiszki z rzeczywistego tekstu", async () => {
      const sourceText = `
        Fotosynteza to proces biochemiczny zachodzący w chloroplastach roślin zielonych.
        Podczas fotosyntezy energia świetlna jest przekształcana w energię chemiczną.
        W wyniku tego procesu powstaje glukoza i tlen.
        Fotosynteza jest kluczowa dla życia na Ziemi, ponieważ dostarcza tlen do atmosfery.
      `;

      const proposals = await generateFlashcardProposals({ sourceText });

      // Weryfikacja podstawowych właściwości
      expect(proposals).toBeDefined();
      expect(Array.isArray(proposals)).toBe(true);
      expect(proposals.length).toBeGreaterThan(0);
      expect(proposals.length).toBeLessThanOrEqual(10);

      // Weryfikacja struktury każdej fiszki
      proposals.forEach((proposal) => {
        expect(proposal).toHaveProperty("front");
        expect(proposal).toHaveProperty("back");
        expect(proposal).toHaveProperty("source");
        expect(proposal.source).toBe("ai-full");
        expect(typeof proposal.front).toBe("string");
        expect(typeof proposal.back).toBe("string");
        expect(proposal.front.length).toBeGreaterThan(0);
        expect(proposal.back.length).toBeGreaterThan(0);
      });

      // Wyświetl wygenerowane fiszki (dla debugowania)
      console.log("\nWygenerowane fiszki:");
      proposals.forEach((proposal, index) => {
        console.log(`\n${index + 1}. Front: ${proposal.front}`);
        console.log(`   Back: ${proposal.back}`);
      });
    }, 30000); // 30 sekund timeout dla wywołania API

    it("powinien wygenerować fiszki z długiego tekstu", async () => {
      const sourceText = `
        Sztuczna inteligencja (AI) to dziedzina informatyki zajmująca się tworzeniem systemów
        zdolnych do wykonywania zadań wymagających ludzkiej inteligencji. Obejmuje to uczenie maszynowe,
        przetwarzanie języka naturalnego, rozpoznawanie obrazów i wiele innych.

        Uczenie maszynowe to poddziedzina AI, która pozwala komputerom uczyć się z danych
        bez jawnego programowania. Istnieją trzy główne typy uczenia maszynowego: nadzorowane,
        nienadzorowane i ze wzmocnieniem.

        Uczenie głębokie to zaawansowana forma uczenia maszynowego wykorzystująca sztuczne sieci neuronowe
        z wieloma warstwami. Sieci te są inspirowane strukturą ludzkiego mózgu i potrafią
        rozpoznawać złożone wzorce w danych.

        Transformery to architektura sieci neuronowych wprowadzona w 2017 roku, która zrewolucjonizowała
        przetwarzanie języka naturalnego. Modele takie jak GPT i BERT opierają się na tej architekturze.
      `;

      const proposals = await generateFlashcardProposals({ sourceText });

      expect(proposals.length).toBeGreaterThan(3);
      expect(proposals.length).toBeLessThanOrEqual(10);

      // Sprawdź różnorodność pytań
      const fronts = proposals.map((p) => p.front);
      const uniqueFronts = new Set(fronts);
      expect(uniqueFronts.size).toBe(fronts.length); // Wszystkie pytania powinny być unikalne
    }, 30000);

    it("powinien wygenerować fiszki z tekstu technicznego", async () => {
      const sourceText = `
        REST API to architektura interfejsu programistycznego wykorzystująca protokół HTTP.
        Główne metody HTTP to GET (pobieranie danych), POST (tworzenie), PUT (aktualizacja),
        PATCH (częściowa aktualizacja) i DELETE (usuwanie).
        
        Kody statusu HTTP informują o wyniku żądania: 2xx oznacza sukces, 4xx błąd klienta,
        5xx błąd serwera. Najczęściej spotykane to 200 OK, 404 Not Found i 500 Internal Server Error.
      `;

      const proposals = await generateFlashcardProposals({ sourceText });

      expect(proposals.length).toBeGreaterThan(0);

      // Sprawdź czy fiszki zawierają terminy techniczne
      const allText = proposals.map((p) => p.front + " " + p.back).join(" ");
      expect(allText).toMatch(/HTTP|REST|API/i);
    }, 30000);

    it("powinien rzucić błąd dla pustego tekstu", async () => {
      await expect(
        generateFlashcardProposals({ sourceText: "" })
      ).rejects.toThrow(FlashcardGenerationError);

      await expect(
        generateFlashcardProposals({ sourceText: "   " })
      ).rejects.toThrow(FlashcardGenerationError);
    });

    it("powinien rzucić błąd dla zbyt krótkiego tekstu", async () => {
      const shortText = "To jest zbyt krótki tekst.";

      await expect(
        generateFlashcardProposals({ sourceText: shortText })
      ).rejects.toThrow(FlashcardGenerationError);
    });

    it("powinien obsłużyć tekst z polskimi znakami", async () => {
      const sourceText = `
        Rzeczpospolita Polska to państwo położone w Europie Środkowej.
        Stolicą Polski jest Warszawa, a największe miasta to Kraków, Łódź, Wrocław i Poznań.
        Polska jest członkiem Unii Europejskiej od 2004 roku.
        Język polski należy do grupy języków zachodniosłowiańskich.
      `;

      const proposals = await generateFlashcardProposals({ sourceText });

      expect(proposals.length).toBeGreaterThan(0);

      // Sprawdź czy polskie znaki są zachowane
      const allText = proposals.map((p) => p.front + " " + p.back).join(" ");
      expect(allText).toMatch(/[ąćęłńóśźż]/i);
    }, 30000);
  });
});

describe("FlashcardsGenerator - Error Handling", () => {
  it("powinien rzucić FlashcardGenerationError z odpowiednim kodem", async () => {
    try {
      await generateFlashcardProposals({ sourceText: "" });
      expect.fail("Powinien rzucić błąd");
    } catch (error) {
      expect(error).toBeInstanceOf(FlashcardGenerationError);
      expect((error as FlashcardGenerationError).code).toBe("INVALID_INPUT");
    }
  });

  it("powinien rzucić błąd TEXT_TOO_SHORT dla krótkiego tekstu", async () => {
    try {
      await generateFlashcardProposals({ sourceText: "Krótki tekst" });
      expect.fail("Powinien rzucić błąd");
    } catch (error) {
      expect(error).toBeInstanceOf(FlashcardGenerationError);
      expect((error as FlashcardGenerationError).code).toBe("TEXT_TOO_SHORT");
    }
  });
});

