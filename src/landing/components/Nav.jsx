import { Link } from "react-router-dom";
import Logo from "./Logo";
import ThemeToggle from "./Themetoggle";

export default function Nav() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md" style={{ borderBottom: "1px solid var(--l-border)", backgroundColor: "color-mix(in srgb, var(--l-bg) 85%, transparent)" }}>
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={26} />
          <span className="text-[15px] font-medium tracking-tight">Flowly</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm" style={{ color: "var(--l-text-muted)" }}>
          <a href="#how-it-works" className="hover:opacity-100" style={{ color: "var(--l-text-muted)" }}>How it works</a>
          <a href="#integrations" className="hover:opacity-100" style={{ color: "var(--l-text-muted)" }}>Integrations</a>
          <a href="#features" className="hover:opacity-100" style={{ color: "var(--l-text-muted)" }}>Features</a>
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link to="/login" className="text-sm font-medium" style={{ color: "var(--l-text)" }}>
            Log in
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold px-4 py-2 rounded-full"
            style={{ backgroundColor: "var(--l-btn-primary-bg)", color: "var(--l-btn-primary-text)" }}
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
