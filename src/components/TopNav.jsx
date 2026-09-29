import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

export default function TopNav() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Dynamic breadcrumb text based on route
  const getPageTitle = () => {
    if (location.pathname === "/") return "Workflows";
    if (location.pathname.includes("/workflows/")) return "Workflow Builder";
    if (location.pathname === "/integrations") return "Integrations Vault";
    if (location.pathname === "/billing") return "Billing";
    return "Dashboard";
  };

  return (
    <header className="h-16 border-b border-[#1b1b1e] bg-surface flex items-center justify-between pl-16 pr-4 md:px-8 shrink-0 z-10 shadow-sm relative">
      <div className="flex items-center gap-3.5">
        {/* Distinct "Go Back" Arrow instead of a Chevron */}
        <button
          onClick={() => navigate(-1)}
          aria-label="Go Back"
          className="hidden md:flex w-7 h-7 rounded-full border border-[#222222] bg-[#111111] items-center justify-center text-[#71717a] hover:text-white hover:border-[#404040] transition shadow-sm"
          type="button"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>

        {/* Title resized to match "Production Environment" but keeping bold white */}
        <h1 className="text-xs font-bold text-white tracking-wide pt-0.5">{getPageTitle()}</h1>

        <span className="text-zinc-600 font-light hidden sm:block">/</span>
        <span className="text-xs font-normal text-[#a1a1aa] hidden sm:block pt-0.5">Production Environment</span>
      </div>

      <div className="flex items-center gap-5">
        <button aria-label="Notifications" className="relative text-[#a1a1aa] hover:text-white transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-status-success rounded-full ring-2 ring-[#09090b]"></span>
        </button>
        <div className="w-px h-4 bg-[#222222]"></div>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="text-xs font-medium text-[#a1a1aa] hover:text-[#f85149] transition-colors"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
