import type { APIContext } from "astro";
import { ZodError } from "zod";

import { GenerationIdParamSchema } from "../../../lib/schemas/generations";
import { deleteGeneration, GenerationServiceError, getGenerationById } from "../../../lib/services/generations.service";

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
  if (error instanceof GenerationServiceError) {
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

function parseId(context: APIContext): number {
  const rawParams = {
    id: context.params?.id,
  };

  const parsed = GenerationIdParamSchema.safeParse(rawParams);

  if (!parsed.success) {
    const error = new ZodError(parsed.error.issues);
    throw error;
  }

  return parsed.data.id;
}

export async function GET(context: APIContext): Promise<Response> {
  try {
    const id = parseId(context);
    const generation = await getGenerationById(context, id);

    if (!generation) {
      return jsonResponse<ErrorResponseBody>(
        {
          message: "Nie znaleziono generacji o podanym identyfikatorze.",
        },
        404
      );
    }

    return jsonResponse(generation);
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonResponse<ErrorResponseBody>(
        {
          message: "Parametr id nie przeszedł walidacji.",
          issues: error.flatten(),
        },
        400
      );
    }

    return handleError(error);
  }
}

export async function DELETE(context: APIContext): Promise<Response> {
  try {
    const id = parseId(context);
    const deleted = await deleteGeneration(context, id);

    if (!deleted) {
      return jsonResponse<ErrorResponseBody>(
        {
          message: "Nie znaleziono generacji o podanym identyfikatorze.",
        },
        404
      );
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonResponse<ErrorResponseBody>(
        {
          message: "Parametr id nie przeszedł walidacji.",
          issues: error.flatten(),
        },
        400
      );
    }

    return handleError(error);
  }
}
