import type { APIContext } from 'astro'
import { ZodError } from 'zod'

import {
  ListGenerationsQuerySchema,
  PostGenerationBodySchema,
} from '../../../lib/schemas/generations'
import {
  createGeneration,
  GenerationServiceError,
  listGenerations,
} from '../../../lib/services/generations.service'

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
  if (error instanceof GenerationServiceError) {
    return jsonResponse<ErrorResponseBody>(
      {
        message: error.message,
        code: error.code,
      },
      error.status,
    )
  }

  console.error('Nieoczekiwany błąd w /api/generations', error)

  return jsonResponse<ErrorResponseBody>(
    {
      message: 'Wystąpił nieoczekiwany błąd serwera.',
    },
    500,
  )
}

export async function POST(context: APIContext): Promise<Response> {
  let body: unknown

  try {
    body = await context.request.json()
  } catch {
    return jsonResponse<ErrorResponseBody>(
      {
        message: 'Nieprawidłowy format JSON w body żądania.',
      },
      400,
    )
  }

  try {
    const payload = PostGenerationBodySchema.parse(body)
    const result = await createGeneration(context, payload)

    return jsonResponse(result, 201)
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

export async function GET(context: APIContext): Promise<Response> {
  const url = new URL(context.request.url)
  const rawQuery = Object.fromEntries(url.searchParams.entries())

  try {
    const query = ListGenerationsQuerySchema.parse(rawQuery)
    const result = await listGenerations(context, query)

    return jsonResponse(result)
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonResponse<ErrorResponseBody>(
        {
          message: 'Parametry zapytania nie przeszły walidacji.',
          issues: error.flatten(),
        },
        400,
      )
    }

    return handleError(error)
  }
}

