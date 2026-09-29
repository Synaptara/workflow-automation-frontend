import { createContext, useContext, useEffect, useState } from "react";

const LandingThemeContext = createContext(null);

export function LandingThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("landing-theme") || "dark");

  useEffect(() => {
    localStorage.setItem("landing-theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <LandingThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </LandingThemeContext.Provider>
  );
}

export const useLandingTheme = () => useContext(LandingThemeContext);
