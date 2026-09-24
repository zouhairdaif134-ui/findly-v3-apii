import { getBots } from "./routes/bots.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      // Health check
      if (url.pathname === "/health") {
        return Response.json({
          success: true,
          data: {
            service: "findly-v3-api",
            version: "3.0.0",
            status: "healthy"
          },
          error: null
        });
      }

      // Get all bots
      if (url.pathname === "/api/bots" && request.method === "GET") {
        const data = await getBots(env);

        return Response.json({
          success: true,
          data,
          error: null
        });
      }

      return Response.json(
        {
          success: false,
          data: null,
          error: {
            code: "NOT_FOUND",
            message: "Endpoint not found"
          }
        },
        { status: 404 }
      );

    } catch (error) {
      return Response.json(
        {
          success: false,
          data: null,
          error: {
            code: "API_ERROR",
            message: error.message
          }
        },
        { status: 500 }
      );
    }
  }
};
