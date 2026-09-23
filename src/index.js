export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        status: "ok",
        service: "findly-v3-api",
        version: "3.0.0"
      });
    }

    return Response.json({
      status: "ok",
      message: "Findly V3 API running"
    });
  }
};
