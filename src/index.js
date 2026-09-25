import {
  getBots,
  createBot,
  updateBot,
  deleteBot
} from "./routes/bots.js";

import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from "./routes/categories.js";

import {
  getMenus,
  createMenu,
  updateMenu,
  deleteMenu
} from "./routes/menus.js";

import {
  getContent,
  createContent,
  updateContent,
  deleteContent
} from "./routes/content.js";

import {
  getUsers,
  updateUser
} from "./routes/users.js";

import { getFavorites } from "./routes/favorites.js";
import { getNotifications } from "./routes/notifications.js";
import { getAnalytics } from "./routes/analytics.js";
import { getSettings } from "./routes/settings.js";

import { authorizeRequest } from "./lib/auth.js";
import {
  success,
  failure
} from "./lib/response.js";

const PERMISSIONS = {
  botsView: "bots.view",
  categoriesView: "categories.view",
  categoriesCreate: "categories.create",
  categoriesUpdate: "categories.update",
  categoriesDelete: "categories.delete",
  menusView: "menus.view",
  menusManage: "menus.manage",
  contentView: "content.view",
  contentCreate: "content.create",
  contentUpdate: "content.update",
  contentDelete: "content.delete",
  usersView: "users.view",
  usersManage: "users.manage",
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

  Object.entries(corsHeaders()).forEach(
    ([key, value]) => {
      headers.set(key, value);
    }
  );

  return new Response(
    response.body,
    {
      status: response.status,
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

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new Error(
      "Request body must contain valid JSON"
    );
  }
}

function getId(url) {
  const parts =
    url.pathname
      .split("/")
      .filter(Boolean);

  return parts[2] || null;
}

export default {
  async fetch(request, env) {
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

      /*
       * =========================
       * BOTS
       * =========================
       */

      if (
        url.pathname ===
          "/api/bots" &&
        request.method ===
          "POST"
      ) {
        const auth =
          await requirePermission(
            env,
            request,
            "bots.create"
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        const data =
          await createBot(
            env,
            await readJson(request)
          );

        return withCors(
          success(data)
        );
      }

      if (
        url.pathname.startsWith(
          "/api/bots/"
        ) &&
        request.method ===
          "PUT"
      ) {
        const auth =
          await requirePermission(
            env,
            request,
            "bots.update"
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        const data =
          await updateBot(
            env,
            getId(url),
            await readJson(request)
          );

        return withCors(
          success(data)
        );
      }

      if (
        url.pathname.startsWith(
          "/api/bots/"
        ) &&
        request.method ===
          "DELETE"
      ) {
        const auth =
          await requirePermission(
            env,
            request,
            "bots.delete"
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        const data =
          await deleteBot(
            env,
            getId(url)
          );

        return withCors(
          success(data)
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
            PERMISSIONS.botsView
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        return withCors(
          success(
            await getBots(env)
          )
        );
      }

      /*
       * =========================
       * CATEGORIES
       * =========================
       */

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
            PERMISSIONS.categoriesView
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        return withCors(
          success(
            await getCategories(env)
          )
        );
      }

      if (
        url.pathname ===
          "/api/categories" &&
        request.method ===
          "POST"
      ) {
        const auth =
          await requirePermission(
            env,
            request,
            PERMISSIONS.categoriesCreate
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        return withCors(
          success(
            await createCategory(
              env,
              await readJson(request)
            )
          )
        );
      }

      if (
        url.pathname.startsWith(
          "/api/categories/"
        ) &&
        request.method ===
          "PUT"
      ) {
        const auth =
          await requirePermission(
            env,
            request,
            PERMISSIONS.categoriesUpdate
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        return withCors(
          success(
            await updateCategory(
              env,
              getId(url),
              await readJson(request)
            )
          )
        );
      }

      if (
        url.pathname.startsWith(
          "/api/categories/"
        ) &&
        request.method ===
          "DELETE"
      ) {
        const auth =
          await requirePermission(
            env,
            request,
            PERMISSIONS.categoriesDelete
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        return withCors(
          success(
            await deleteCategory(
              env,
              getId(url)
            )
          )
        );
      }

      /*
       * =========================
       * MENUS
       * =========================
       */

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
            PERMISSIONS.menusView
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        return withCors(
          success(
            await getMenus(
              env,
              url.searchParams.get(
                "bot"
              )
            )
          )
        );
      }

      if (
        url.pathname ===
          "/api/menus" &&
        request.method ===
          "POST"
      ) {
        const auth =
          await requirePermission(
            env,
            request,
            PERMISSIONS.menusManage
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        return withCors(
          success(
            await createMenu(
              env,
              await readJson(request)
            )
          )
        );
      }

      if (
        url.pathname.startsWith(
          "/api/menus/"
        ) &&
        request.method ===
          "PUT"
      ) {
        const auth =
          await requirePermission(
            env,
            request,
            PERMISSIONS.menusManage
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        return withCors(
          success(
            await updateMenu(
              env,
              getId(url),
              await readJson(request)
            )
          )
        );
      }

      if (
        url.pathname.startsWith(
          "/api/menus/"
        ) &&
        request.method ===
          "DELETE"
      ) {
        const auth =
          await requirePermission(
            env,
            request,
            PERMISSIONS.menusManage
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        return withCors(
          success(
            await deleteMenu(
              env,
              getId(url)
            )
          )
        );
      }

      /*
       * =========================
       * CONTENT
       * =========================
       */

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
            PERMISSIONS.contentView
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        return withCors(
          success(
            await getContent(
              env,
              url.searchParams.get(
                "bot"
              ),
              url.searchParams.get(
                "category"
              )
            )
          )
        );
      }

      if (
        url.pathname ===
          "/api/content" &&
        request.method ===
          "POST"
      ) {
        const auth =
          await requirePermission(
            env,
            request,
            PERMISSIONS.contentCreate
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        return withCors(
          success(
            await createContent(
              env,
              await readJson(request)
            )
          )
        );
      }

      if (
        url.pathname.startsWith(
          "/api/content/"
        ) &&
        request.method ===
          "PUT"
      ) {
        const auth =
          await requirePermission(
            env,
            request,
            PERMISSIONS.contentUpdate
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        return withCors(
          success(
            await updateContent(
              env,
              getId(url),
              await readJson(request)
            )
          )
        );
      }

      if (
        url.pathname.startsWith(
          "/api/content/"
        ) &&
        request.method ===
          "DELETE"
      ) {
        const auth =
          await requirePermission(
            env,
            request,
            PERMISSIONS.contentDelete
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        return withCors(
          success(
            await deleteContent(
              env,
              getId(url)
            )
          )
        );
      }

      /*
       * =========================
       * USERS
       * =========================
       */

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
            PERMISSIONS.usersView
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        return withCors(
          success(
            await getUsers(
              env,
              url.searchParams.get(
                "bot_id"
              )
            )
          )
        );
      }

      if (
        url.pathname.startsWith(
          "/api/users/"
        ) &&
        request.method ===
          "PUT"
      ) {
        const auth =
          await requirePermission(
            env,
            request,
            PERMISSIONS.usersManage
          );

        if (auth.response) {
          return withCors(
            auth.response
          );
        }

        return withCors(
          success(
            await updateUser(
              env,
              getId(url),
              await readJson(request)
            )
          )
        );
      }

      /*
       * =========================
       * EXISTING MODULES
       * =========================
       */

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

        return withCors(
          success(
            await getFavorites(
              env,
              url.searchParams.get(
                "user_id"
              )
            )
          )
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

        return withCors(
          success(
            await getNotifications(
              env,
              url.searchParams.get(
                "user_id"
              ),
              url.searchParams.get(
                "bot_id"
              )
            )
          )
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

        return withCors(
          success(
            await getAnalytics(
              env,
              url.searchParams.get(
                "user_id"
              ),
              url.searchParams.get(
                "bot_id"
              ),
              url.searchParams.get(
                "event_type"
              )
            )
          )
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

        return withCors(
          success(
            await getSettings(
              env,
              url.searchParams.get(
                "bot_id"
              )
            )
          )
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
