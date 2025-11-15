import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabaseServer.ts";

// Ścieżki publiczne - dostępne bez logowania
const PUBLIC_PATHS = [
  // Strony auth
  "/auth/login",
  "/auth/register",
  "/auth/reset",
  "/auth/reset/confirm",
  // API auth endpoints
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
  "/api/auth/reset/request",
  "/api/auth/reset/complete",
  "/api/auth/session",
  // Inne publiczne ścieżki
  "/",
];

// Ścieżki chronione - wymagają zalogowania
const PROTECTED_PATHS = ["/generate", "/flashcards", "/settings"];

/**
 * Sprawdza czy ścieżka jest chroniona.
 */
function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"));
}

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Utwórz Supabase Server Client per-request (izolacja sesji)
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // WAŻNE: Zawsze pobierz użytkownika przed innymi operacjami
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Ustaw użytkownika i klienta w locals dla dostępu w endpointach i stronach
  locals.supabase = supabase;
  locals.user = user
    ? {
        id: user.id,
        email: user.email ?? null,
      }
    : null;

  // Logika przekierowań:
  // 1. Zalogowany użytkownik próbuje wejść na stronę auth → przekieruj do /generate
  if (user && url.pathname.startsWith("/auth/")) {
    return redirect("/generate");
  }

  // 2. Niezalogowany użytkownik próbuje wejść na chronioną stronę → przekieruj do /auth/login
  if (!user && isProtectedPath(url.pathname)) {
    const nextParam = url.pathname !== "/generate" ? `?next=${encodeURIComponent(url.pathname)}` : "";
    return redirect(`/auth/login${nextParam}`);
  }

  return next();
});
