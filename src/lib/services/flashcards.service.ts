import type { APIContext } from "astro";
import type { PostgrestError } from "@supabase/supabase-js";

import type {
  CreateFlashcardsCommand,
  CreateFlashcardsResponseDto,
  FlashcardDto,
  FlashcardListQueryParams,
  ListFlashcardsResponseDto,
  UpdateFlashcardCommand,
} from "../../types";
import type { ListFlashcardsQueryInput, PostFlashcardsBodyInput } from "../schemas/flashcards";

const DEFAULT_SUPABASE_USER_ID = import.meta.env.DEFAULT_SUPABASE_USER_ID;

if (!DEFAULT_SUPABASE_USER_ID) {
  throw new Error("Brak wartości DEFAULT_SUPABASE_USER_ID w zmiennych środowiskowych");
}

type SupabaseServerClient = App.Locals["supabase"];

type FlashcardRow = {
  id: number;
  user_id: string;
  generation_id: number | null;
  source: string;
  front: string;
  back: string;
  created_at: string;
  updated_at: string;
};

type GenerationRow = {
  id: number;
};

const SORTABLE_COLUMNS: Record<string, keyof FlashcardRow> = {
  createdAt: "created_at",
};

const DEFAULT_SORT_FIELD = SORTABLE_COLUMNS.createdAt;

export class FlashcardServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string
  ) {
    super(message);
    this.name = "FlashcardServiceError";
  }
}

const ERROR_CODES = {
  FLASHCARD_CREATE_FAILED: "FLASHCARD_CREATE_FAILED",
  FLASHCARD_LIST_FAILED: "FLASHCARD_LIST_FAILED",
  FLASHCARD_FETCH_FAILED: "FLASHCARD_FETCH_FAILED",
  FLASHCARD_UPDATE_FAILED: "FLASHCARD_UPDATE_FAILED",
  FLASHCARD_DELETE_FAILED: "FLASHCARD_DELETE_FAILED",
  INVALID_GENERATION_REFERENCE: "INVALID_GENERATION_REFERENCE",
  GENERATION_NOT_FOUND: "GENERATION_NOT_FOUND",
  USER_NOT_AUTHENTICATED: "USER_NOT_AUTHENTICATED",
  SUPABASE_NOT_AVAILABLE: "SUPABASE_NOT_AVAILABLE",
} as const;

const ERROR_MESSAGES = {
  [ERROR_CODES.FLASHCARD_CREATE_FAILED]: "Nie udało się utworzyć fiszek.",
  [ERROR_CODES.FLASHCARD_LIST_FAILED]: "Nie udało się pobrać listy fiszek.",
  [ERROR_CODES.FLASHCARD_FETCH_FAILED]: "Nie udało się pobrać fiszki.",
  [ERROR_CODES.FLASHCARD_UPDATE_FAILED]: "Nie udało się zaktualizować fiszki.",
  [ERROR_CODES.FLASHCARD_DELETE_FAILED]: "Nie udało się usunąć fiszki.",
  [ERROR_CODES.INVALID_GENERATION_REFERENCE]: "Co najmniej jedna fiszka zawiera nieprawidłowe powiązanie z generacją.",
  [ERROR_CODES.GENERATION_NOT_FOUND]: "Nie znaleziono generacji powiązanej z co najmniej jedną fiszką.",
  [ERROR_CODES.USER_NOT_AUTHENTICATED]: "Brak uwierzytelnionego użytkownika.",
  [ERROR_CODES.SUPABASE_NOT_AVAILABLE]: "Klient Supabase nie jest dostępny.",
} as const;

function getSupabaseClient(ctx: Pick<APIContext, "locals">): SupabaseServerClient {
  const supabase = ctx.locals?.supabase;

  if (!supabase) {
    throw new FlashcardServiceError(
      ERROR_MESSAGES[ERROR_CODES.SUPABASE_NOT_AVAILABLE],
      500,
      ERROR_CODES.SUPABASE_NOT_AVAILABLE
    );
  }

  return supabase;
}

function resolveUserId(): string {
  if (!DEFAULT_SUPABASE_USER_ID) {
    throw new FlashcardServiceError(
      ERROR_MESSAGES[ERROR_CODES.USER_NOT_AUTHENTICATED],
      401,
      ERROR_CODES.USER_NOT_AUTHENTICATED
    );
  }

  return DEFAULT_SUPABASE_USER_ID;
}

function mapFlashcardRowToDto(row: FlashcardRow): FlashcardDto {
  return {
    id: row.id,
    generationId: row.generation_id,
    source: row.source as FlashcardDto["source"],
    front: row.front,
    back: row.back,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isPostgrestNotFoundError(error: PostgrestError | null): boolean {
  return Boolean(error && error.code === "PGRST116");
}

async function assertGenerationsExist(
  supabase: SupabaseServerClient,
  userId: string,
  generationIds: number[]
): Promise<void> {
  if (generationIds.length === 0) {
    return;
  }

  const { data, error } = await supabase.from("generations").select("id").eq("user_id", userId).in("id", generationIds);

  if (error) {
    throw new FlashcardServiceError(
      ERROR_MESSAGES[ERROR_CODES.FLASHCARD_CREATE_FAILED],
      500,
      ERROR_CODES.FLASHCARD_CREATE_FAILED
    );
  }

  const foundIds = new Set((data as GenerationRow[]).map((row) => row.id));
  const missingIds = generationIds.filter((id) => !foundIds.has(id));

  if (missingIds.length > 0) {
    throw new FlashcardServiceError(
      ERROR_MESSAGES[ERROR_CODES.GENERATION_NOT_FOUND],
      404,
      ERROR_CODES.GENERATION_NOT_FOUND
    );
  }
}

export async function createFlashcards(
  ctx: Pick<APIContext, "locals">,
  command: CreateFlashcardsCommand | PostFlashcardsBodyInput
): Promise<CreateFlashcardsResponseDto> {
  const supabase = getSupabaseClient(ctx);
  const userId = resolveUserId();
  const cards = command.cards ?? [];

  if (cards.length === 0) {
    throw new FlashcardServiceError(
      ERROR_MESSAGES[ERROR_CODES.FLASHCARD_CREATE_FAILED],
      400,
      ERROR_CODES.FLASHCARD_CREATE_FAILED
    );
  }

  const generationIds = Array.from(
    new Set(
      cards
        .filter((card) => card.source !== "manual")
        .map((card) => card.generationId)
        .filter((value): value is number => typeof value === "number")
    )
  );

  await assertGenerationsExist(supabase, userId, generationIds);

  const rowsToInsert = cards.map((card) => ({
    user_id: userId,
    generation_id: card.source === "manual" ? null : (card.generationId ?? null),
    source: card.source,
    front: card.front,
    back: card.back,
  }));

  const { data, error } = await supabase.from("flashcards").insert(rowsToInsert).select("*");

  if (error || !data) {
    throw new FlashcardServiceError(
      ERROR_MESSAGES[ERROR_CODES.FLASHCARD_CREATE_FAILED],
      500,
      ERROR_CODES.FLASHCARD_CREATE_FAILED
    );
  }

  const flashcards = (data as FlashcardRow[]).map(mapFlashcardRowToDto);

  return {
    flashcards,
  };
}

export async function listFlashcards(
  ctx: Pick<APIContext, "locals">,
  query: ListFlashcardsQueryInput | FlashcardListQueryParams
): Promise<ListFlashcardsResponseDto> {
  const supabase = getSupabaseClient(ctx);
  const userId = resolveUserId();

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 10;
  const offset = (page - 1) * pageSize;
  const rangeEnd = offset + pageSize - 1;
  const requestedSort = query.sort ?? "createdAt";
  const sortColumn = SORTABLE_COLUMNS[requestedSort] ?? DEFAULT_SORT_FIELD;
  const orderDirection: "asc" | "desc" = query.order ?? "desc";

  let builder = supabase.from("flashcards").select("*", { count: "exact" }).eq("user_id", userId);

  if (query.source) {
    builder = builder.eq("source", query.source);
  }

  if (query.generationId) {
    builder = builder.eq("generation_id", query.generationId);
  }

  const { data, error, count } = await builder
    .order(sortColumn, { ascending: orderDirection === "asc" })
    .range(offset, rangeEnd);

  if (error || !data) {
    throw new FlashcardServiceError(
      ERROR_MESSAGES[ERROR_CODES.FLASHCARD_LIST_FAILED],
      500,
      ERROR_CODES.FLASHCARD_LIST_FAILED
    );
  }

  const items = (data as FlashcardRow[]).map(mapFlashcardRowToDto);

  return {
    items,
    pagination: {
      page,
      pageSize,
      total: count ?? items.length,
    },
  };
}

export async function getFlashcardById(ctx: Pick<APIContext, "locals">, id: number): Promise<FlashcardDto | null> {
  const supabase = getSupabaseClient(ctx);
  const userId = resolveUserId();

  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error && !isPostgrestNotFoundError(error)) {
    throw new FlashcardServiceError(
      ERROR_MESSAGES[ERROR_CODES.FLASHCARD_FETCH_FAILED],
      500,
      ERROR_CODES.FLASHCARD_FETCH_FAILED
    );
  }

  if (!data) {
    return null;
  }

  return mapFlashcardRowToDto(data as FlashcardRow);
}

export async function updateFlashcard(
  ctx: Pick<APIContext, "locals">,
  id: number,
  command: UpdateFlashcardCommand
): Promise<FlashcardDto | null> {
  const supabase = getSupabaseClient(ctx);
  const userId = resolveUserId();

  const { data: existing, error: fetchError } = await supabase
    .from("flashcards")
    .select("id, source")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (fetchError && !isPostgrestNotFoundError(fetchError)) {
    throw new FlashcardServiceError(
      ERROR_MESSAGES[ERROR_CODES.FLASHCARD_UPDATE_FAILED],
      500,
      ERROR_CODES.FLASHCARD_UPDATE_FAILED
    );
  }

  if (!existing) {
    return null;
  }

  const nextSource = existing.source === "manual" ? existing.source : "ai-edited";

  const { data, error } = await supabase
    .from("flashcards")
    .update({
      front: command.front,
      back: command.back,
      source: nextSource,
    })
    .eq("user_id", userId)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error && !isPostgrestNotFoundError(error)) {
    throw new FlashcardServiceError(
      ERROR_MESSAGES[ERROR_CODES.FLASHCARD_UPDATE_FAILED],
      500,
      ERROR_CODES.FLASHCARD_UPDATE_FAILED
    );
  }

  if (!data) {
    return null;
  }

  return mapFlashcardRowToDto(data as FlashcardRow);
}

export async function deleteFlashcard(ctx: Pick<APIContext, "locals">, id: number): Promise<boolean> {
  const supabase = getSupabaseClient(ctx);
  const userId = resolveUserId();

  const { data, error } = await supabase.from("flashcards").delete().eq("user_id", userId).eq("id", id).select("id");

  if (error) {
    throw new FlashcardServiceError(
      ERROR_MESSAGES[ERROR_CODES.FLASHCARD_DELETE_FAILED],
      500,
      ERROR_CODES.FLASHCARD_DELETE_FAILED
    );
  }

  return Array.isArray(data) && data.length > 0;
}
