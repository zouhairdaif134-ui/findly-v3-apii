import { getBots } from "./routes/bots.js";
import { getCategories } from "./routes/categories.js";
import { getMenus } from "./routes/menus.js";
import { getContent } from "./routes/content.js";
import { getUsers } from "./routes/users.js";
import { success, failure } from "./lib/response.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      // Health check
      if (url.pathname === "/health" && request.method === "GET") {
        return success({
          service: "findly-v3-api",
          version: "3.0.0",
          status: "healthy"
        });
      }

      // Get all bots
      if (url.pathname === "/api/bots" && request.method === "GET") {
        const data = await getBots(env);

        return success(data);
      }

      // Get all categories
      if (
        url.pathname === "/api/categories" &&
        request.method === "GET"
      ) {
        const data = await getCategories(env);

        return success(data);
      }

      // Get menus
      if (
        url.pathname === "/api/menus" &&
        request.method === "GET"
      ) {
        const botSlug = url.searchParams.get("bot");

        const data = await getMenus(env, botSlug);

        return success(data);
      }

      // Get content
      if (
        url.pathname === "/api/content" &&
        request.method === "GET"
      ) {
        const botSlug = url.searchParams.get("bot");
        const categorySlug = url.searchParams.get("category");

        const data = await getContent(
          env,
          botSlug,
          categorySlug
        );

        return success(data);
      }

      // Get users
      if (
        url.pathname === "/api/users" &&
        request.method === "GET"
      ) {
        const botId = url.searchParams.get("bot_id");

        const data = await getUsers(env, botId);

        return success(data);
      }

      return failure(
        "NOT_FOUND",
        "Endpoint not found",
        404
      );

    } catch (error) {
      console.error(error);

      return failure(
        "API_ERROR",
        error.message || "Internal server error",
        500
      );
    }
  }
};
