/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types.ts";
import type { UserSafe } from "./types.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user: UserSafe | null;
      runtime: {
        env: {
          SUPABASE_URL: string;
          SUPABASE_KEY: string;
          OPENROUTER_API_KEY: string;
        };
      };
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly SITE_URL: string;
  readonly OPENROUTER_API_KEY: string;
  readonly E2E_USERNAME: string;
  readonly E2E_PASSWORD: string;
  readonly E2E_USERNAME_ID: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
