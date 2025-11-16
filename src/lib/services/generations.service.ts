import type { APIContext } from "astro";
import type { PostgrestError } from "@supabase/supabase-js";

import type {
  CreateGenerationCommand,
  CreateGenerationResponseDto,
  GenerationBaseDto,
  PaginatedResponse,
} from "../../types";
import type { ListGenerationsQueryInput } from "../schemas/generations";
import { computeMD5 } from "../utils/hash";
import { generateFlashcardProposals, FlashcardGenerationError } from "./ai/flashcardsGenerator";

// User ID is now resolved from locals.user (authenticated user from Supabase Auth)
const DEFAULT_MODEL = "openai/gpt-4o-mini";

type SupabaseServerClient = App.Locals["supabase"];

type GenerationRow = {
  id: number;
  user_id: string;
  model: string;
  source_text_hash: string;
  source_text_length: number;
  generated_count: number;
  generation_duration: number;
  created_at: string;
  updated_at: string;
};

const SORTABLE_COLUMNS: Record<string, keyof GenerationRow> = {
  createdAt: "created_at",
  updatedAt: "updated_at",
  generatedCount: "generated_count",
  model: "model",
};

// TODO: Rozszerzyć obsługę sortowania o dodatkowe kolumny przy implementacji frontu.
const DEFAULT_SORT_FIELD = SORTABLE_COLUMNS.createdAt;

type GenerationErrorLogInsert = {
  user_id: string;
  model: string;
  source_text_hash: string;
  source_text_length: number;
  error_code: string;
  error_message: string;
};

export class GenerationServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string
  ) {
    super(message);
    this.name = "GenerationServiceError";
  }
}

const ERROR_CODES = {
  AI_GENERATION_FAILED: "AI_GENERATION_FAILED",
  GENERATION_PERSIST_FAILED: "GENERATION_PERSIST_FAILED",
  GENERATION_LIST_FAILED: "GENERATION_LIST_FAILED",
  GENERATION_FETCH_FAILED: "GENERATION_FETCH_FAILED",
  GENERATION_NOT_FOUND: "GENERATION_NOT_FOUND",
  GENERATION_DELETE_FAILED: "GENERATION_DELETE_FAILED",
  USER_NOT_AUTHENTICATED: "USER_NOT_AUTHENTICATED",
  SUPABASE_NOT_AVAILABLE: "SUPABASE_NOT_AVAILABLE",
} as const;

const ERROR_MESSAGES = {
  [ERROR_CODES.AI_GENERATION_FAILED]: "Nie udało się wygenerować propozycji fiszek.",
  [ERROR_CODES.GENERATION_PERSIST_FAILED]: "Nie udało się zapisać danych generacji.",
  [ERROR_CODES.GENERATION_LIST_FAILED]: "Nie udało się pobrać listy generacji.",
  [ERROR_CODES.GENERATION_FETCH_FAILED]: "Nie udało się pobrać generacji.",
  [ERROR_CODES.GENERATION_NOT_FOUND]: "Nie znaleziono generacji o podanym identyfikatorze.",
  [ERROR_CODES.GENERATION_DELETE_FAILED]: "Nie udało się usunąć generacji.",
  [ERROR_CODES.USER_NOT_AUTHENTICATED]: "Brak uwierzytelnionego użytkownika.",
  [ERROR_CODES.SUPABASE_NOT_AVAILABLE]: "Klient Supabase nie jest dostępny.",
} as const;

function getSupabaseClient(ctx: Pick<APIContext, "locals">): SupabaseServerClient {
  const supabase = ctx.locals?.supabase;

  if (!supabase) {
    throw new GenerationServiceError(
      ERROR_MESSAGES[ERROR_CODES.SUPABASE_NOT_AVAILABLE],
      500,
      ERROR_CODES.SUPABASE_NOT_AVAILABLE
    );
  }

  return supabase;
}

function resolveUserId(ctx: Pick<APIContext, "locals">): string {
  const user = ctx.locals?.user;

  if (!user || !user.id) {
    throw new GenerationServiceError(
      ERROR_MESSAGES[ERROR_CODES.USER_NOT_AUTHENTICATED],
      401,
      ERROR_CODES.USER_NOT_AUTHENTICATED
    );
  }

  return user.id;
}

function mapGenerationRowToDto(row: GenerationRow): GenerationBaseDto {
  return {
    id: row.id,
    model: row.model,
    sourceTextHash: row.source_text_hash,
    sourceTextLength: row.source_text_length,
    generatedCount: row.generated_count,
    generationDuration: row.generation_duration,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function logGenerationError(supabase: SupabaseServerClient, payload: GenerationErrorLogInsert): Promise<void> {
  const { error } = await supabase.from("generation_error_logs").insert({
    ...payload,
    // created_at ustawiane po stronie bazy
  });

  if (error) {
    // Jeśli nie uda się zapisać logu, nie eskalujemy błędu, ale wypisujemy go w konsoli.
  }
}

function extractErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }

  return "Nieznany błąd";
}

export async function createGeneration(
  ctx: Pick<APIContext, "locals">,
  command: CreateGenerationCommand
): Promise<CreateGenerationResponseDto> {
  const supabase = getSupabaseClient(ctx);
  const userId = resolveUserId(ctx);

  const model = DEFAULT_MODEL;
  const sourceText = command.sourceText;
  const sourceTextLength = sourceText.length;
  const { output: sourceTextHash } = await computeMD5(sourceText);
  const startedAt = Date.now();

  let flashcardsProposals;

  try {
    // Get API key from runtime env (Cloudflare) or import.meta.env (local)
    const apiKey = ctx.locals.runtime?.env?.OPENROUTER_API_KEY;
    flashcardsProposals = await generateFlashcardProposals({ sourceText, apiKey });
  } catch (error) {
    // Określenie kodu błędu na podstawie typu błędu
    const errorCode = ERROR_CODES.AI_GENERATION_FAILED;
    let statusCode = 500;

    if (error instanceof FlashcardGenerationError) {
      // Mapowanie błędów walidacji na odpowiednie kody HTTP
      if (error.code === "INVALID_INPUT" || error.code === "TEXT_TOO_SHORT") {
        statusCode = 400;
      }
    }

    const errorMessage = extractErrorMessage(error);

    await logGenerationError(supabase, {
      user_id: userId,
      model,
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
      error_code: errorCode,
      error_message: errorMessage,
    });

    throw new GenerationServiceError(errorMessage, statusCode, errorCode);
  }

  const generationDuration = Date.now() - startedAt;

  const { data, error } = await supabase
    .from("generations")
    .insert({
      user_id: userId,
      model,
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
      generated_count: flashcardsProposals.length,
      generation_duration: generationDuration,
    })
    .select("*")
    .single();

  if (error || !data) {
    const errorMessage = extractErrorMessage(error);

    await logGenerationError(supabase, {
      user_id: userId,
      model,
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
      error_code: ERROR_CODES.GENERATION_PERSIST_FAILED,
      error_message: errorMessage,
    });

    throw new GenerationServiceError(
      ERROR_MESSAGES[ERROR_CODES.GENERATION_PERSIST_FAILED],
      500,
      ERROR_CODES.GENERATION_PERSIST_FAILED
    );
  }

  return {
    generation: mapGenerationRowToDto(data as GenerationRow),
    flashcardsProposals,
  };
}

export async function listGenerations(
  ctx: Pick<APIContext, "locals">,
  query: ListGenerationsQueryInput
): Promise<PaginatedResponse<GenerationBaseDto>> {
  const supabase = getSupabaseClient(ctx);
  const userId = resolveUserId(ctx);

  const page = query.page;
  const pageSize = query.pageSize;
  const offset = (page - 1) * pageSize;
  const rangeEnd = offset + pageSize - 1;
  const requestedSort = query.sort;
  const sortColumn =
    requestedSort && SORTABLE_COLUMNS[requestedSort] ? SORTABLE_COLUMNS[requestedSort] : DEFAULT_SORT_FIELD;
  const orderDirection: "asc" | "desc" = query.order;

  let builder = supabase.from("generations").select("*", { count: "exact" }).eq("user_id", userId);

  if (query.model) {
    builder = builder.eq("model", query.model);
  }

  if (query.createdFrom) {
    builder = builder.gte("created_at", query.createdFrom);
  }

  if (query.createdTo) {
    builder = builder.lte("created_at", query.createdTo);
  }

  const { data, error, count } = await builder
    .order(sortColumn, { ascending: orderDirection === "asc" })
    .range(offset, rangeEnd);

  if (error || !data) {
    throw new GenerationServiceError(
      ERROR_MESSAGES[ERROR_CODES.GENERATION_LIST_FAILED],
      500,
      ERROR_CODES.GENERATION_LIST_FAILED
    );
  }

  const items = data.map((row) => mapGenerationRowToDto(row as GenerationRow));

  return {
    items,
    pagination: {
      page,
      pageSize,
      total: count ?? items.length,
    },
  };
}

export async function getGenerationById(
  ctx: Pick<APIContext, "locals">,
  id: number
): Promise<GenerationBaseDto | null> {
  const supabase = getSupabaseClient(ctx);
  const userId = resolveUserId(ctx);

  const { data, error } = await supabase
    .from("generations")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw new GenerationServiceError(
      ERROR_MESSAGES[ERROR_CODES.GENERATION_FETCH_FAILED],
      500,
      ERROR_CODES.GENERATION_FETCH_FAILED
    );
  }

  if (!data) {
    return null;
  }

  return mapGenerationRowToDto(data as GenerationRow);
}

export async function deleteGeneration(ctx: Pick<APIContext, "locals">, id: number): Promise<boolean> {
  const supabase = getSupabaseClient(ctx);
  const userId = resolveUserId(ctx);

  const { data, error } = await supabase.from("generations").delete().eq("user_id", userId).eq("id", id).select("id");

  if (error) {
    throw new GenerationServiceError(
      ERROR_MESSAGES[ERROR_CODES.GENERATION_DELETE_FAILED],
      500,
      ERROR_CODES.GENERATION_DELETE_FAILED
    );
  }

  return Array.isArray(data) && data.length > 0;
}

export function isPostgrestNotFoundError(error: PostgrestError | null): boolean {
  return Boolean(error && error.code === "PGRST116");
}
