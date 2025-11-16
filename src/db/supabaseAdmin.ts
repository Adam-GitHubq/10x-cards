import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Brak wartości SUPABASE_URL w zmiennych środowiskowych");
}

if (!supabaseServiceRoleKey) {
  throw new Error("Brak wartości SUPABASE_SERVICE_ROLE_KEY w zmiennych środowiskowych");
}

/**
 * Klient administracyjny Supabase z uprawnieniami service role.
 * UWAGA: Używać WYŁĄCZNIE po stronie serwera dla operacji wymagających uprawnień administracyjnych
 * (np. usuwanie użytkowników). NIGDY nie eksponować tego klienta w kodzie klienta.
 */
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
