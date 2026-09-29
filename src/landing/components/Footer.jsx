import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: "var(--l-border)" }}>
      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Logo size={20} />
          <span className="text-sm font-medium">Flowly</span>
        </div>

        <div className="flex items-center gap-6 text-sm" style={{ color: "var(--l-text-muted)" }}>
          <a href="#how-it-works">How it works</a>
          <a href="#integrations">Integrations</a>
          <Link to="/login">Log in</Link>
        </div>

        <p className="text-xs" style={{ color: "var(--l-text-muted)" }}>
          © {new Date().getFullYear()} Flowly
        </p>
      </div>
    </footer>
  );
}
