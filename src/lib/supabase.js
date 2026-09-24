import { createClient } from "@supabase/supabase-js";

export function getSupabase(env) {
  if (!env.SUPABASE_URL) {
    throw new Error("SUPABASE_URL is missing");
  }

  if (!env.SUPABASE_SECRET_KEY) {
    throw new Error("SUPABASE_SECRET_KEY is missing");
  }

  return createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );
}


