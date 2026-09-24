import { getSupabase } from "../lib/supabase.js";

export async function getSettings(env, botId = null) {
  const supabase = getSupabase(env);

  let query = supabase
    .from("bot_settings")
    .select(
      "id, bot_id, setting_key, setting_value, updated_at"
    )
    .order("setting_key", { ascending: true });

  if (botId) {
    query = query.eq("bot_id", botId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}
