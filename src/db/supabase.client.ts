import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

if (!supabaseUrl) {
  throw new Error("Brak wartości SUPABASE_URL w zmiennych środowiskowych");
}

if (!supabaseAnonKey) {
  throw new Error("Brak wartości SUPABASE_KEY w zmiennych środowiskowych");
}

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
