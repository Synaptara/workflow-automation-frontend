import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useGlobalSocket } from "../hooks/useGlobalSocket";

export default function TopNav() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount, clearUnread } = useGlobalSocket();

  // Retrieve the username stored during login (fallback to "Account" if missing)
  const username = localStorage.getItem("username") || "Account";

  // Dynamic breadcrumb text based on route
  const getPageTitle = () => {
    if (location.pathname === "/") return "Workflows";
    if (location.pathname.includes("/workflows/")) return "Workflow Builder";
    if (location.pathname === "/integrations") return "Integrations Vault";
    if (location.pathname === "/billing") return "Billing";
    if (location.pathname === "/history") return "Global Run History";
    return "Dashboard";
  };

  const handleNotificationsClick = () => {
    clearUnread();
    navigate("/history");
  };

  return (
    <header className="h-16 border-b border-[#1b1b1e] bg-surface flex items-center justify-between pl-16 pr-4 md:px-8 shrink-0 z-10 shadow-sm relative">

      {/* Left Section: Breadcrumbs */}
      <div className="flex items-center gap-3.5">
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

        <h1 className="text-xs font-bold text-white tracking-wide pt-0.5">{getPageTitle()}</h1>
        <span className="text-zinc-600 font-light hidden sm:block">/</span>
        <span className="text-xs font-normal text-[#a1a1aa] hidden sm:block pt-0.5">Production Environment</span>
      </div>

      {/* Right Section: Actions & Profile */}
      <div className="flex items-center gap-4 sm:gap-5">

        <button onClick={handleNotificationsClick} aria-label="Notifications" className="relative text-[#a1a1aa] hover:text-white transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-status-success text-[#09090b] text-[9px] font-bold px-1.5 rounded-full ring-2 ring-[#09090b] animate-in zoom-in">
              {unreadCount}
            </span>
          )}
        </button>

        <div className="w-px h-4 bg-[#222222]"></div>

        {/* User Profile Badge */}
        <div className="flex items-center gap-2 select-none">
          <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className="text-xs font-medium text-zinc-300 hidden sm:block max-w-[120px] truncate">
            {username}
          </span>
        </div>

        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="text-xs font-medium text-[#a1a1aa] hover:text-[#f85149] transition-colors ml-1 sm:ml-0"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
