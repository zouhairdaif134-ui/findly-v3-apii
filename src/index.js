import { getBots } from "./routes/bots.js";
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
