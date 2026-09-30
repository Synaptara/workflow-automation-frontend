import { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("access"));

  const login = async (username, password) => {
    const { data } = await api.post("/auth/login/", { username, password });
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    setIsAuthenticated(true);
  };

  const register = async (username, email, password) => {
      await api.post("/auth/register/", { username, email, password });
      await login(username, password);
    };

    // NEW: Handle OAuth login payload from Django
    const oauthLogin = async (provider, code) => {
      const { data } = await api.post(`/auth/social/${provider}/`, { code });
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      setIsAuthenticated(true);
    };

    const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, oauthLogin, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
