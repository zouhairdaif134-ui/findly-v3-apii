import { getSupabase } from "../lib/supabase.js";

export async function getUsers(env, botId = null) {
  const supabase = getSupabase(env);

  let query = supabase
    .from("telegram_users")
    .select(
      "uuid, telegram_user_id, username, first_name, last_name, language_code, is_active, first_seen_at, last_seen_at"
    )
    .order("last_seen_at", { ascending: false });

  if (botId) {
    const { data, error } = await supabase
      .from("user_bots")
      .select("user_id")
      .eq("bot_id", botId);

    if (error) {
      throw error;
    }

    const userIds = data.map((item) => item.user_id);

    if (userIds.length === 0) {
      return [];
    }

    query = query.in("uuid", userIds);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}
