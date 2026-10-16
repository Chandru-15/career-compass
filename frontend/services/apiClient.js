export const API_BASE_URL = (
  import.meta.env?.VITE_API_BASE_URL || "http://localhost:3001/api"
).replace(/\/$/, "");
export async function apiFetch(url, options = {}) {
  const timeout = /openai|document-intelligence|agent/.test(url)
    ? 240000
    : 20000;
  try {
    const response = await fetch(url, {
      ...options,
      headers: { "X-Career-Compass": "local-demo", ...options.headers },
      signal: options.signal || AbortSignal.timeout(timeout),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(
        body.message ||
          "Request failed (" + response.status + "). Please retry.",
      );
    }
    return response;
  } catch (error) {
    if (error.name === "TimeoutError" || error.name === "AbortError")
      throw new Error("The request timed out. Please retry.");
    if (error instanceof TypeError)
      throw new Error(
        "Cannot reach the backend. Start it on localhost:3001 and retry.",
      );
    throw error;
  }
}
export function resumeUrl(value) {
  if (!value) return "";
  if (value.startsWith("/api/"))
    return API_BASE_URL.replace(/\/api$/, "") + value;
  return value;
}
