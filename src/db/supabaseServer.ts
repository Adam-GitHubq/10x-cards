import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";

import type { Database } from "./database.types.ts";

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Tworzy instancję Supabase Server Client dla SSR.
 * WAŻNE: Tworzony PER-REQUEST, aby zapewnić izolację sesji między użytkownikami.
 *
 * @param context - Kontekst zawierający headers i cookies z żądania/odpowiedzi Astro
 * @param env - Zmienne środowiskowe (opcjonalne, domyślnie z import.meta.env)
 * @returns Instancja Supabase client z integracją cookies SSR
 */
export const createSupabaseServerInstance = (
  context: { headers: Headers; cookies: AstroCookies },
  env?: { SUPABASE_URL: string; SUPABASE_KEY: string }
) => {
  // Use provided env or fallback to import.meta.env (for local development)
  const supabaseUrl = env?.SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const supabaseKey = env?.SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};
