export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/" || url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
        project: "FINDLY V3",
        service: "API",
        message: "FINDLY V3 API is running"
      });
    }

    // Supabase connection test
    if (url.pathname === "/api/test-supabase") {
      try {
        // Check required environment variables
        if (!env.SUPABASE_URL) {
          return Response.json(
            {
              status: "error",
              message: "SUPABASE_URL is missing"
            },
            { status: 500 }
          );
        }

        if (!env.SUPABASE_SECRET_KEY) {
          return Response.json(
            {
              status: "error",
              message: "SUPABASE_SECRET_KEY is missing"
            },
            { status: 500 }
          );
        }

        const response = await fetch(
          `${env.SUPABASE_URL}/rest/v1/bots?select=id,name`,
          {
            method: "GET",
            headers: {
              "apikey": env.SUPABASE_SECRET_KEY,
              "Content-Type": "application/json"
            }
          }
        );

        const responseText = await response.text();

        return Response.json({
          status: response.ok ? "ok" : "error",
          supabase_status: response.status,
          response: responseText
        });

      } catch (error) {
        return Response.json(
          {
            status: "error",
            message: error.message
          },
          { status: 500 }
        );
      }
    }

    // Unknown endpoint
    return Response.json(
      {
        status: "error",
        message: "Endpoint not found"
      },
      { status: 404 }
    );
  }
};
