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
    <header className="h-16 border-b border-border-default bg-surface flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold text-text-primary">{getPageTitle()}</h1>
        <span className="text-border-focus font-light">/</span>
        <span className="text-xs font-medium text-text-muted">Production Environment</span>
      </div>

      <div className="flex items-center gap-4">
        <button className="text-text-muted hover:text-text-primary transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </button>
        <div className="w-px h-5 bg-border-default"></div>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="text-xs font-semibold text-text-secondary hover:text-status-danger transition-colors"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
