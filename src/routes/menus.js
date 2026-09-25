import { getSupabase } from "../lib/supabase.js";

const FIELDS =
  "id, bot_id, parent_id, label, icon, action_type, action_value, is_active, sort_order, settings, created_at, updated_at";

function cleanText(value) {
  return typeof value === "string"
    ? value.trim()
    : value;
}

function normalizeMenu(body = {}) {
  const item = {
    bot_id: body.bot_id,
    parent_id:
      body.parent_id || null,
    label: cleanText(body.label),
    icon:
      cleanText(body.icon) || "🔘",
    action_type:
      cleanText(body.action_type) ||
      "category",
    action_value:
      cleanText(body.action_value) ||
      null,
    is_active:
      typeof body.is_active === "boolean"
        ? body.is_active
        : true,
    sort_order:
      Number.isFinite(Number(body.sort_order))
        ? Number(body.sort_order)
        : 0,
    settings:
      body.settings &&
      typeof body.settings === "object"
        ? body.settings
        : {}
  };

  if (!item.bot_id) {
    throw new Error("bot_id is required");
  }

  if (!item.label) {
    throw new Error("Menu label is required");
  }

  return item;
}

export async function getMenus(
  env,
  botSlug = null
) {
  const supabase = getSupabase(env);

  let query = supabase
    .from("menu_items")
    .select(FIELDS)
    .order("sort_order", {
      ascending: true
    })
    .order("created_at", {
      ascending: true
    });

  if (botSlug) {
    const { data: bot, error } =
      await supabase
        .from("bots")
        .select("id")
        .eq("slug", botSlug)
        .single();

    if (error) {
      throw error;
    }

    query = query.eq(
      "bot_id",
      bot.id
    );
  }

  const { data, error } =
    await query;

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createMenu(
  env,
  body
) {
  const supabase = getSupabase(env);

  const item =
    normalizeMenu(body);

  const { data, error } =
    await supabase
      .from("menu_items")
      .insert(item)
      .select(FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateMenu(
  env,
  id,
  body
) {
  const supabase = getSupabase(env);

  if (!id) {
    throw new Error(
      "Menu id is required"
    );
  }

  const allowed = [
    "bot_id",
    "parent_id",
    "label",
    "icon",
    "action_type",
    "action_value",
    "is_active",
    "sort_order",
    "settings"
  ];

  const updates = {};

  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }

  if (
    updates.label !== undefined
  ) {
    updates.label =
      cleanText(updates.label);

    if (!updates.label) {
      throw new Error(
        "Menu label cannot be empty"
      );
    }
  }

  if (
    updates.icon !== undefined
  ) {
    updates.icon =
      cleanText(updates.icon) ||
      "🔘";
  }

  if (
    updates.action_type !==
    undefined
  ) {
    updates.action_type =
      cleanText(
        updates.action_type
      ) || "category";
  }

  if (
    updates.action_value !==
    undefined
  ) {
    updates.action_value =
      cleanText(
        updates.action_value
      ) || null;
  }

  if (
    updates.sort_order !== undefined
  ) {
    updates.sort_order = Number(
      updates.sort_order
    );

    if (
      !Number.isFinite(
        updates.sort_order
      )
    ) {
      updates.sort_order = 0;
    }
  }

  if (
    Object.keys(updates).length === 0
  ) {
    throw new Error(
      "No fields to update"
    );
  }

  const { data, error } =
    await supabase
      .from("menu_items")
      .update(updates)
      .eq("id", id)
      .select(FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteMenu(
  env,
  id
) {
  return updateMenu(
    env,
    id,
    {
      is_active: false
    }
  );
}
