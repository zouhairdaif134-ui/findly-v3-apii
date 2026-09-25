import { getSupabase } from "../lib/supabase.js";

const FIELDS =
  "id, bot_id, category_id, content_type, title, description, image_url, external_url, metadata, is_active, published_at, created_at, updated_at";

function cleanText(value) {
  return typeof value === "string"
    ? value.trim()
    : value;
}

function normalizeContent(body = {}) {
  const item = {
    bot_id: body.bot_id,
    category_id:
      body.category_id || null,
    content_type:
      cleanText(body.content_type) ||
      "general",
    title: cleanText(body.title),
    description:
      cleanText(body.description) ||
      null,
    image_url:
      cleanText(body.image_url) ||
      null,
    external_url:
      cleanText(body.external_url) ||
      null,
    metadata:
      body.metadata &&
      typeof body.metadata === "object"
        ? body.metadata
        : {},
    is_active:
      typeof body.is_active === "boolean"
        ? body.is_active
        : true,
    published_at:
      body.published_at || null
  };

  if (!item.bot_id) {
    throw new Error("bot_id is required");
  }

  if (!item.title) {
    throw new Error("Content title is required");
  }

  return item;
}

export async function getContent(
  env,
  botSlug = null,
  categorySlug = null
) {
  const supabase = getSupabase(env);

  let query = supabase
    .from("content_items")
    .select(FIELDS)
    .order("published_at", {
      ascending: false,
      nullsFirst: false
    })
    .order("created_at", {
      ascending: false
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

  if (categorySlug) {
    const { data: category, error } =
      await supabase
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .single();

    if (error) {
      throw error;
    }

    query = query.eq(
      "category_id",
      category.id
    );
  }

  const { data, error } =
    await query;

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createContent(
  env,
  body
) {
  const supabase = getSupabase(env);

  const item =
    normalizeContent(body);

  const { data, error } =
    await supabase
      .from("content_items")
      .insert(item)
      .select(FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateContent(
  env,
  id,
  body
) {
  const supabase = getSupabase(env);

  if (!id) {
    throw new Error(
      "Content id is required"
    );
  }

  const allowed = [
    "bot_id",
    "category_id",
    "content_type",
    "title",
    "description",
    "image_url",
    "external_url",
    "metadata",
    "is_active",
    "published_at"
  ];

  const updates = {};

  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }

  if (
    updates.title !== undefined
  ) {
    updates.title =
      cleanText(updates.title);

    if (!updates.title) {
      throw new Error(
        "Content title cannot be empty"
      );
    }
  }

  for (const key of [
    "description",
    "image_url",
    "external_url"
  ]) {
    if (updates[key] !== undefined) {
      updates[key] =
        cleanText(updates[key]) ||
        null;
    }
  }

  if (
    updates.content_type !==
    undefined
  ) {
    updates.content_type =
      cleanText(
        updates.content_type
      ) || "general";
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
      .from("content_items")
      .update(updates)
      .eq("id", id)
      .select(FIELDS)
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteContent(
  env,
  id
) {
  return updateContent(
    env,
    id,
    {
      is_active: false
    }
  );
}
