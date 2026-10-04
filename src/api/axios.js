import axios from "axios";

// In production, VITE_API_URL will be your duckdns.org URL.
// In local dev, we leave it blank ("") so it routes through the Vite proxy!
const API_BASE = "";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true // CRITICAL: This tells the browser to attach the HttpOnly cookie
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    // If the access token expires (401) and we haven't retried yet...
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        // Send an empty POST request. The browser automatically attaches the refresh_token cookie!
        const { data } = await axios.post(`${API_BASE}/api/auth/refresh/`, {}, {
          withCredentials: true
        });

        localStorage.setItem("access", data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
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
