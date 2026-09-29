import { Link } from "react-router-dom";

export default function Nav() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-[#060607]/60"
      style={{ borderBottom: "1px solid var(--l-border)" }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14 md:h-16">

        {/* Logo Section */}
        <Link to="/" className="flex items-center group">
          <span className="text-[17px] font-semibold tracking-tight text-white">
            Orkflo
          </span>
        </Link>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium" style={{ color: "var(--l-text-muted)" }}>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#integrations" className="hover:text-white transition-colors">Integrations</a>
          <a href="#features" className="hover:text-white transition-colors">Architecture</a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          <Link
            to="/login"
            className="text-sm font-medium hover:text-white transition-colors flex items-center gap-2"
            style={{ color: "var(--l-text-muted)" }}
          >
            Log in
            <span className="hidden sm:flex items-center justify-center bg-[#18181b] border border-[#27272a] rounded px-1.5 py-0.5 text-[10px] font-mono text-[#71717a]">
              L
            </span>
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold px-5 py-2.5 rounded-lg transition-all hover:opacity-90 flex items-center gap-2"
            style={{ backgroundColor: "var(--l-btn-primary-bg)", color: "var(--l-btn-primary-text)" }}
          >
            Sign up
            <span className="hidden sm:flex items-center justify-center bg-black/10 border border-black/10 rounded px-1.5 py-0.5 text-[10px] font-mono text-black/60">
              D
            </span>
          </Link>
        </div>

      </div>
    </header>
  );
}
