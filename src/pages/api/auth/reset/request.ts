import type { APIRoute } from "astro";

import { resetRequestSchema } from "../../../../lib/validation/authSchemas.ts";
import type { AuthOk, ProblemJson } from "../../../../types.ts";

export const prerender = false;

/**
 * POST /api/auth/reset/request
 *
 * Wysyła email z linkiem do resetowania hasła.
 * Zawsze zwraca sukces (nie ujawniamy, czy konto istnieje).
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Walidacja danych wejściowych
    const body = await request.json();
    const validationResult = resetRequestSchema.safeParse(body);

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

    const { email } = validationResult.data;

    // Wysłanie emaila z linkiem do resetu hasła
    const { error } = await locals.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/auth/reset/confirm`,
    });

    // Nawet jeśli wystąpił błąd, zwracamy sukces (nie ujawniamy istnienia konta)
    // Logujemy błąd tylko po stronie serwera
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[Auth Reset Request] Supabase error:", error);
    }

    // Zawsze zwracamy sukces z neutralnym komunikatem
    const response: AuthOk<{ message: string }> = {
      success: true,
      data: {
        message: "Jeśli konto istnieje, wysłaliśmy wiadomość z linkiem do ustawienia nowego hasła.",
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Obsługa nieoczekiwanych błędów
    // eslint-disable-next-line no-console
    console.error("[Auth Reset Request] Unexpected error:", error);

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
