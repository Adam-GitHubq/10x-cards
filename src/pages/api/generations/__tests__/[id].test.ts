import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { GET, DELETE } from "../[id]";
import type { APIContext } from "astro";
import * as generationsService from "../../../../lib/services/generations.service";
import { createMockAPIContext, MOCK_GENERATION_DTO } from "../../../../__tests__/mockData/generations";

describe("GET /api/generations/[id]", () => {
  let getGenerationByIdSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getGenerationByIdSpy = vi.spyOn(generationsService, "getGenerationById");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Walidacja parametru ID
  // ============================================================================

  describe("Walidacja parametru ID", () => {
    it("should accept valid numeric ID", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations/1",
        params: { id: "1" },
      });

      getGenerationByIdSpy.mockResolvedValue(MOCK_GENERATION_DTO);

      // Act
      const response = await GET(context as APIContext);

      // Assert
      expect(response.status).toBe(200);
      expect(generationsService.getGenerationById).toHaveBeenCalledWith(expect.anything(), 1);
    });

    it("should reject ID less than 1", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations/0",
        params: { id: "0" },
      });

      // Act
      const response = await GET(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        message: "Parametr id nie przeszedł walidacji.",
      });
      expect(data.issues).toBeDefined();
    });

    it("should reject negative ID", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations/-1",
        params: { id: "-1" },
      });

      // Act
      const response = await GET(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        message: "Parametr id nie przeszedł walidacji.",
      });
    });

    it("should reject non-numeric ID", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations/abc",
        params: { id: "abc" },
      });

      // Act
      const response = await GET(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        message: "Parametr id nie przeszedł walidacji.",
      });
    });

    it("should reject float ID", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations/1.5",
        params: { id: "1.5" },
      });

      // Act
      const response = await GET(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        message: "Parametr id nie przeszedł walidacji.",
      });
    });

    it("should reject missing ID parameter", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations/",
        params: {},
      });

      // Act
      const response = await GET(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        message: "Parametr id nie przeszedł walidacji.",
      });
    });

    it("should coerce string ID to number", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations/123",
        params: { id: "123" },
      });

      getGenerationByIdSpy.mockResolvedValue(MOCK_GENERATION_DTO);

      // Act
      await GET(context as APIContext);

      // Assert
      expect(generationsService.getGenerationById).toHaveBeenCalledWith(expect.anything(), 123);
    });
  });

  // ============================================================================
  // Logika biznesowa - sukces
  // ============================================================================

  describe("Logika biznesowa - sukces", () => {
    it("should return 200 and generation data when found", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations/1",
        params: { id: "1" },
      });

      getGenerationByIdSpy.mockResolvedValue(MOCK_GENERATION_DTO);

      // Act
      const response = await GET(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual(MOCK_GENERATION_DTO);
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("model");
      expect(data).toHaveProperty("sourceTextHash");
      expect(data).toHaveProperty("generatedCount");
    });

    it("should call getGenerationById service with correct parameters", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations/42",
        params: { id: "42" },
      });

      getGenerationByIdSpy.mockResolvedValue(MOCK_GENERATION_DTO);

      // Act
      await GET(context as APIContext);

      // Assert
      expect(generationsService.getGenerationById).toHaveBeenCalledWith(
        expect.objectContaining({
          locals: expect.objectContaining({
            user: expect.any(Object),
            supabase: expect.any(Object),
          }),
        }),
        42
      );
    });
  });

  // ============================================================================
  // Logika biznesowa - nie znaleziono
  // ============================================================================

  describe("Logika biznesowa - nie znaleziono", () => {
    it("should return 404 when generation not found", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations/999",
        params: { id: "999" },
      });

      getGenerationByIdSpy.mockResolvedValue(null);

      // Act
      const response = await GET(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({
        message: "Nie znaleziono generacji o podanym identyfikatorze.",
      });
    });

    it("should return 404 when generation belongs to different user", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations/1",
        params: { id: "1" },
      });

      getGenerationByIdSpy.mockResolvedValue(null);

      // Act
      const response = await GET(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({
        message: "Nie znaleziono generacji o podanym identyfikatorze.",
      });
    });
  });

  // ============================================================================
  // Logika biznesowa - błędy
  // ============================================================================

  describe("Logika biznesowa - błędy", () => {
    it("should return 401 for USER_NOT_AUTHENTICATED error", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations/1",
        params: { id: "1" },
      });

      const serviceError = new generationsService.GenerationServiceError(
        "Brak uwierzytelnionego użytkownika.",
        401,
        "USER_NOT_AUTHENTICATED"
      );

      getGenerationByIdSpy.mockRejectedValue(serviceError);

      // Act
      const response = await GET(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({
        message: "Brak uwierzytelnionego użytkownika.",
        code: "USER_NOT_AUTHENTICATED",
      });
    });

    it("should return 500 for GENERATION_FETCH_FAILED error", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations/1",
        params: { id: "1" },
      });

      const serviceError = new generationsService.GenerationServiceError(
        "Nie udało się pobrać generacji.",
        500,
        "GENERATION_FETCH_FAILED"
      );

      getGenerationByIdSpy.mockRejectedValue(serviceError);

      // Act
      const response = await GET(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        message: "Nie udało się pobrać generacji.",
        code: "GENERATION_FETCH_FAILED",
      });
    });

    it("should return 500 for unknown errors", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations/1",
        params: { id: "1" },
      });

      getGenerationByIdSpy.mockRejectedValue(new Error("Unknown error"));

      // Act
      const response = await GET(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        message: "Wystąpił nieoczekiwany błąd serwera.",
      });
    });
  });

  // ============================================================================
  // Formatowanie odpowiedzi
  // ============================================================================

  describe("Formatowanie odpowiedzi", () => {
    it("should return Content-Type: application/json header", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations/1",
        params: { id: "1" },
      });

      getGenerationByIdSpy.mockResolvedValue(MOCK_GENERATION_DTO);

      // Act
      const response = await GET(context as APIContext);

      // Assert
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });
});

// ============================================================================
// DELETE /api/generations/[id]
// ============================================================================

describe("DELETE /api/generations/[id]", () => {
  let deleteGenerationSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    deleteGenerationSpy = vi.spyOn(generationsService, "deleteGeneration");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Walidacja parametru ID
  // ============================================================================

  describe("Walidacja parametru ID", () => {
    it("should accept valid numeric ID", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "DELETE",
        url: "http://localhost/api/generations/1",
        params: { id: "1" },
      });

      deleteGenerationSpy.mockResolvedValue(true);

      // Act
      const response = await DELETE(context as APIContext);

      // Assert
      expect(response.status).toBe(204);
      expect(generationsService.deleteGeneration).toHaveBeenCalledWith(expect.anything(), 1);
    });

    it("should reject ID less than 1", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "DELETE",
        url: "http://localhost/api/generations/0",
        params: { id: "0" },
      });

      // Act
      const response = await DELETE(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        message: "Parametr id nie przeszedł walidacji.",
      });
    });

    it("should reject negative ID", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "DELETE",
        url: "http://localhost/api/generations/-1",
        params: { id: "-1" },
      });

      // Act
      const response = await DELETE(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        message: "Parametr id nie przeszedł walidacji.",
      });
    });

    it("should reject non-numeric ID", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "DELETE",
        url: "http://localhost/api/generations/abc",
        params: { id: "abc" },
      });

      // Act
      const response = await DELETE(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        message: "Parametr id nie przeszedł walidacji.",
      });
    });

    it("should coerce string ID to number", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "DELETE",
        url: "http://localhost/api/generations/123",
        params: { id: "123" },
      });

      deleteGenerationSpy.mockResolvedValue(true);

      // Act
      await DELETE(context as APIContext);

      // Assert
      expect(generationsService.deleteGeneration).toHaveBeenCalledWith(expect.anything(), 123);
    });
  });

  // ============================================================================
  // Logika biznesowa - sukces
  // ============================================================================

  describe("Logika biznesowa - sukces", () => {
    it("should return 204 with no content when deletion succeeds", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "DELETE",
        url: "http://localhost/api/generations/1",
        params: { id: "1" },
      });

      deleteGenerationSpy.mockResolvedValue(true);

      // Act
      const response = await DELETE(context as APIContext);

      // Assert
      expect(response.status).toBe(204);
      expect(response.body).toBeNull();
    });

    it("should call deleteGeneration service with correct parameters", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "DELETE",
        url: "http://localhost/api/generations/42",
        params: { id: "42" },
      });

      deleteGenerationSpy.mockResolvedValue(true);

      // Act
      await DELETE(context as APIContext);

      // Assert
      expect(generationsService.deleteGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          locals: expect.objectContaining({
            user: expect.any(Object),
            supabase: expect.any(Object),
          }),
        }),
        42
      );
    });
  });

  // ============================================================================
  // Logika biznesowa - nie znaleziono
  // ============================================================================

  describe("Logika biznesowa - nie znaleziono", () => {
    it("should return 404 when generation not found", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "DELETE",
        url: "http://localhost/api/generations/999",
        params: { id: "999" },
      });

      deleteGenerationSpy.mockResolvedValue(false);

      // Act
      const response = await DELETE(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({
        message: "Nie znaleziono generacji o podanym identyfikatorze.",
      });
    });

    it("should return 404 when generation belongs to different user", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "DELETE",
        url: "http://localhost/api/generations/1",
        params: { id: "1" },
      });

      deleteGenerationSpy.mockResolvedValue(false);

      // Act
      const response = await DELETE(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({
        message: "Nie znaleziono generacji o podanym identyfikatorze.",
      });
    });
  });

  // ============================================================================
  // Logika biznesowa - błędy
  // ============================================================================

  describe("Logika biznesowa - błędy", () => {
    it("should return 401 for USER_NOT_AUTHENTICATED error", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "DELETE",
        url: "http://localhost/api/generations/1",
        params: { id: "1" },
      });

      const serviceError = new generationsService.GenerationServiceError(
        "Brak uwierzytelnionego użytkownika.",
        401,
        "USER_NOT_AUTHENTICATED"
      );

      deleteGenerationSpy.mockRejectedValue(serviceError);

      // Act
      const response = await DELETE(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({
        message: "Brak uwierzytelnionego użytkownika.",
        code: "USER_NOT_AUTHENTICATED",
      });
    });

    it("should return 500 for GENERATION_DELETE_FAILED error", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "DELETE",
        url: "http://localhost/api/generations/1",
        params: { id: "1" },
      });

      const serviceError = new generationsService.GenerationServiceError(
        "Nie udało się usunąć generacji.",
        500,
        "GENERATION_DELETE_FAILED"
      );

      deleteGenerationSpy.mockRejectedValue(serviceError);

      // Act
      const response = await DELETE(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        message: "Nie udało się usunąć generacji.",
        code: "GENERATION_DELETE_FAILED",
      });
    });

    it("should return 500 for unknown errors", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "DELETE",
        url: "http://localhost/api/generations/1",
        params: { id: "1" },
      });

      deleteGenerationSpy.mockRejectedValue(new Error("Unknown error"));

      // Act
      const response = await DELETE(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        message: "Wystąpił nieoczekiwany błąd serwera.",
      });
    });
  });

  // ============================================================================
  // Formatowanie odpowiedzi
  // ============================================================================

  describe("Formatowanie odpowiedzi", () => {
    it("should return no content-type header for 204 response", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "DELETE",
        url: "http://localhost/api/generations/1",
        params: { id: "1" },
      });

      deleteGenerationSpy.mockResolvedValue(true);

      // Act
      const response = await DELETE(context as APIContext);

      // Assert
      expect(response.status).toBe(204);
      expect(response.body).toBeNull();
    });

    it("should return Content-Type: application/json for error responses", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "DELETE",
        url: "http://localhost/api/generations/999",
        params: { id: "999" },
      });

      deleteGenerationSpy.mockResolvedValue(false);

      // Act
      const response = await DELETE(context as APIContext);

      // Assert
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });
});
