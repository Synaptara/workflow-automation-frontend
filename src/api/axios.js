import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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

    if (error.response?.status === 401 && !original?._retry && !isAuthCall) {
      original._retry = true;
      try {
        const token = await refresh();
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (refreshError) {
        const status = refreshError?.response?.status;
        // QA-06 FIX: Only wipe session if refresh token is genuinely invalid/expired (401/403).
        // Do NOT log the user out on 429 rate-limits, 5xx server restarts, or transient network drops.
        if (status === 401 || status === 403) {
          localStorage.removeItem("access");
          localStorage.removeItem("username");
          if (window.location.pathname !== "/login") {
            window.location.assign("/login?expired=1");
          }
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
