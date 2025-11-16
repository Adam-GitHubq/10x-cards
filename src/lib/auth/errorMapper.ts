import { AuthApiError } from "@supabase/supabase-js";
import type { AuthErrorCode } from "../../types";

/**
 * Helper do sprawdzania czy błąd jest AuthApiError (wspiera też mocki w testach)
 */
function isAuthApiError(error: unknown): error is AuthApiError & { status?: number } {
  return (
    error instanceof AuthApiError ||
    (typeof error === "object" && error !== null && "name" in error && error.name === "AuthApiError")
  );
}

/**
 * Mapuje błędy Supabase Auth na nasze kody błędów dla endpointu login.
 */
export function mapLoginError(error: unknown): { errorCode: AuthErrorCode; message: string } {
  if (isAuthApiError(error)) {
    // Mapowanie specyficznych błędów Supabase
    if (error.message.includes("Invalid login credentials")) {
      return {
        errorCode: "invalid_credentials",
        message: "Nieprawidłowy e-mail lub hasło.",
      };
    }

    if (error.message.includes("Email not confirmed")) {
      return {
        errorCode: "email_not_verified",
        message: "Adres e-mail nie został zweryfikowany. Sprawdź swoją skrzynkę pocztową.",
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
 * Mapuje błędy Supabase Auth na nasze kody błędów dla endpointu signup.
 */
export function mapSignupError(error: unknown): { errorCode: AuthErrorCode; message: string } {
  if (isAuthApiError(error)) {
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
 * Mapuje błędy Supabase Auth na nasze kody błędów dla endpointu reset request.
 */
export function mapResetRequestError(error: unknown): { errorCode: AuthErrorCode; message: string } {
  if (isAuthApiError(error)) {
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
 * Mapuje błędy Supabase Auth na nasze kody błędów dla endpointu reset complete.
 */
export function mapResetCompleteError(error: unknown): { errorCode: AuthErrorCode; message: string } {
  if (isAuthApiError(error)) {
    if (error.message.includes("Password should be at least")) {
      return {
        errorCode: "invalid_input",
        message: "Hasło jest zbyt słabe. Użyj co najmniej 8 znaków z literą i cyfrą.",
      };
    }

    if (error.message.includes("New password should be different")) {
      return {
        errorCode: "invalid_input",
        message: "Nowe hasło musi być inne niż poprzednie.",
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
