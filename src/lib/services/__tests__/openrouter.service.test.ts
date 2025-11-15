/**
 * Testy jednostkowe dla OpenRouterService
 *
 * Uwaga: To jest przykładowy plik testowy do weryfikacji struktury.
 * Pełne testy wymagają konfiguracji środowiska testowego.
 */

import { describe, it, expect } from "vitest";
import {
  OpenRouterService,
  OpenRouterServiceError,
  type ModelOptions,
  type ResponseFormat,
} from "../openrouter.service";

describe("OpenRouterService", () => {
  describe("Konstruktor", () => {
    it("powinien utworzyć instancję z wymaganą konfiguracją", () => {
      const service = new OpenRouterService({
        apiKey: "test-api-key",
      });

      expect(service).toBeInstanceOf(OpenRouterService);
    });

    it("powinien rzucić błąd gdy brak klucza API", () => {
      expect(() => {
        new OpenRouterService({
          apiKey: "",
        });
      }).toThrow(OpenRouterServiceError);
    });

    it("powinien użyć domyślnych wartości gdy nie podano opcji", () => {
      const service = new OpenRouterService({
        apiKey: "test-api-key",
      });

      const config = service.getConfiguration();

      expect(config.baseUrl).toBe("https://openrouter.ai/api/v1");
      expect(config.model).toBe("openai/gpt-4o-mini");
      expect(config.systemMessage).toBeTruthy();
    });

    it("powinien nadpisać domyślne wartości", () => {
      const customSystemMessage = "Custom system message";
      const customModel = "gpt-4";

      const service = new OpenRouterService({
        apiKey: "test-api-key",
        systemMessage: customSystemMessage,
        modelOptions: {
          model: customModel,
        },
      });

      const config = service.getConfiguration();

      expect(config.systemMessage).toBe(customSystemMessage);
      expect(config.model).toBe(customModel);
    });
  });

  describe("setSystemMessage", () => {
    it("powinien ustawić nowy komunikat systemowy", () => {
      const service = new OpenRouterService({
        apiKey: "test-api-key",
      });

      const newMessage = "New system message";
      service.setSystemMessage(newMessage);

      const config = service.getConfiguration();
      expect(config.systemMessage).toBe(newMessage);
    });

    it("powinien rzucić błąd dla pustego komunikatu", () => {
      const service = new OpenRouterService({
        apiKey: "test-api-key",
      });

      expect(() => {
        service.setSystemMessage("");
      }).toThrow(OpenRouterServiceError);
    });
  });

  describe("setResponseFormat", () => {
    it("powinien ustawić format odpowiedzi", () => {
      const service = new OpenRouterService({
        apiKey: "test-api-key",
      });

      const format: ResponseFormat = {
        type: "json_schema",
        json_schema: {
          name: "test",
          strict: true,
          schema: {
            type: "object",
            properties: {
              answer: { type: "string" },
            },
          },
        },
      };

      service.setResponseFormat(format);

      const config = service.getConfiguration();
      expect(config.responseFormat).toEqual(format);
    });

    it("powinien rzucić błąd dla nieprawidłowego formatu", () => {
      const service = new OpenRouterService({
        apiKey: "test-api-key",
      });

      expect(() => {
        service.setResponseFormat({
          type: "json_schema",
          json_schema: {
            name: "",
            strict: true,
            schema: {},
          },
        });
      }).toThrow(OpenRouterServiceError);
    });
  });

  describe("configureModel", () => {
    it("powinien zaktualizować opcje modelu", () => {
      const service = new OpenRouterService({
        apiKey: "test-api-key",
      });

      const newOptions: Partial<ModelOptions> = {
        model: "gpt-4-turbo",
        temperature: 0.5,
        maxTokens: 2000,
      };

      service.configureModel(newOptions);

      const config = service.getConfiguration();
      expect(config.model).toBe(newOptions.model);
      expect(config.modelOptions.temperature).toBe(newOptions.temperature);
      expect(config.modelOptions.maxTokens).toBe(newOptions.maxTokens);
    });

    it("powinien rzucić błąd dla nieprawidłowej temperatury", () => {
      const service = new OpenRouterService({
        apiKey: "test-api-key",
      });

      expect(() => {
        service.configureModel({ temperature: 3.0 });
      }).toThrow(OpenRouterServiceError);

      expect(() => {
        service.configureModel({ temperature: -0.1 });
      }).toThrow(OpenRouterServiceError);
    });

    it("powinien rzucić błąd dla nieprawidłowej liczby tokenów", () => {
      const service = new OpenRouterService({
        apiKey: "test-api-key",
      });

      expect(() => {
        service.configureModel({ maxTokens: 0 });
      }).toThrow(OpenRouterServiceError);
    });
  });

  describe("getConfiguration", () => {
    it("powinien zwrócić kopię konfiguracji", () => {
      const service = new OpenRouterService({
        apiKey: "test-api-key",
      });

      const config1 = service.getConfiguration();
      const config2 = service.getConfiguration();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Różne referencje
    });
  });

  describe("sendMessage", () => {
    it("powinien rzucić błąd dla pustej wiadomości", async () => {
      const service = new OpenRouterService({
        apiKey: "test-api-key",
      });

      await expect(service.sendMessage("")).rejects.toThrow(OpenRouterServiceError);
    });

    // Uwaga: Testy integracyjne wymagają mockowania fetch lub prawdziwego API
  });
});
