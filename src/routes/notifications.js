import { getSupabase } from "../lib/supabase.js";

export async function getNotifications(
  env,
  userId = null,
  botId = null
) {
  const supabase = getSupabase(env);

  let query = supabase
    .from("notification_subscriptions")
    .select(
      "id, user_id, bot_id, subscription_type, filters, is_active, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (botId) {
    query = query.eq("bot_id", botId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}
