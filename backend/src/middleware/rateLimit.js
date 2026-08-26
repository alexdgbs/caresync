const clients = new Map();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;
const MAX_CLIENTS = 10_000;

const pruneExpired = (now) => {
  if (clients.size < MAX_CLIENTS) return;
  for (const [key, record] of clients)
    if (now - record.startedAt >= WINDOW_MS) clients.delete(key);
};

export function interactionRateLimit(request, response, next) {
  const now = Date.now();
  pruneExpired(now);
  const identity = request.user?.id || request.ip || "unknown";
  const key = `${identity}:${request.baseUrl}${request.route?.path || request.path}`;
  const record = clients.get(key);
  if (!record || now - record.startedAt >= WINDOW_MS) {
    clients.set(key, { count: 1, startedAt: now });
    response.set("X-RateLimit-Limit", String(MAX_REQUESTS));
    response.set("X-RateLimit-Remaining", String(MAX_REQUESTS - 1));
    return next();
  }
  if (record.count >= MAX_REQUESTS) {
    response.set(
      "Retry-After",
      String(Math.ceil((record.startedAt + WINDOW_MS - now) / 1000)),
    );
    return response.status(429).json({
      message: "Demasiadas solicitudes. Intenta nuevamente en un momento",
      requestId: request.id,
    });
  }
  record.count += 1;
  response.set("X-RateLimit-Limit", String(MAX_REQUESTS));
  response.set("X-RateLimit-Remaining", String(MAX_REQUESTS - record.count));
  return next();
}
