import { getSupabase } from "../lib/supabase.js";

export async function getFavorites(env, userId = null) {
  const supabase = getSupabase(env);

  let query = supabase
    .from("favorites")
    .select("id, user_id, content_id, created_at")
    .order("created_at", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}
