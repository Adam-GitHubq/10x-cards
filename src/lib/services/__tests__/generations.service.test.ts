import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  createGeneration,
  listGenerations,
  getGenerationById,
  deleteGeneration,
  GenerationServiceError,
  isPostgrestNotFoundError,
} from "../generations.service";
import * as hashModule from "../../utils/hash";
import * as flashcardsGeneratorModule from "../ai/flashcardsGenerator";
import { FlashcardGenerationError } from "../ai/flashcardsGenerator";
import {
  createMockContext,
  createMockSupabaseClient,
  MOCK_GENERATION_ROW,
  MOCK_FLASHCARD_PROPOSALS,
  VALID_SOURCE_TEXT,
  TEST_USER_ID,
  DEFAULT_MODEL,
  MOCK_SUPABASE_SUCCESS_INSERT,
  MOCK_SUPABASE_ERROR_INSERT,
  MOCK_SUPABASE_SUCCESS_DELETE,
  MOCK_SUPABASE_EMPTY_RESULT,
  createMockGenerationsList,
} from "../../../__tests__/mockData/generations";

// Mock modułów
vi.mock("../../utils/hash");
vi.mock("../ai/flashcardsGenerator", async () => {
  const actual = await vi.importActual<typeof flashcardsGeneratorModule>("../ai/flashcardsGenerator");
  return {
    ...actual,
    generateFlashcardProposals: vi.fn(),
  };
});

describe("generations.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // createGeneration
  // ============================================================================

  describe("createGeneration", () => {
    describe("Pomyślne utworzenie generacji", () => {
      it("should successfully create generation with flashcard proposals", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({
          user: { id: TEST_USER_ID, email: "test@example.com" },
          supabase: mockSupabase,
        });

        vi.mocked(hashModule.computeMD5).mockResolvedValue({
          output: "d41d8cd98f00b204e9800998ecf8427e",
        });

        vi.mocked(flashcardsGeneratorModule.generateFlashcardProposals).mockResolvedValue(MOCK_FLASHCARD_PROPOSALS);

        mockSupabase._mocks.single.mockResolvedValue(MOCK_SUPABASE_SUCCESS_INSERT);

        // Act
        const result = await createGeneration(ctx, { sourceText: VALID_SOURCE_TEXT });

        // Assert
        expect(result).toHaveProperty("generation");
        expect(result).toHaveProperty("flashcardsProposals");
        expect(result.generation.id).toBe(1);
        expect(result.generation.model).toBe(DEFAULT_MODEL);
        expect(result.generation.generatedCount).toBe(5);
        expect(result.flashcardsProposals).toHaveLength(5);
        expect(result.generation.generationDuration).toBeGreaterThan(0);
      });

      it("should compute MD5 hash of source text", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        vi.mocked(hashModule.computeMD5).mockResolvedValue({
          output: "test-hash-123",
        });

        vi.mocked(flashcardsGeneratorModule.generateFlashcardProposals).mockResolvedValue(MOCK_FLASHCARD_PROPOSALS);

        mockSupabase._mocks.single.mockResolvedValue({
          data: { ...MOCK_GENERATION_ROW, source_text_hash: "test-hash-123" },
          error: null,
        });

        // Act
        const result = await createGeneration(ctx, { sourceText: VALID_SOURCE_TEXT });

        // Assert
        expect(hashModule.computeMD5).toHaveBeenCalledWith(VALID_SOURCE_TEXT);
        expect(result.generation.sourceTextHash).toBe("test-hash-123");
      });

      it("should measure generation duration", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        vi.mocked(hashModule.computeMD5).mockResolvedValue({
          output: "hash",
        });

        // Symulacja opóźnienia 100ms
        vi.mocked(flashcardsGeneratorModule.generateFlashcardProposals).mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve(MOCK_FLASHCARD_PROPOSALS), 100))
        );

        // Mock zwraca dane z rzeczywistym czasem generacji
        mockSupabase._mocks.single.mockImplementation(async () => {
          // Zwracamy dane z generation_duration ustawionym na wartość przekazaną do insert
          const insertCall = mockSupabase._mocks.insert.mock.calls[0][0];
          return {
            data: {
              ...MOCK_GENERATION_ROW,
              generation_duration: insertCall.generation_duration,
            },
            error: null,
          };
        });

        // Act
        const result = await createGeneration(ctx, { sourceText: VALID_SOURCE_TEXT });

        // Assert
        expect(result.generation.generationDuration).toBeGreaterThanOrEqual(90); // Tolerancja ±10ms
        expect(result.generation.generationDuration).toBeLessThan(200);
      });

      it("should store correct source text length", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        vi.mocked(hashModule.computeMD5).mockResolvedValue({ output: "hash" });
        vi.mocked(flashcardsGeneratorModule.generateFlashcardProposals).mockResolvedValue(MOCK_FLASHCARD_PROPOSALS);

        mockSupabase._mocks.single.mockResolvedValue({
          data: { ...MOCK_GENERATION_ROW, source_text_length: VALID_SOURCE_TEXT.length },
          error: null,
        });

        // Act
        const result = await createGeneration(ctx, { sourceText: VALID_SOURCE_TEXT });

        // Assert
        expect(result.generation.sourceTextLength).toBe(VALID_SOURCE_TEXT.length);
      });
    });

    describe("Brak uwierzytelnionego użytkownika", () => {
      it("should throw USER_NOT_AUTHENTICATED when user is null", async () => {
        // Arrange
        const ctx = createMockContext({ user: null });

        // Act & Assert
        await expect(createGeneration(ctx, { sourceText: VALID_SOURCE_TEXT })).rejects.toThrow(GenerationServiceError);

        await expect(createGeneration(ctx, { sourceText: VALID_SOURCE_TEXT })).rejects.toMatchObject({
          status: 401,
          code: "USER_NOT_AUTHENTICATED",
        });
      });

      it("should throw USER_NOT_AUTHENTICATED when user.id is missing", async () => {
        // Arrange
        const ctx = createMockContext({ user: { id: "", email: "test@example.com" } });

        // Act & Assert
        await expect(createGeneration(ctx, { sourceText: VALID_SOURCE_TEXT })).rejects.toThrow(GenerationServiceError);
      });
    });

    describe("Brak klienta Supabase", () => {
      it("should throw SUPABASE_NOT_AVAILABLE when supabase is undefined", async () => {
        // Arrange
        const ctx = {
          locals: {
            user: { id: TEST_USER_ID, email: "test@example.com" },
            supabase: undefined,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;

        // Act & Assert
        await expect(createGeneration(ctx, { sourceText: VALID_SOURCE_TEXT })).rejects.toMatchObject({
          status: 500,
          code: "SUPABASE_NOT_AVAILABLE",
        });
      });
    });

    describe("Błąd generowania AI (walidacja)", () => {
      it("should throw AI_GENERATION_FAILED with status 400 for TEXT_TOO_SHORT", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        vi.mocked(hashModule.computeMD5).mockResolvedValue({ output: "hash" });

        const aiError = new FlashcardGenerationError("Text too short", "TEXT_TOO_SHORT");
        vi.mocked(flashcardsGeneratorModule.generateFlashcardProposals).mockRejectedValue(aiError);

        // Mock dla logowania błędu - musi zwrócić Promise
        mockSupabase._mocks.insert.mockResolvedValue({ data: null, error: null });

        // Act & Assert
        await expect(createGeneration(ctx, { sourceText: VALID_SOURCE_TEXT })).rejects.toMatchObject({
          status: 400,
          code: "AI_GENERATION_FAILED",
        });
      });

      it("should throw AI_GENERATION_FAILED with status 400 for INVALID_INPUT", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        vi.mocked(hashModule.computeMD5).mockResolvedValue({ output: "hash" });

        const aiError = new FlashcardGenerationError("Invalid input", "INVALID_INPUT");
        vi.mocked(flashcardsGeneratorModule.generateFlashcardProposals).mockRejectedValue(aiError);

        // Mock dla logowania błędu
        mockSupabase._mocks.insert.mockResolvedValue({ data: null, error: null });

        // Act & Assert
        await expect(createGeneration(ctx, { sourceText: VALID_SOURCE_TEXT })).rejects.toMatchObject({
          status: 400,
          code: "AI_GENERATION_FAILED",
        });
      });

      it("should log error to generation_error_logs on AI failure", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        vi.mocked(hashModule.computeMD5).mockResolvedValue({ output: "test-hash" });

        const aiError = new FlashcardGenerationError("AI error", "TEXT_TOO_SHORT");
        vi.mocked(flashcardsGeneratorModule.generateFlashcardProposals).mockRejectedValue(aiError);

        // Mock dla logowania błędu
        mockSupabase._mocks.insert.mockResolvedValue({ data: null, error: null });

        // Act
        await expect(createGeneration(ctx, { sourceText: VALID_SOURCE_TEXT })).rejects.toThrow();

        // Assert
        expect(mockSupabase.from).toHaveBeenCalledWith("generation_error_logs");
      });
    });

    describe("Błąd generowania AI (API)", () => {
      it("should throw AI_GENERATION_FAILED with status 500 for API_ERROR", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        vi.mocked(hashModule.computeMD5).mockResolvedValue({ output: "hash" });

        const aiError = new FlashcardGenerationError("API error", "API_ERROR");
        vi.mocked(flashcardsGeneratorModule.generateFlashcardProposals).mockRejectedValue(aiError);

        // Mock dla logowania błędu
        mockSupabase._mocks.insert.mockResolvedValue({ data: null, error: null });

        // Act & Assert
        await expect(createGeneration(ctx, { sourceText: VALID_SOURCE_TEXT })).rejects.toMatchObject({
          status: 500,
          code: "AI_GENERATION_FAILED",
        });
      });
    });

    describe("Błąd zapisu do bazy danych", () => {
      it("should throw GENERATION_PERSIST_FAILED on database error", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        vi.mocked(hashModule.computeMD5).mockResolvedValue({ output: "hash" });
        vi.mocked(flashcardsGeneratorModule.generateFlashcardProposals).mockResolvedValue(MOCK_FLASHCARD_PROPOSALS);

        mockSupabase._mocks.single.mockResolvedValue(MOCK_SUPABASE_ERROR_INSERT);

        // Act & Assert
        await expect(createGeneration(ctx, { sourceText: VALID_SOURCE_TEXT })).rejects.toMatchObject({
          status: 500,
          code: "GENERATION_PERSIST_FAILED",
        });
      });

      it("should log error when database insert fails", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        vi.mocked(hashModule.computeMD5).mockResolvedValue({ output: "hash" });
        vi.mocked(flashcardsGeneratorModule.generateFlashcardProposals).mockResolvedValue(MOCK_FLASHCARD_PROPOSALS);

        mockSupabase._mocks.single.mockResolvedValue(MOCK_SUPABASE_ERROR_INSERT);

        // Act
        await expect(createGeneration(ctx, { sourceText: VALID_SOURCE_TEXT })).rejects.toThrow();

        // Assert
        expect(mockSupabase.from).toHaveBeenCalledWith("generation_error_logs");
      });
    });
  });

  // ============================================================================
  // listGenerations
  // ============================================================================

  describe("listGenerations", () => {
    describe("Listowanie generacji z domyślnymi parametrami", () => {
      it("should list generations with default parameters", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        const mockData = createMockGenerationsList(3);
        mockSupabase._mocks.range.mockResolvedValue({
          data: mockData,
          error: null,
          count: 3,
        });

        // Act
        const result = await listGenerations(ctx, {
          page: 1,
          pageSize: 10,
          sort: "createdAt",
          order: "desc",
        });

        // Assert
        expect(result.items).toHaveLength(3);
        expect(result.pagination).toEqual({
          page: 1,
          pageSize: 10,
          total: 3,
        });
        expect(mockSupabase._mocks.eq).toHaveBeenCalledWith("user_id", TEST_USER_ID);
        expect(mockSupabase._mocks.order).toHaveBeenCalledWith("created_at", {
          ascending: false,
        });
        expect(mockSupabase._mocks.range).toHaveBeenCalledWith(0, 9);
      });
    });

    describe("Paginacja", () => {
      it("should handle page 2 with pageSize 5", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        const mockData = createMockGenerationsList(5);
        mockSupabase._mocks.range.mockResolvedValue({
          data: mockData,
          error: null,
          count: 12,
        });

        // Act
        const result = await listGenerations(ctx, {
          page: 2,
          pageSize: 5,
          sort: "createdAt",
          order: "desc",
        });

        // Assert
        expect(mockSupabase._mocks.range).toHaveBeenCalledWith(5, 9);
        expect(result.pagination.total).toBe(12);
        expect(result.pagination.page).toBe(2);
        expect(result.pagination.pageSize).toBe(5);
      });

      it("should calculate correct offset for page 3", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        mockSupabase._mocks.range.mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        });

        // Act
        await listGenerations(ctx, {
          page: 3,
          pageSize: 10,
          sort: "createdAt",
          order: "desc",
        });

        // Assert
        expect(mockSupabase._mocks.range).toHaveBeenCalledWith(20, 29);
      });
    });

    describe("Sortowanie", () => {
      it("should sort by createdAt", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        mockSupabase._mocks.range.mockResolvedValue(MOCK_SUPABASE_EMPTY_RESULT);

        // Act
        await listGenerations(ctx, {
          page: 1,
          pageSize: 10,
          sort: "createdAt",
          order: "desc",
        });

        // Assert
        expect(mockSupabase._mocks.order).toHaveBeenCalledWith("created_at", {
          ascending: false,
        });
      });

      it("should sort by updatedAt", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        mockSupabase._mocks.range.mockResolvedValue(MOCK_SUPABASE_EMPTY_RESULT);

        // Act
        await listGenerations(ctx, {
          page: 1,
          pageSize: 10,
          sort: "updatedAt",
          order: "asc",
        });

        // Assert
        expect(mockSupabase._mocks.order).toHaveBeenCalledWith("updated_at", {
          ascending: true,
        });
      });

      it("should sort by generatedCount", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        mockSupabase._mocks.range.mockResolvedValue(MOCK_SUPABASE_EMPTY_RESULT);

        // Act
        await listGenerations(ctx, {
          page: 1,
          pageSize: 10,
          sort: "generatedCount",
          order: "asc",
        });

        // Assert
        expect(mockSupabase._mocks.order).toHaveBeenCalledWith("generated_count", {
          ascending: true,
        });
      });

      it("should sort by model", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        mockSupabase._mocks.range.mockResolvedValue(MOCK_SUPABASE_EMPTY_RESULT);

        // Act
        await listGenerations(ctx, {
          page: 1,
          pageSize: 10,
          sort: "model",
          order: "desc",
        });

        // Assert
        expect(mockSupabase._mocks.order).toHaveBeenCalledWith("model", {
          ascending: false,
        });
      });

      it("should fallback to createdAt for invalid sort field", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        mockSupabase._mocks.range.mockResolvedValue(MOCK_SUPABASE_EMPTY_RESULT);

        // Act
        await listGenerations(ctx, {
          page: 1,
          pageSize: 10,
          sort: "invalidField",
          order: "desc",
        });

        // Assert
        expect(mockSupabase._mocks.order).toHaveBeenCalledWith("created_at", {
          ascending: false,
        });
      });
    });

    describe("Filtrowanie", () => {
      it("should filter by model", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        mockSupabase._mocks.range.mockResolvedValue(MOCK_SUPABASE_EMPTY_RESULT);

        // Act
        await listGenerations(ctx, {
          page: 1,
          pageSize: 10,
          sort: "createdAt",
          order: "desc",
          model: "openai/gpt-4o-mini",
        });

        // Assert
        expect(mockSupabase._mocks.eq).toHaveBeenCalledWith("model", "openai/gpt-4o-mini");
      });

      it("should filter by createdFrom date", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        mockSupabase._mocks.range.mockResolvedValue(MOCK_SUPABASE_EMPTY_RESULT);

        // Act
        await listGenerations(ctx, {
          page: 1,
          pageSize: 10,
          sort: "createdAt",
          order: "desc",
          createdFrom: "2024-01-01T00:00:00.000Z",
        });

        // Assert
        expect(mockSupabase._mocks.gte).toHaveBeenCalledWith("created_at", "2024-01-01T00:00:00.000Z");
      });

      it("should filter by createdTo date", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        mockSupabase._mocks.range.mockResolvedValue(MOCK_SUPABASE_EMPTY_RESULT);

        // Act
        await listGenerations(ctx, {
          page: 1,
          pageSize: 10,
          sort: "createdAt",
          order: "desc",
          createdTo: "2024-12-31T23:59:59.999Z",
        });

        // Assert
        expect(mockSupabase._mocks.lte).toHaveBeenCalledWith("created_at", "2024-12-31T23:59:59.999Z");
      });

      it("should apply all filters combined", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        mockSupabase._mocks.range.mockResolvedValue(MOCK_SUPABASE_EMPTY_RESULT);

        // Act
        await listGenerations(ctx, {
          page: 2,
          pageSize: 20,
          sort: "generatedCount",
          order: "asc",
          model: "openai/gpt-4o-mini",
          createdFrom: "2024-01-01T00:00:00.000Z",
          createdTo: "2024-12-31T23:59:59.999Z",
        });

        // Assert
        expect(mockSupabase._mocks.eq).toHaveBeenCalledWith("model", "openai/gpt-4o-mini");
        expect(mockSupabase._mocks.gte).toHaveBeenCalledWith("created_at", "2024-01-01T00:00:00.000Z");
        expect(mockSupabase._mocks.lte).toHaveBeenCalledWith("created_at", "2024-12-31T23:59:59.999Z");
        expect(mockSupabase._mocks.order).toHaveBeenCalledWith("generated_count", {
          ascending: true,
        });
        expect(mockSupabase._mocks.range).toHaveBeenCalledWith(20, 39);
      });
    });

    describe("Pusta lista", () => {
      it("should return empty list when no generations exist", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        mockSupabase._mocks.range.mockResolvedValue(MOCK_SUPABASE_EMPTY_RESULT);

        // Act
        const result = await listGenerations(ctx, {
          page: 1,
          pageSize: 10,
          sort: "createdAt",
          order: "desc",
        });

        // Assert
        expect(result.items).toEqual([]);
        expect(result.pagination.total).toBe(0);
      });
    });

    describe("Błędy", () => {
      it("should throw GENERATION_LIST_FAILED on database error", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        mockSupabase._mocks.range.mockResolvedValue({
          data: null,
          error: { message: "DB error" },
          count: null,
        });

        // Act & Assert
        await expect(
          listGenerations(ctx, {
            page: 1,
            pageSize: 10,
            sort: "createdAt",
            order: "desc",
          })
        ).rejects.toMatchObject({
          status: 500,
          code: "GENERATION_LIST_FAILED",
        });
      });

      it("should throw USER_NOT_AUTHENTICATED when user is null", async () => {
        // Arrange
        const ctx = createMockContext({ user: null });

        // Act & Assert
        await expect(
          listGenerations(ctx, {
            page: 1,
            pageSize: 10,
            sort: "createdAt",
            order: "desc",
          })
        ).rejects.toMatchObject({
          status: 401,
          code: "USER_NOT_AUTHENTICATED",
        });
      });
    });

    describe("Mapowanie pól", () => {
      it("should map snake_case to camelCase", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        mockSupabase._mocks.range.mockResolvedValue({
          data: [MOCK_GENERATION_ROW],
          error: null,
          count: 1,
        });

        // Act
        const result = await listGenerations(ctx, {
          page: 1,
          pageSize: 10,
          sort: "createdAt",
          order: "desc",
        });

        // Assert
        const item = result.items[0];
        expect(item).toHaveProperty("sourceTextHash");
        expect(item).toHaveProperty("sourceTextLength");
        expect(item).toHaveProperty("generatedCount");
        expect(item).toHaveProperty("generationDuration");
        expect(item).toHaveProperty("createdAt");
        expect(item).toHaveProperty("updatedAt");
        expect(item).not.toHaveProperty("user_id");
      });
    });
  });

  // ============================================================================
  // getGenerationById
  // ============================================================================

  describe("getGenerationById", () => {
    describe("Pobranie istniejącej generacji", () => {
      it("should return generation when it exists", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        mockSupabase._mocks.maybeSingle.mockResolvedValue({
          data: MOCK_GENERATION_ROW,
          error: null,
        });

        // Act
        const result = await getGenerationById(ctx, 1);

        // Assert
        expect(result).not.toBeNull();
        expect(result?.id).toBe(1);
        expect(mockSupabase._mocks.eq).toHaveBeenCalledWith("user_id", TEST_USER_ID);
        expect(mockSupabase._mocks.eq).toHaveBeenCalledWith("id", 1);
      });
    });

    describe("Próba pobrania nieistniejącej generacji", () => {
      it("should return null when generation does not exist", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        mockSupabase._mocks.maybeSingle.mockResolvedValue({
          data: null,
          error: null,
        });

        // Act
        const result = await getGenerationById(ctx, 999);

        // Assert
        expect(result).toBeNull();
      });
    });

    describe("Próba pobrania generacji innego użytkownika", () => {
      it("should return null when generation belongs to different user", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        mockSupabase._mocks.maybeSingle.mockResolvedValue({
          data: null,
          error: null,
        });

        // Act
        const result = await getGenerationById(ctx, 1);

        // Assert
        expect(result).toBeNull();
        expect(mockSupabase._mocks.eq).toHaveBeenCalledWith("user_id", TEST_USER_ID);
      });
    });

    describe("Błędy bazy danych", () => {
      it("should throw GENERATION_FETCH_FAILED on database error", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        mockSupabase._mocks.maybeSingle.mockResolvedValue({
          data: null,
          error: { code: "UNKNOWN", message: "DB error" },
        });

        // Act & Assert
        await expect(getGenerationById(ctx, 1)).rejects.toMatchObject({
          status: 500,
          code: "GENERATION_FETCH_FAILED",
        });
      });

      it("should return null for PGRST116 error (not found)", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        mockSupabase._mocks.maybeSingle.mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: "Not found" },
        });

        // Act
        const result = await getGenerationById(ctx, 1);

        // Assert
        expect(result).toBeNull();
      });
    });

    describe("Uwierzytelnienie", () => {
      it("should throw USER_NOT_AUTHENTICATED when user is null", async () => {
        // Arrange
        const ctx = createMockContext({ user: null });

        // Act & Assert
        await expect(getGenerationById(ctx, 1)).rejects.toMatchObject({
          status: 401,
          code: "USER_NOT_AUTHENTICATED",
        });
      });
    });

    describe("Mapowanie pól", () => {
      it("should map snake_case to camelCase", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        mockSupabase._mocks.maybeSingle.mockResolvedValue({
          data: MOCK_GENERATION_ROW,
          error: null,
        });

        // Act
        const result = await getGenerationById(ctx, 1);

        // Assert
        expect(result).toHaveProperty("sourceTextHash");
        expect(result).toHaveProperty("sourceTextLength");
        expect(result).toHaveProperty("generatedCount");
        expect(result).toHaveProperty("generationDuration");
        expect(result).not.toHaveProperty("user_id");
      });
    });
  });

  // ============================================================================
  // deleteGeneration
  // ============================================================================

  describe("deleteGeneration", () => {
    describe("Pomyślne usunięcie generacji", () => {
      it("should return true when generation is deleted", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        mockSupabase._mocks.select.mockResolvedValue(MOCK_SUPABASE_SUCCESS_DELETE);

        // Act
        const result = await deleteGeneration(ctx, 1);

        // Assert
        expect(result).toBe(true);
        expect(mockSupabase._mocks.eq).toHaveBeenCalledWith("user_id", TEST_USER_ID);
        expect(mockSupabase._mocks.eq).toHaveBeenCalledWith("id", 1);
      });
    });

    describe("Próba usunięcia nieistniejącej generacji", () => {
      it("should return false when generation does not exist", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        mockSupabase._mocks.select.mockResolvedValue({
          data: [],
          error: null,
        });

        // Act
        const result = await deleteGeneration(ctx, 999);

        // Assert
        expect(result).toBe(false);
      });
    });

    describe("Próba usunięcia generacji innego użytkownika", () => {
      it("should return false when generation belongs to different user", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        mockSupabase._mocks.select.mockResolvedValue({
          data: [],
          error: null,
        });

        // Act
        const result = await deleteGeneration(ctx, 1);

        // Assert
        expect(result).toBe(false);
        expect(mockSupabase._mocks.eq).toHaveBeenCalledWith("user_id", TEST_USER_ID);
      });
    });

    describe("Błędy bazy danych", () => {
      it("should throw GENERATION_DELETE_FAILED on database error", async () => {
        // Arrange
        const mockSupabase = createMockSupabaseClient();
        const ctx = createMockContext({ supabase: mockSupabase });

        mockSupabase._mocks.select.mockResolvedValue({
          data: null,
          error: { message: "DB error" },
        });

        // Act & Assert
        await expect(deleteGeneration(ctx, 1)).rejects.toMatchObject({
          status: 500,
          code: "GENERATION_DELETE_FAILED",
        });
      });
    });

    describe("Uwierzytelnienie", () => {
      it("should throw USER_NOT_AUTHENTICATED when user is null", async () => {
        // Arrange
        const ctx = createMockContext({ user: null });

        // Act & Assert
        await expect(deleteGeneration(ctx, 1)).rejects.toMatchObject({
          status: 401,
          code: "USER_NOT_AUTHENTICATED",
        });
      });
    });
  });

  // ============================================================================
  // Funkcje pomocnicze
  // ============================================================================

  describe("isPostgrestNotFoundError", () => {
    it("should return true for PGRST116 error", () => {
      const error = { code: "PGRST116", message: "Not found" } as unknown;

      const result = isPostgrestNotFoundError(error);

      expect(result).toBe(true);
    });

    it("should return false for other error codes", () => {
      const error = { code: "OTHER", message: "Error" } as unknown;

      const result = isPostgrestNotFoundError(error);

      expect(result).toBe(false);
    });

    it("should return false for null", () => {
      const result = isPostgrestNotFoundError(null);

      expect(result).toBe(false);
    });

    it("should return false for undefined", () => {
      const result = isPostgrestNotFoundError(undefined as unknown);

      expect(result).toBe(false);
    });
  });
});
