import { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("access"));

  const login = async (username, password) => {
    const { data } = await api.post("/auth/login/", { username, password });
    localStorage.setItem("access", data.access);
    // REMOVED: localStorage.setItem("refresh", data.refresh);
    localStorage.setItem("username", username);
    setIsAuthenticated(true); 
  };

  const sendOtp = async (email) => {
    await api.post("/auth/send-otp/", { email });
  };

  const register = async (username, email, password, otp) => {
    await api.post("/auth/register/", { username, email, password, otp });
    await login(username, password);
  };

  const oauthLogin = async (provider, code) => {
    const { data } = await api.post(`/auth/social/${provider}/`, { code });
    localStorage.setItem("access", data.access);
    // REMOVED: localStorage.setItem("refresh", data.refresh);

    if (data.username) {
        localStorage.setItem("username", data.username);
    } else {
        localStorage.setItem("username", `${provider}_user`);
    }

    setIsAuthenticated(true);
  };

  const logout = () => {
    api.post("/auth/logout/").catch(() => {}); // clears the refresh cookie
    localStorage.removeItem("access");
    localStorage.removeItem("username");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, oauthLogin, login, register, sendOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
