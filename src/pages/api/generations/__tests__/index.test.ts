import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { POST, GET } from "../index";
import type { APIContext } from "astro";
import * as generationsService from "../../../../lib/services/generations.service";
import {
  createMockAPIContext,
  MOCK_CREATE_GENERATION_RESPONSE,
  VALID_SOURCE_TEXT,
  TOO_SHORT_TEXT,
  TOO_LONG_TEXT,
  createMockPaginatedResponse,
  MOCK_GENERATION_DTO,
  createMockGenerationsList,
} from "../../../../__tests__/mockData/generations";

describe("POST /api/generations", () => {
  let createGenerationSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    createGenerationSpy = vi.spyOn(generationsService, "createGeneration");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Walidacja danych wejściowych
  // ============================================================================

  describe("Walidacja danych wejściowych", () => {
    it("should reject invalid JSON body", async () => {
      // Arrange
      const context = {
        request: {
          json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
        },
        locals: {
          user: { id: "user-123", email: "test@example.com" },
          supabase: {},
        },
      } as unknown as APIContext;

      // Act
      const response = await POST(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        message: "Nieprawidłowy format JSON w body żądania.",
      });
    });

    it("should reject sourceText shorter than 1000 characters", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "POST",
        url: "http://localhost/api/generations",
        body: { sourceText: TOO_SHORT_TEXT },
      });

      // Act
      const response = await POST(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        message: "Body żądania nie przeszło walidacji.",
      });
      expect(data.issues).toBeDefined();
    });

    it("should reject sourceText longer than 10000 characters", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "POST",
        url: "http://localhost/api/generations",
        body: { sourceText: TOO_LONG_TEXT },
      });

      // Act
      const response = await POST(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        message: "Body żądania nie przeszło walidacji.",
      });
      expect(data.issues).toBeDefined();
    });

    it("should reject empty sourceText", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "POST",
        url: "http://localhost/api/generations",
        body: { sourceText: "" },
      });

      // Act
      const response = await POST(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        message: "Body żądania nie przeszło walidacji.",
      });
    });

    it("should reject missing sourceText field", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "POST",
        url: "http://localhost/api/generations",
        body: {},
      });

      // Act
      const response = await POST(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        message: "Body żądania nie przeszło walidacji.",
      });
    });

    it("should reject non-string sourceText", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "POST",
        url: "http://localhost/api/generations",
        body: { sourceText: 12345 },
      });

      // Act
      const response = await POST(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        message: "Body żądania nie przeszło walidacji.",
      });
    });

    it("should trim whitespace from sourceText", async () => {
      // Arrange
      const trimmedText = VALID_SOURCE_TEXT;
      const context = createMockAPIContext({
        method: "POST",
        url: "http://localhost/api/generations",
        body: { sourceText: `   ${trimmedText}   ` },
      });

      createGenerationSpy.mockResolvedValue(MOCK_CREATE_GENERATION_RESPONSE);

      // Act
      const response = await POST(context as APIContext);

      // Assert
      expect(response.status).toBe(201);
      expect(generationsService.createGeneration).toHaveBeenCalledWith(expect.anything(), { sourceText: trimmedText });
    });
  });

  // ============================================================================
  // Logika biznesowa - sukces
  // ============================================================================

  describe("Logika biznesowa - sukces", () => {
    it("should return 201 and generation data on successful creation", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "POST",
        url: "http://localhost/api/generations",
        body: { sourceText: VALID_SOURCE_TEXT },
      });

      createGenerationSpy.mockResolvedValue(MOCK_CREATE_GENERATION_RESPONSE);

      // Act
      const response = await POST(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data).toEqual(MOCK_CREATE_GENERATION_RESPONSE);
      expect(data).toHaveProperty("generation");
      expect(data).toHaveProperty("flashcardsProposals");
      expect(data.flashcardsProposals).toHaveLength(5);
    });

    it("should call createGeneration service with correct parameters", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "POST",
        url: "http://localhost/api/generations",
        body: { sourceText: VALID_SOURCE_TEXT },
      });

      createGenerationSpy.mockResolvedValue(MOCK_CREATE_GENERATION_RESPONSE);

      // Act
      await POST(context as APIContext);

      // Assert
      expect(generationsService.createGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          locals: expect.objectContaining({
            user: expect.any(Object),
            supabase: expect.any(Object),
          }),
        }),
        { sourceText: VALID_SOURCE_TEXT }
      );
    });
  });

  // ============================================================================
  // Logika biznesowa - błędy
  // ============================================================================

  describe("Logika biznesowa - błędy", () => {
    it("should return 401 for USER_NOT_AUTHENTICATED error", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "POST",
        url: "http://localhost/api/generations",
        body: { sourceText: VALID_SOURCE_TEXT },
      });

      const serviceError = new generationsService.GenerationServiceError(
        "Brak uwierzytelnionego użytkownika.",
        401,
        "USER_NOT_AUTHENTICATED"
      );

      createGenerationSpy.mockRejectedValue(serviceError);

      // Act
      const response = await POST(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({
        message: "Brak uwierzytelnionego użytkownika.",
        code: "USER_NOT_AUTHENTICATED",
      });
    });

    it("should return 400 for AI_GENERATION_FAILED with validation error", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "POST",
        url: "http://localhost/api/generations",
        body: { sourceText: VALID_SOURCE_TEXT },
      });

      const serviceError = new generationsService.GenerationServiceError(
        "Tekst zbyt krótki",
        400,
        "AI_GENERATION_FAILED"
      );

      createGenerationSpy.mockRejectedValue(serviceError);

      // Act
      const response = await POST(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({
        message: "Tekst zbyt krótki",
        code: "AI_GENERATION_FAILED",
      });
    });

    it("should return 500 for GENERATION_PERSIST_FAILED error", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "POST",
        url: "http://localhost/api/generations",
        body: { sourceText: VALID_SOURCE_TEXT },
      });

      const serviceError = new generationsService.GenerationServiceError(
        "Nie udało się zapisać danych generacji.",
        500,
        "GENERATION_PERSIST_FAILED"
      );

      createGenerationSpy.mockRejectedValue(serviceError);

      // Act
      const response = await POST(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        message: "Nie udało się zapisać danych generacji.",
        code: "GENERATION_PERSIST_FAILED",
      });
    });

    it("should return 500 for unknown errors", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "POST",
        url: "http://localhost/api/generations",
        body: { sourceText: VALID_SOURCE_TEXT },
      });

      createGenerationSpy.mockRejectedValue(new Error("Unknown error"));

      // Act
      const response = await POST(context as APIContext);
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
        method: "POST",
        url: "http://localhost/api/generations",
        body: { sourceText: VALID_SOURCE_TEXT },
      });

      createGenerationSpy.mockResolvedValue(MOCK_CREATE_GENERATION_RESPONSE);

      // Act
      const response = await POST(context as APIContext);

      // Assert
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should have correct response structure on success", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "POST",
        url: "http://localhost/api/generations",
        body: { sourceText: VALID_SOURCE_TEXT },
      });

      createGenerationSpy.mockResolvedValue(MOCK_CREATE_GENERATION_RESPONSE);

      // Act
      const response = await POST(context as APIContext);
      const data = await response.json();

      // Assert
      expect(data).toHaveProperty("generation");
      expect(data).toHaveProperty("flashcardsProposals");
      expect(data.generation).toHaveProperty("id");
      expect(data.generation).toHaveProperty("model");
      expect(data.generation).toHaveProperty("sourceTextHash");
      expect(data.generation).toHaveProperty("generatedCount");
    });

    it("should have correct error response structure", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "POST",
        url: "http://localhost/api/generations",
        body: { sourceText: "" },
      });

      // Act
      const response = await POST(context as APIContext);
      const data = await response.json();

      // Assert
      expect(data).toHaveProperty("message");
      expect(typeof data.message).toBe("string");
    });
  });
});

// ============================================================================
// GET /api/generations
// ============================================================================

describe("GET /api/generations", () => {
  let listGenerationsSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    listGenerationsSpy = vi.spyOn(generationsService, "listGenerations");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Walidacja parametrów zapytania
  // ============================================================================

  describe("Walidacja parametrów zapytania", () => {
    it("should use default values when no query params provided", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations",
      });

      const mockResponse = createMockPaginatedResponse([], 1, 10, 0);
      listGenerationsSpy.mockResolvedValue(mockResponse);

      // Act
      const response = await GET(context as APIContext);

      // Assert
      expect(response.status).toBe(200);
      expect(generationsService.listGenerations).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          page: 1,
          pageSize: 10,
          sort: "createdAt",
          order: "desc",
        })
      );
    });

    it("should accept valid page parameter", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations?page=2",
      });

      const mockResponse = createMockPaginatedResponse([], 2, 10, 0);
      listGenerationsSpy.mockResolvedValue(mockResponse);

      // Act
      await GET(context as APIContext);

      // Assert
      expect(generationsService.listGenerations).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ page: 2 })
      );
    });

    it("should accept valid pageSize parameter", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations?pageSize=25",
      });

      const mockResponse = createMockPaginatedResponse([], 1, 25, 0);
      listGenerationsSpy.mockResolvedValue(mockResponse);

      // Act
      await GET(context as APIContext);

      // Assert
      expect(generationsService.listGenerations).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ pageSize: 25 })
      );
    });

    it("should reject page less than 1", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations?page=0",
      });

      // Act
      const response = await GET(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        message: "Parametry zapytania nie przeszły walidacji.",
      });
      expect(data.issues).toBeDefined();
    });

    it("should reject pageSize greater than 100", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations?pageSize=101",
      });

      // Act
      const response = await GET(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        message: "Parametry zapytania nie przeszły walidacji.",
      });
    });

    it("should accept valid sort parameter", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations?sort=generatedCount",
      });

      const mockResponse = createMockPaginatedResponse([], 1, 10, 0);
      listGenerationsSpy.mockResolvedValue(mockResponse);

      // Act
      await GET(context as APIContext);

      // Assert
      expect(generationsService.listGenerations).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ sort: "generatedCount" })
      );
    });

    it("should accept valid order parameter", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations?order=asc",
      });

      const mockResponse = createMockPaginatedResponse([], 1, 10, 0);
      listGenerationsSpy.mockResolvedValue(mockResponse);

      // Act
      await GET(context as APIContext);

      // Assert
      expect(generationsService.listGenerations).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ order: "asc" })
      );
    });

    it("should reject invalid order parameter", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations?order=invalid",
      });

      // Act
      const response = await GET(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        message: "Parametry zapytania nie przeszły walidacji.",
      });
    });

    it("should accept model filter", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations?model=openai/gpt-4o-mini",
      });

      const mockResponse = createMockPaginatedResponse([], 1, 10, 0);
      listGenerationsSpy.mockResolvedValue(mockResponse);

      // Act
      await GET(context as APIContext);

      // Assert
      expect(generationsService.listGenerations).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ model: "openai/gpt-4o-mini" })
      );
    });

    it("should accept createdFrom filter", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations?createdFrom=2024-01-01T00:00:00.000Z",
      });

      const mockResponse = createMockPaginatedResponse([], 1, 10, 0);
      listGenerationsSpy.mockResolvedValue(mockResponse);

      // Act
      await GET(context as APIContext);

      // Assert
      expect(generationsService.listGenerations).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ createdFrom: "2024-01-01T00:00:00.000Z" })
      );
    });

    it("should accept createdTo filter", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations?createdTo=2024-12-31T23:59:59.999Z",
      });

      const mockResponse = createMockPaginatedResponse([], 1, 10, 0);
      listGenerationsSpy.mockResolvedValue(mockResponse);

      // Act
      await GET(context as APIContext);

      // Assert
      expect(generationsService.listGenerations).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ createdTo: "2024-12-31T23:59:59.999Z" })
      );
    });

    it("should accept all query parameters combined", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations?page=2&pageSize=20&sort=generatedCount&order=asc&model=openai/gpt-4o-mini&createdFrom=2024-01-01T00:00:00.000Z&createdTo=2024-12-31T23:59:59.999Z",
      });

      const mockResponse = createMockPaginatedResponse([], 2, 20, 0);
      listGenerationsSpy.mockResolvedValue(mockResponse);

      // Act
      await GET(context as APIContext);

      // Assert
      expect(generationsService.listGenerations).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          page: 2,
          pageSize: 20,
          sort: "generatedCount",
          order: "asc",
          model: "openai/gpt-4o-mini",
          createdFrom: "2024-01-01T00:00:00.000Z",
          createdTo: "2024-12-31T23:59:59.999Z",
        })
      );
    });
  });

  // ============================================================================
  // Logika biznesowa - sukces
  // ============================================================================

  describe("Logika biznesowa - sukces", () => {
    it("should return 200 and paginated list on success", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations",
      });

      const mockData = createMockGenerationsList(3).map((row) => ({
        ...MOCK_GENERATION_DTO,
        id: row.id,
      }));
      const mockResponse = createMockPaginatedResponse(mockData, 1, 10, 3);
      listGenerationsSpy.mockResolvedValue(mockResponse);

      // Act
      const response = await GET(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("pagination");
      expect(data.items).toHaveLength(3);
      expect(data.pagination).toEqual({
        page: 1,
        pageSize: 10,
        total: 3,
      });
    });

    it("should return empty list when no generations exist", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations",
      });

      const mockResponse = createMockPaginatedResponse([], 1, 10, 0);
      listGenerationsSpy.mockResolvedValue(mockResponse);

      // Act
      const response = await GET(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.items).toEqual([]);
      expect(data.pagination.total).toBe(0);
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
        url: "http://localhost/api/generations",
      });

      const serviceError = new generationsService.GenerationServiceError(
        "Brak uwierzytelnionego użytkownika.",
        401,
        "USER_NOT_AUTHENTICATED"
      );

      listGenerationsSpy.mockRejectedValue(serviceError);

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

    it("should return 500 for GENERATION_LIST_FAILED error", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations",
      });

      const serviceError = new generationsService.GenerationServiceError(
        "Nie udało się pobrać listy generacji.",
        500,
        "GENERATION_LIST_FAILED"
      );

      listGenerationsSpy.mockRejectedValue(serviceError);

      // Act
      const response = await GET(context as APIContext);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({
        message: "Nie udało się pobrać listy generacji.",
        code: "GENERATION_LIST_FAILED",
      });
    });

    it("should return 500 for unknown errors", async () => {
      // Arrange
      const context = createMockAPIContext({
        method: "GET",
        url: "http://localhost/api/generations",
      });

      listGenerationsSpy.mockRejectedValue(new Error("Unknown error"));

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
        url: "http://localhost/api/generations",
      });

      const mockResponse = createMockPaginatedResponse([], 1, 10, 0);
      listGenerationsSpy.mockResolvedValue(mockResponse);

      // Act
      const response = await GET(context as APIContext);

      // Assert
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });
});
