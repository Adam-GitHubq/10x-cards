/**
 * Mock data i fixtures dla testów modułu generations
 */

import type {
  GenerationBaseDto,
  FlashcardProposalDto,
  CreateGenerationResponseDto,
  PaginatedResponse,
} from "../../types";
import type { APIContext } from "astro";
import { vi } from "vitest";

// ============================================================================
// Stałe testowe
// ============================================================================

export const TEST_USER_ID = "test-user-123";
export const TEST_USER_EMAIL = "test@example.com";
export const DEFAULT_MODEL = "openai/gpt-4o-mini";

// Teksty źródłowe o różnych długościach
export const MIN_SOURCE_TEXT = "A".repeat(1000);
export const MAX_SOURCE_TEXT = "A".repeat(10000);
export const VALID_SOURCE_TEXT = "A".repeat(5000);
export const TOO_SHORT_TEXT = "A".repeat(999);
export const TOO_LONG_TEXT = "A".repeat(10001);
export const SHORT_TEXT_FOR_AI = "A".repeat(100); // Dla testów AI (min 50 znaków)
export const TOO_SHORT_FOR_AI = "A".repeat(49); // Poniżej minimum dla AI

// ============================================================================
// Mock danych - Generations
// ============================================================================

export const MOCK_GENERATION_ROW = {
  id: 1,
  user_id: TEST_USER_ID,
  model: DEFAULT_MODEL,
  source_text_hash: "d41d8cd98f00b204e9800998ecf8427e",
  source_text_length: 5000,
  generated_count: 5,
  generation_duration: 1234,
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
};

export const MOCK_GENERATION_DTO: GenerationBaseDto = {
  id: 1,
  model: DEFAULT_MODEL,
  sourceTextHash: "d41d8cd98f00b204e9800998ecf8427e",
  sourceTextLength: 5000,
  generatedCount: 5,
  generationDuration: 1234,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

export const MOCK_FLASHCARD_PROPOSALS: FlashcardProposalDto[] = [
  { front: "Pytanie 1", back: "Odpowiedź 1", source: "ai-full" },
  { front: "Pytanie 2", back: "Odpowiedź 2", source: "ai-full" },
  { front: "Pytanie 3", back: "Odpowiedź 3", source: "ai-full" },
  { front: "Pytanie 4", back: "Odpowiedź 4", source: "ai-full" },
  { front: "Pytanie 5", back: "Odpowiedź 5", source: "ai-full" },
];

export const MOCK_CREATE_GENERATION_RESPONSE: CreateGenerationResponseDto = {
  generation: MOCK_GENERATION_DTO,
  flashcardsProposals: MOCK_FLASHCARD_PROPOSALS,
};

// ============================================================================
// Mock funkcji Supabase
// ============================================================================

export function createMockSupabaseClient() {
  const mockSelect = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockGte = vi.fn().mockReturnThis();
  const mockLte = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();
  const mockRange = vi.fn().mockReturnThis();
  const mockSingle = vi.fn();
  const mockMaybeSingle = vi.fn();

  return {
    from: vi.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      delete: mockDelete,
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
      order: mockOrder,
      range: mockRange,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
    }),
    // Referencje do mocków dla łatwego dostępu w testach
    _mocks: {
      select: mockSelect,
      insert: mockInsert,
      delete: mockDelete,
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
      order: mockOrder,
      range: mockRange,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
    },
  };
}

// ============================================================================
// Mock kontekstu Astro
// ============================================================================

export function createMockContext(options: {
  user?: { id: string; email: string | null } | null;
  supabase?: ReturnType<typeof createMockSupabaseClient>;
}): Pick<APIContext, "locals"> {
  return {
    locals: {
      user: options.user !== undefined ? options.user : { id: TEST_USER_ID, email: TEST_USER_EMAIL },
      supabase: options.supabase !== undefined ? options.supabase : createMockSupabaseClient(),
    },
  };
}

// ============================================================================
// Mock odpowiedzi Supabase
// ============================================================================

export const MOCK_SUPABASE_SUCCESS_INSERT = {
  data: MOCK_GENERATION_ROW,
  error: null,
};

export const MOCK_SUPABASE_ERROR_INSERT = {
  data: null,
  error: {
    message: "Database error",
    code: "DB_ERROR",
  },
};

export const MOCK_SUPABASE_SUCCESS_SELECT = {
  data: [MOCK_GENERATION_ROW],
  error: null,
  count: 1,
};

export const MOCK_SUPABASE_SUCCESS_SELECT_SINGLE = {
  data: MOCK_GENERATION_ROW,
  error: null,
};

export const MOCK_SUPABASE_SUCCESS_DELETE = {
  data: [{ id: 1 }],
  error: null,
};

export const MOCK_SUPABASE_NOT_FOUND = {
  data: null,
  error: {
    code: "PGRST116",
    message: "Not found",
  },
};

export const MOCK_SUPABASE_EMPTY_RESULT = {
  data: [],
  error: null,
  count: 0,
};

// ============================================================================
// Helpery dla testów
// ============================================================================

/**
 * Tworzy mock kontekstu z Request dla testów endpointów
 */
export function createMockAPIContext(options: {
  method: string;
  url: string;
  body?: unknown;
  params?: Record<string, string>;
  user?: { id: string; email: string | null } | null;
  supabase?: ReturnType<typeof createMockSupabaseClient>;
}): Partial<APIContext> {
  const requestInit: RequestInit = {
    method: options.method,
    headers: { "Content-Type": "application/json" },
  };

  if (options.body !== undefined) {
    requestInit.body = JSON.stringify(options.body);
  }

  return {
    request: new Request(options.url, requestInit),
    params: options.params,
    locals: {
      user: options.user !== undefined ? options.user : { id: TEST_USER_ID, email: TEST_USER_EMAIL },
      supabase: options.supabase !== undefined ? options.supabase : createMockSupabaseClient(),
    },
  };
}

/**
 * Tworzy AuthApiError podobny do błędów Supabase
 */
export function createAuthApiError(message: string, status?: number): Error & { name: string; status?: number } {
  const error = new Error(message) as Error & { name: string; status?: number };
  error.name = "AuthApiError";
  error.status = status;
  return error;
}

/**
 * Tworzy mock dla generateFlashcardProposals
 */
export function createMockFlashcardGenerator() {
  return vi.fn().mockResolvedValue(MOCK_FLASHCARD_PROPOSALS);
}

/**
 * Tworzy mock dla computeMD5
 */
export function createMockHashFunction() {
  return vi.fn().mockResolvedValue({
    output: "d41d8cd98f00b204e9800998ecf8427e",
  });
}

// ============================================================================
// Dane testowe dla różnych scenariuszy
// ============================================================================

/**
 * Zestaw generacji dla testów listowania
 */
export function createMockGenerationsList(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    ...MOCK_GENERATION_ROW,
    id: i + 1,
    source_text_hash: `hash-${i + 1}`,
    created_at: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
  }));
}

/**
 * Odpowiedź paginowana dla testów
 */
export function createMockPaginatedResponse<T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number
): PaginatedResponse<T> {
  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
    },
  };
}
