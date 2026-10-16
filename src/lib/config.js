export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8000" : "");

const origin = API_BASE || window.location.origin;
export const WS_BASE = origin.replace(/^http/, "ws");
export const webhookFullUrl = (path = "") => `${origin}${path}`;
