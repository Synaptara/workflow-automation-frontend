import axios from "axios";

// Dynamically pull the URL. In production (Vercel), it uses your duckdns URL.
// In local dev (where the env var might be missing), it defaults to "" for the proxy.
const API_BASE = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true // CRITICAL: This tells the browser to attach the HttpOnly cookie
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Singleton promise to prevent duplicate concurrent refresh requests
let refreshing = null;
const refresh = () =>
  (refreshing ??= axios
    .post(`${API_BASE}/api/auth/refresh/`, {}, { withCredentials: true })
    .then(({ data }) => {
      localStorage.setItem("access", data.access);
      return data.access;
    })
    .finally(() => {
      refreshing = null;
    }));

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthCall = original?.url?.includes("/auth/");

    // If access token expires (401), we haven't retried yet, and it's not an auth route...
    if (error.response?.status === 401 && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        const token = await refresh();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        // If the refresh token is expired or invalid, log them out
        localStorage.removeItem("access");
        localStorage.removeItem("username");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
