export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
        project: "FINDLY V3",
        service: "API",
        message: "FINDLY V3 API is running"
      });
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
