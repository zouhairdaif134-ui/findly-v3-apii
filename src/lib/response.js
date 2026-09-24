export function success(data = null, meta = {}) {
  return Response.json({
    success: true,
    data,
    error: null,
    meta
  });
}

export function failure(code, message, status = 500, meta = {}) {
  return Response.json(
    {
      success: false,
      data: null,
      error: {
        code,
        message
      },
      meta
    },
    { status }
  );
}
