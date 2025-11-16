import type { APIRoute } from "astro";

import { resetCompleteSchema } from "../../../../lib/validation/authSchemas.ts";
import { mapResetCompleteError } from "../../../../lib/auth/errorMapper.ts";
import type { AuthOk, ProblemJson } from "../../../../types.ts";

export const prerender = false;

/**
 * POST /api/auth/reset/complete
 *
 * Ustawia nowe hasło użytkownika.
 * Wymaga aktywnej sesji z linku resetującego hasło.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Walidacja danych wejściowych
    const body = await request.json();
    const validationResult = resetCompleteSchema.safeParse(body);

    if (!validationResult.success) {
      const response: ProblemJson = {
        success: false,
        errorCode: "invalid_input",
        message: "Nieprawidłowe dane wejściowe.",
        details: validationResult.error.flatten().fieldErrors,
      };

      return new Response(JSON.stringify(response), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { newPassword } = validationResult.data;

    // Sprawdzenie, czy użytkownik ma aktywną sesję
    const {
      data: { user },
      error: sessionError,
    } = await locals.supabase.auth.getUser();

    if (sessionError || !user) {
      const response: ProblemJson = {
        success: false,
        errorCode: "invalid_credentials",
        message: "Brak aktywnej sesji. Link resetujący hasło mógł wygasnąć.",
      };

      return new Response(JSON.stringify(response), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Aktualizacja hasła
    const { error } = await locals.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      const { errorCode, message } = mapResetCompleteError(error);
      const response: ProblemJson = {
        success: false,
        errorCode,
        message,
      };

      return new Response(JSON.stringify(response), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Sukces
    const response: AuthOk<{ message: string }> = {
      success: true,
      data: {
        message: "Hasło zostało zmienione pomyślnie.",
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Obsługa nieoczekiwanych błędów
    // eslint-disable-next-line no-console
    console.error("[Auth Reset Complete] Unexpected error:", error);

    const response: ProblemJson = {
      success: false,
      errorCode: "unknown",
      message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
