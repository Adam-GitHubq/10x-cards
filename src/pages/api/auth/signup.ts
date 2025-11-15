import type { APIRoute } from "astro";
import { AuthApiError } from "@supabase/supabase-js";

import { signupSchema } from "../../../lib/validation/authSchemas.ts";
import type { AuthErrorCode, AuthOk, ProblemJson, SessionResponse } from "../../../types.ts";

export const prerender = false;

/**
 * Mapuje błędy Supabase Auth na nasze kody błędów.
 */
function mapSupabaseError(error: unknown): { errorCode: AuthErrorCode; message: string } {
  if (error instanceof AuthApiError) {
    // Mapowanie specyficznych błędów Supabase
    if (error.message.includes("User already registered")) {
      return {
        errorCode: "email_in_use",
        message: "Konto z tym adresem e-mail już istnieje.",
      };
    }

    if (error.message.includes("Password should be at least")) {
      return {
        errorCode: "invalid_input",
        message: "Hasło jest zbyt słabe. Użyj co najmniej 8 znaków z literą i cyfrą.",
      };
    }

    if (error.status === 429) {
      return {
        errorCode: "rate_limited",
        message: "Zbyt wiele prób – spróbuj ponownie później.",
      };
    }
  }

  // Domyślny błąd
  return {
    errorCode: "unknown",
    message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
  };
}

/**
 * POST /api/auth/signup
 *
 * Rejestracja nowego użytkownika z użyciem email i hasła.
 *
 * WAŻNE: Zgodnie z PRD (US-001), weryfikacja email jest WYŁĄCZONA w MVP.
 * Po rejestracji użytkownik jest automatycznie zalogowany.
 *
 * Jeśli w przyszłości włączysz weryfikację email w Supabase:
 * - Ustaw emailRedirectTo na SITE_URL/auth/reset/confirm
 * - Zwróć requiresEmailVerification: true w odpowiedzi
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Walidacja danych wejściowych
    const body = await request.json();
    const validationResult = signupSchema.safeParse(body);

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

    // Opcjonalnie: emailRedirectTo dla weryfikacji email (gdy włączona)
    // const emailRedirectTo = `${import.meta.env.SITE_URL}/auth/reset/confirm`;

    // Rejestracja przez Supabase
    const { data, error } = await locals.supabase.auth.signUp({
      email,
      password,
      // options: {
      //   emailRedirectTo, // Odkomentuj gdy weryfikacja email będzie włączona
      // },
    });

    if (error) {
      const { errorCode, message } = mapSupabaseError(error);
      const response: ProblemJson = {
        success: false,
        errorCode,
        message,
      };

      const statusCode =
        errorCode === "email_in_use"
          ? 409
          : errorCode === "invalid_input"
            ? 400
            : errorCode === "rate_limited"
              ? 429
              : 500;

      return new Response(JSON.stringify(response), {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Sprawdź czy wymagana jest weryfikacja email
    // Jeśli user.identities jest puste, oznacza to że email wymaga weryfikacji
    const requiresEmailVerification = !data.user || (data.user.identities && data.user.identities.length === 0);

    if (requiresEmailVerification) {
      // Weryfikacja email włączona - użytkownik musi potwierdzić email
      const response: AuthOk<{ requiresEmailVerification: true }> = {
        success: true,
        data: {
          requiresEmailVerification: true,
        },
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Weryfikacja email wyłączona - użytkownik jest automatycznie zalogowany
    const response: AuthOk<SessionResponse> = {
      success: true,
      data: {
        user: {
          id: data.user!.id,
          email: data.user!.email ?? null,
        },
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Obsługa nieoczekiwanych błędów
    console.error("[Auth Signup] Unexpected error:", error);

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

