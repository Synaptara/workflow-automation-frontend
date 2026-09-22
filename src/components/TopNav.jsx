import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function TopNav() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-border bg-base-900">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-8">
          <span className="font-semibold text-text-primary">Flowly</span>
          <nav className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm ${
                  isActive ? "bg-base-800 text-text-primary" : "text-text-muted hover:text-text-primary"
                }`
              }
            >
              Workflows
            </NavLink>
          </nav>
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="text-sm text-text-muted hover:text-text-primary"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
