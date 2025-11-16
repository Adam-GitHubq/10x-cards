import type { APIRoute } from "astro";

export const prerender = false;

/**
 * POST /api/auth/logout
 *
 * Wylogowuje użytkownika poprzez usunięcie cookies sesji.
 * Zwraca 204 No Content przy sukcesie.
 *
 * WAŻNE: W SSR nie potrzebujemy wywoływać Supabase API - wystarczy usunąć lokalne cookies.
 * Supabase automatycznie uzna sesję za nieważną gdy cookies zostaną usunięte.
 */
export const POST: APIRoute = async ({ cookies, request }) => {
  try {
    // Pobierz wszystkie cookies z nagłówka Cookie
    const cookieHeader = request.headers.get("Cookie") || "";
    const cookiePairs = cookieHeader.split(";").map((c) => c.trim());

    // Znajdź wszystkie cookies Supabase (zaczynające się od "sb-")
    const supabaseCookieNames: string[] = [];

    cookiePairs.forEach((pair) => {
      const [name] = pair.split("=");
      if (name && name.startsWith("sb-")) {
        supabaseCookieNames.push(name);
      }
    });

    if (supabaseCookieNames.length === 0) {
      // eslint-disable-next-line no-console
      console.warn("[Auth Logout] No Supabase cookies found - user may already be logged out");
    } else {
      // Usuń każdy cookie Supabase
      supabaseCookieNames.forEach((name) => {
        cookies.delete(name, { path: "/" });
      });

      // eslint-disable-next-line no-console
      console.log(
        `[Auth Logout] Removed ${supabaseCookieNames.length} Supabase cookie(s): ${supabaseCookieNames.join(", ")}`
      );
    }

    // Sukces - zwróć 204 No Content (bez treści)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Auth Logout] Unexpected error:", error);

    // Nawet jeśli wystąpił błąd, zwróć sukces
    // (lepiej wylogować częściowo niż wcale)
    return new Response(null, {
      status: 204,
    });
  }
};
