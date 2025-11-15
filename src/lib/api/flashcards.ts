import type {
  CreateFlashcardsCommand,
  CreateFlashcardsResponseDto,
  FlashcardDto,
  FlashcardListQueryParams,
  ListFlashcardsResponseDto,
  UpdateFlashcardCommand,
} from "@/types";
import { HttpError, isHttpError } from "@/lib/http";

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

const DEFAULT_ERROR_MESSAGE = "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.";

export async function listFlashcards(
  params: FlashcardListQueryParams = {}
): Promise<ListFlashcardsResponseDto> {
  const queryString = buildQueryString(params);

  return callApi<ListFlashcardsResponseDto>(`/api/flashcards${queryString}`);
}

export async function getFlashcard(id: number): Promise<FlashcardDto> {
  return callApi<FlashcardDto>(`/api/flashcards/${id}`);
}

export async function createFlashcards(
  payload: CreateFlashcardsCommand
): Promise<CreateFlashcardsResponseDto> {
  return callApi<CreateFlashcardsResponseDto>("/api/flashcards", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function updateFlashcard(
  id: number,
  payload: UpdateFlashcardCommand
): Promise<FlashcardDto> {
  return callApi<FlashcardDto>(`/api/flashcards/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteFlashcard(id: number): Promise<void> {
  await callApi<void>(`/api/flashcards/${id}`, {
    method: "DELETE",
  });
}

function buildQueryString(params: FlashcardListQueryParams): string {
  const searchParams = new URLSearchParams();

  if (typeof params.page === "number") {
    searchParams.set("page", String(params.page));
  }

  if (typeof params.pageSize === "number") {
    searchParams.set("pageSize", String(params.pageSize));
  }

  if (typeof params.sort === "string") {
    searchParams.set("sort", params.sort);
  }

  if (typeof params.order === "string") {
    searchParams.set("order", params.order);
  }

  if (typeof params.source === "string") {
    searchParams.set("source", params.source);
  }

  if (typeof params.generationId === "number") {
    searchParams.set("generationId", String(params.generationId));
  }

  const query = searchParams.toString();

  if (!query) {
    return "";
  }

  return `?${query}`;
}

async function callApi<T>(input: string, init: RequestInit = {}): Promise<T> {
  try {
    return await requestJson<T>(input, init);
  } catch (error) {
    throw ensureApiError(error);
  }
}

async function requestJson<T>(input: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(input, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
    ...init,
  });

  const rawBody = await response.text();
  let parsedBody: unknown = null;

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      parsedBody = rawBody;
    }
  }

  if (!response.ok) {
    const message = extractErrorMessage(parsedBody) ?? undefined;

    throw new HttpError(response.status, parsedBody, message);
  }

  if (parsedBody === null || parsedBody === "") {
    return undefined as T;
  }

  return parsedBody as T;
}

function extractErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const maybeMessage = (body as { message?: unknown }).message;

  if (typeof maybeMessage === "string" && maybeMessage.trim().length > 0) {
    return maybeMessage;
  }

  return null;
}

export function isApiError(error: unknown): error is ApiError {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as Record<string, unknown>;

  return (
    typeof candidate.status === "number" &&
    typeof candidate.message === "string"
  );
}

export function ensureApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (isHttpError(error)) {
    const message = extractErrorMessage(error.body) ?? error.message ?? DEFAULT_ERROR_MESSAGE;

    return {
      status: error.status,
      message,
      details: error.body,
    };
  }

  if (error instanceof Error) {
    return {
      status: 0,
      message: error.message || DEFAULT_ERROR_MESSAGE,
      details: error,
    };
  }

  return {
    status: 0,
    message: DEFAULT_ERROR_MESSAGE,
    details: error,
  };
}
