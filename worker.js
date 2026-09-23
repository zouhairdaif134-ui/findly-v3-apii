export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
        project: "FINDLY V3",
        service: "API"
      });
    }

    if (url.pathname === "/api/test-supabase") {
      try {
        const response = await fetch(
          `${env.SUPABASE_URL}/rest/v1/bots?select=id,name&limit=1`,
          {
            headers: {
              "apikey": env.SUPABASE_SECRET_KEY,
              "Authorization": `Bearer ${env.SUPABASE_SECRET_KEY}`
            }
          }
        );

        const data = await response.json();

        return Response.json({
          status: response.ok ? "ok" : "error",
          supabase_status: response.status,
          data
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

    return Response.json(
      {
        status: "error",
        message: "Endpoint not found"
      },
      { status: 404 }
    );
  }
};
