import type { APIContext } from 'astro'
import { ZodError } from 'zod'

import {
  FlashcardIdParamSchema,
  PutFlashcardBodySchema,
} from '../../../lib/schemas/flashcards'
import {
  deleteFlashcard,
  FlashcardServiceError,
  getFlashcardById,
  updateFlashcard,
} from '../../../lib/services/flashcards.service'

export const prerender = false

type ErrorResponseBody = {
  message: string
  code?: string
  issues?: unknown
}

function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

function handleError(error: unknown): Response {
  if (error instanceof FlashcardServiceError) {
    return jsonResponse<ErrorResponseBody>(
      {
        message: error.message,
        code: error.code,
      },
      error.status,
    )
  }

  console.error('Nieoczekiwany błąd w /api/flashcards/[id]', error)

  return jsonResponse<ErrorResponseBody>(
    {
      message: 'Wystąpił nieoczekiwany błąd serwera.',
    },
    500,
  )
}

function parseId(context: APIContext): number {
  const parsed = FlashcardIdParamSchema.safeParse({
    id: context.params?.id,
  })

  if (!parsed.success) {
    throw new ZodError(parsed.error.issues)
  }

  return parsed.data.id
}

export async function GET(context: APIContext): Promise<Response> {
  try {
    const id = parseId(context)
    const flashcard = await getFlashcardById(context, id)

    if (!flashcard) {
      return jsonResponse<ErrorResponseBody>(
        {
          message: 'Nie znaleziono fiszki o podanym identyfikatorze.',
        },
        404,
      )
    }

    return jsonResponse(flashcard)
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonResponse<ErrorResponseBody>(
        {
          message: 'Parametr id nie przeszedł walidacji.',
          issues: error.flatten(),
        },
        400,
      )
    }

    return handleError(error)
  }
}

export async function PUT(context: APIContext): Promise<Response> {
  let rawBody: unknown

  try {
    rawBody = await context.request.json()
  } catch {
    return jsonResponse<ErrorResponseBody>(
      {
        message: 'Nieprawidłowy format JSON w body żądania.',
      },
      400,
    )
  }

  try {
    const id = parseId(context)
    const payload = PutFlashcardBodySchema.parse(rawBody)
    const flashcard = await updateFlashcard(context, id, payload)

    if (!flashcard) {
      return jsonResponse<ErrorResponseBody>(
        {
          message: 'Nie znaleziono fiszki o podanym identyfikatorze.',
        },
        404,
      )
    }

    return jsonResponse(flashcard)
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonResponse<ErrorResponseBody>(
        {
          message: 'Body żądania nie przeszło walidacji.',
          issues: error.flatten(),
        },
        400,
      )
    }

    return handleError(error)
  }
}

export async function DELETE(context: APIContext): Promise<Response> {
  try {
    const id = parseId(context)
    const deleted = await deleteFlashcard(context, id)

    if (!deleted) {
      return jsonResponse<ErrorResponseBody>(
        {
          message: 'Nie znaleziono fiszki o podanym identyfikatorze.',
        },
        404,
      )
    }

    return jsonResponse({ success: true })
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonResponse<ErrorResponseBody>(
        {
          message: 'Parametr id nie przeszedł walidacji.',
          issues: error.flatten(),
        },
        400,
      )
    }

    return handleError(error)
  }
}


