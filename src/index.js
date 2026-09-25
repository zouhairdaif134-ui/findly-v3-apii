import {
  getBots,
  createBot,
  updateBot,
  deleteBot
} from "./routes/bots.js";
import { getCategories } from "./routes/categories.js";
import { getMenus } from "./routes/menus.js";
import { getContent } from "./routes/content.js";
import { getUsers } from "./routes/users.js";
import { getFavorites } from "./routes/favorites.js";
import { getNotifications } from "./routes/notifications.js";
import { getAnalytics } from "./routes/analytics.js";
import { getSettings } from "./routes/settings.js";
import { authorizeRequest } from "./lib/auth.js";
import { success, failure } from "./lib/response.js";

const PERMISSIONS = {
  bots: "bots.view",
  categories: "categories.view",
  menus: "menus.view",
  content: "content.view",
  users: "users.view",
  favorites: "users.view",
  notifications: "notifications.manage",
  analytics: "analytics.view",
  settings: "settings.manage"
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "Authorization, Content-Type",
    "Access-Control-Allow-Methods":
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  };
}

function withCors(response) {
  const headers =
    new Headers(response.headers);

  const cors =
    corsHeaders();

  Object.entries(cors).forEach(
    ([key, value]) => {
      headers.set(key, value);
    }
  );

  return new Response(
    response.body,
    {
      status:
        response.status,
      statusText:
        response.statusText,
      headers
    }
  );
}

async function requirePermission(
  env,
  request,
  permission
) {
  return authorizeRequest(
    env,
    request,
    permission
  );
}

export default {
  async fetch(
    request,
    env
  ) {
    const url =
      new URL(request.url);

    try {
      if (
        request.method ===
        "OPTIONS"
      ) {
        return withCors(
          new Response(null, {
            status: 204
          })
        );
      }

      if (
        url.pathname ===
          "/health" &&
        request.method ===
          "GET"
      ) {
        return withCors(
          success({
            service:
              "findly-v3-api",
            version:
              "3.0.0",
            status:
              "healthy"
          })
        );
      }

      if (
        url.pathname ===
          "/api/bots" &&
        request.method ===
          "GET"
      ) {
        const auth =
          await requirePermission(
            env,
            request,
            PERMISSIONS.bots
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        const data =
          await getBots(env);

        return withCors(
          success(data)
        );
      }

      if (
        url.pathname ===
          "/api/categories" &&
        request.method ===
          "GET"
      ) {
        const auth =
          await requirePermission(
            env,
            request,
            PERMISSIONS.categories
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        const data =
          await getCategories(
            env
          );

        return withCors(
          success(data)
        );
      }

      if (
        url.pathname ===
          "/api/menus" &&
        request.method ===
          "GET"
      ) {
        const auth =
          await requirePermission(
            env,
            request,
            PERMISSIONS.menus
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        const botSlug =
          url.searchParams.get(
            "bot"
          );

        const data =
          await getMenus(
            env,
            botSlug
          );

        return withCors(
          success(data)
        );
      }

      if (
        url.pathname ===
          "/api/content" &&
        request.method ===
          "GET"
      ) {
        const auth =
          await requirePermission(
            env,
            request,
            PERMISSIONS.content
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        const botSlug =
          url.searchParams.get(
            "bot"
          );

        const categorySlug =
          url.searchParams.get(
            "category"
          );

        const data =
          await getContent(
            env,
            botSlug,
            categorySlug
          );

        return withCors(
          success(data)
        );
      }

      if (
        url.pathname ===
          "/api/users" &&
        request.method ===
          "GET"
      ) {
        const auth =
          await requirePermission(
            env,
            request,
            PERMISSIONS.users
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        const botId =
          url.searchParams.get(
            "bot_id"
          );

        const data =
          await getUsers(
            env,
            botId
          );

        return withCors(
          success(data)
        );
      }

      if (
        url.pathname ===
          "/api/favorites" &&
        request.method ===
          "GET"
      ) {
        const auth =
          await requirePermission(
            env,
            request,
            PERMISSIONS.favorites
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        const userId =
          url.searchParams.get(
            "user_id"
          );

        const data =
          await getFavorites(
            env,
            userId
          );

        return withCors(
          success(data)
        );
      }

      if (
        url.pathname ===
          "/api/notifications" &&
        request.method ===
          "GET"
      ) {
        const auth =
          await requirePermission(
            env,
            request,
            PERMISSIONS.notifications
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        const userId =
          url.searchParams.get(
            "user_id"
          );

        const botId =
          url.searchParams.get(
            "bot_id"
          );

        const data =
          await getNotifications(
            env,
            userId,
            botId
          );

        return withCors(
          success(data)
        );
      }

      if (
        url.pathname ===
          "/api/analytics" &&
        request.method ===
          "GET"
      ) {
        const auth =
          await requirePermission(
            env,
            request,
            PERMISSIONS.analytics
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        const userId =
          url.searchParams.get(
            "user_id"
          );

        const botId =
          url.searchParams.get(
            "bot_id"
          );

        const eventType =
          url.searchParams.get(
            "event_type"
          );

        const data =
          await getAnalytics(
            env,
            userId,
            botId,
            eventType
          );

        return withCors(
          success(data)
        );
      }

      if (
        url.pathname ===
          "/api/settings" &&
        request.method ===
          "GET"
      ) {
        const auth =
          await requirePermission(
            env,
            request,
            PERMISSIONS.settings
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        const botId =
          url.searchParams.get(
            "bot_id"
          );

        const data =
          await getSettings(
            env,
            botId
          );

        return withCors(
          success(data)
        );
      }

      return withCors(
        failure(
          "NOT_FOUND",
          "Endpoint not found",
          404
        )
      );
    } catch (error) {
      console.error(error);

      return withCors(
        failure(
          "API_ERROR",
          error.message ||
            "Internal server error",
          500
        )
      );
    }
  }
};
