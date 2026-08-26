const configuredRestUrl = import.meta.env.VITE_API_REST?.trim().replace(
  /\/+$/,
  "",
);

const configuredApiUrl = configuredRestUrl
  ? configuredRestUrl.endsWith("/api")
    ? configuredRestUrl
    : `${configuredRestUrl}/api`
  : "";

export const API_URL = import.meta.env.PROD ? "/api" : configuredApiUrl;

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL?.trim().replace(/\/+$/, "") ||
  configuredApiUrl.replace(/\/api$/, "");

export async function apiRequest(path, options = {}) {
  if (!API_URL) throw new Error("API_NOT_CONFIGURED");
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const error = new Error(body?.message || `HTTP_${response.status}`);
    error.code = body?.code;
    throw error;
  }
  return body;
}
