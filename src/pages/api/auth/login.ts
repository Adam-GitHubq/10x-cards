import type { APIRoute } from "astro";

import { loginSchema } from "../../../lib/validation/authSchemas.ts";
import { mapLoginError } from "../../../lib/auth/errorMapper.ts";
import type { AuthOk, ProblemJson, SessionResponse } from "../../../types.ts";

export const prerender = false;

/**
 * POST /api/auth/login
 *
 * Logowanie użytkownika z użyciem email i hasła.
 * Po sukcesie ustawia sesję w HTTP-only cookies.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Walidacja danych wejściowych
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

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

    const { email, password } = validationResult.data;

    // Logowanie przez Supabase
    const { data, error } = await locals.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const { errorCode, message } = mapLoginError(error);
      const response: ProblemJson = {
        success: false,
        errorCode,
        message,
      };

      const statusCode = errorCode === "invalid_credentials" || errorCode === "email_not_verified" ? 401 : 500;

      return new Response(JSON.stringify(response), {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Sukces - zwróć dane użytkownika
    const response: AuthOk<SessionResponse> = {
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email ?? null,
        },
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Obsługa nieoczekiwanych błędów
    // eslint-disable-next-line no-console
    console.error("[Auth Login] Unexpected error:", error);

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
