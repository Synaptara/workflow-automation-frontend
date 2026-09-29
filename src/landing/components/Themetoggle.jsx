import { useLandingTheme } from "../context/Landingthemecontext";

export default function ThemeToggle() {
  const { theme, toggle } = useLandingTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="relative w-12 h-7 rounded-full border transition-colors"
      style={{
        borderColor: "var(--l-border)",
        backgroundColor: "var(--l-surface-2)",
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-transform duration-200"
        style={{
          backgroundColor: "var(--l-btn-primary-bg)",
          color: "var(--l-btn-primary-text)",
          transform: isDark ? "translateX(0)" : "translateX(20px)",
        }}
      >
        {isDark ? "🌙" : "☀"}
      </span>
    </button>
  );
}
