const clients = new Map();

export function interactionRateLimit(request, response, next) {
  const now = Date.now();
  const key = request.ip || "unknown";
  const windowMs = 60_000;
  const maxRequests = 12;
  const record = clients.get(key);
  if (!record || now - record.startedAt >= windowMs) {
    clients.set(key, { count: 1, startedAt: now });
    return next();
  }
  if (record.count >= maxRequests) {
    response.set(
      "Retry-After",
      String(Math.ceil((record.startedAt + windowMs - now) / 1000)),
    );
    return response.status(429).json({
      message: "Demasiadas solicitudes. Intenta nuevamente en un momento",
      requestId: request.id,
    });
  }
  record.count += 1;
  return next();
}
