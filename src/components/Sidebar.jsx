import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  // Initialize state from localStorage, defaulting to false if not found
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  const navItemClass = ({ isActive }) =>
    `flex items-center ${collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3 py-2"} rounded-lg text-sm font-medium transition-all ${
      isActive
        ? "bg-surface-hover text-text-primary shadow-sm"
        : "text-text-secondary hover:text-text-primary hover:bg-surface-hover/50"
    }`;

  return (
    <aside className={`relative ${collapsed ? "w-20" : "w-64"} h-screen bg-surface border-r border-border-default flex flex-col z-20 shrink-0 transition-[width] duration-300 ease-in-out shadow-[4px_0_24px_rgba(0,0,0,0.2)]`}>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-5 w-6 h-6 bg-surface border border-border-default rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:border-accent z-50 shadow-md transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Workspace Header */}
      <div className={`h-16 flex items-center border-b border-border-subtle ${collapsed ? "justify-center px-0" : "px-5"}`}>
        <div className="flex items-center gap-3 w-full cursor-pointer hover:opacity-80 transition-opacity overflow-hidden whitespace-nowrap">
          <div className={`w-8 h-8 rounded bg-accent flex items-center justify-center text-accent-text font-bold shadow-md shadow-accent-transparent shrink-0 ${collapsed ? "mx-auto" : ""}`}>
            F
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-in fade-in duration-300">
              <span className="text-sm font-semibold text-text-primary leading-tight">Flowly Inc.</span>
              <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Organisation account</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto py-5 px-3 gap-6 overflow-x-hidden">
        {/* Main Section */}
        <div className="flex flex-col gap-1.5">
          {!collapsed && <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-3 mb-1 animate-in fade-in duration-300">Main</span>}
          <NavLink to="/" end className={navItemClass} title="Workflows">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
            {!collapsed && <span className="whitespace-nowrap animate-in fade-in duration-300">Workflows</span>}
          </NavLink>
        </div>

        {/* Configuration Section */}
        <div className="flex flex-col gap-1.5">
          {!collapsed && <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-3 mb-1 animate-in fade-in duration-300">Configure</span>}
          <NavLink to="/integrations" className={navItemClass} title="Integrations Vault">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            {!collapsed && <span className="whitespace-nowrap animate-in fade-in duration-300">Integrations Vault</span>}
          </NavLink>
          <NavLink to="/billing" className={navItemClass} title="Billing & Usage">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            {!collapsed && <span className="whitespace-nowrap animate-in fade-in duration-300">Billing & Usage</span>}
          </NavLink>
        </div>
      </div>

      {/* Footer / Plan Limits */}
      <div className="p-4 border-t border-border-subtle bg-surface/50 overflow-hidden whitespace-nowrap min-h-[90px] flex flex-col justify-center">
        {!collapsed ? (
          <div className="animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-text-secondary">Task Usage</span>
              <span className="text-xs font-bold text-text-primary">40%</span>
            </div>
            <div className="w-full bg-border-default rounded-full h-1.5 mb-3">
              <div className="bg-accent h-1.5 rounded-full" style={{ width: "40%" }}></div>
            </div>
            <button className="w-full py-2 text-xs font-bold text-text-primary bg-surface-elevated border border-border-focus hover:border-accent rounded-md transition-all shadow-sm">
              Upgrade Plan
            </button>
          </div>
        ) : (
          <div className="flex justify-center items-center animate-in fade-in duration-300">
            <div className="w-8 h-8 rounded-full border-2 border-accent flex items-center justify-center text-[10px] font-bold text-accent bg-accent/10" title="Task Usage: 40%">
              40%
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
