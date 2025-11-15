import type { APIContext } from "astro";
import { ZodError } from "zod";

import { ListFlashcardsQuerySchema, PostFlashcardsBodySchema } from "../../../lib/schemas/flashcards";
import { createFlashcards, FlashcardServiceError, listFlashcards } from "../../../lib/services/flashcards.service";

export const prerender = false;

type ErrorResponseBody = {
  message: string;
  code?: string;
  issues?: unknown;
};

function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function handleError(error: unknown): Response {
  if (error instanceof FlashcardServiceError) {
    return jsonResponse<ErrorResponseBody>(
      {
        message: error.message,
        code: error.code,
      },
      error.status
    );
  }

  return jsonResponse<ErrorResponseBody>(
    {
      message: "Wystąpił nieoczekiwany błąd serwera.",
    },
    500
  );
}

export async function POST(context: APIContext): Promise<Response> {
  let rawBody: unknown;

  try {
    rawBody = await context.request.json();
  } catch {
    return jsonResponse<ErrorResponseBody>(
      {
        message: "Nieprawidłowy format JSON w body żądania.",
      },
      400
    );
  }

  try {
    const payload = PostFlashcardsBodySchema.parse(rawBody);
    const result = await createFlashcards(context, payload);

    return jsonResponse(result, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonResponse<ErrorResponseBody>(
        {
          message: "Body żądania nie przeszło walidacji.",
          issues: error.flatten(),
        },
        400
      );
    }

    return handleError(error);
  }
}

export async function GET(context: APIContext): Promise<Response> {
  const url = new URL(context.request.url);
  const rawQuery = Object.fromEntries(url.searchParams.entries());

  try {
    const query = ListFlashcardsQuerySchema.parse(rawQuery);
    const result = await listFlashcards(context, query);

    return jsonResponse(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonResponse<ErrorResponseBody>(
        {
          message: "Parametry zapytania nie przeszły walidacji.",
          issues: error.flatten(),
        },
        400
      );
    }

    return handleError(error);
  }
}
