import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import Logo from "../assets/orkflo.jpeg";
import { getUsage } from "../api/workflows";

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [usage, setUsage] = useState({ count: 0, limit: 1000, percentage: 0 });

  // Initialize state from localStorage, defaulting to false if not found
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Fetch true database usage limit on mount
  useEffect(() => {
    getUsage().then(data => setUsage(data)).catch(() => {});
  }, []);

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  const navItemClass = ({ isActive }) =>
    `flex items-center ${collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3 py-2"} rounded-lg text-sm font-medium transition-all ${
      isActive
        ? "bg-[#141414] text-white shadow-sm"
        : "text-[#a1a1aa] hover:text-white hover:bg-[#141414]/50"
    }`;

  // Close mobile sidebar when a link is clicked
  const handleLinkClick = () => {
    if (mobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Hamburger Toggle (Floats over the TopNav area) */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-3 left-4 z-[60] w-10 h-10 flex items-center justify-center bg-[#111111] border border-[#222222] rounded-xl text-white shadow-md transition-transform active:scale-95"
      >
        {mobileOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        )}
      </button>

      {/* Mobile Overlay Backdrop */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-[40] backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fixed md:relative inset-y-0 left-0 z-[50] ${collapsed ? "w-20" : "w-64"} h-screen bg-[#08090d] border-r border-[#1f1f1f] flex flex-col shrink-0 transition-transform md:transition-[width] duration-300 ease-in-out shadow-2xl md:shadow-[4px_0_24px_rgba(0,0,0,0.2)] ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>

        {/* Floating Toggle Button (Desktop Only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-3 top-5 w-6 h-6 bg-[#111111] border border-[#222222] rounded-full items-center justify-center text-[#71717a] hover:text-white hover:border-[#404040] z-50 shadow-md transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Workspace Header */}
        <div className={`h-16 flex items-center border-b border-[#1f1f1f] ${collapsed ? "justify-center px-0" : "px-5"}`}>
          <div className="flex items-center gap-3 w-full cursor-pointer hover:opacity-80 transition-opacity overflow-hidden whitespace-nowrap">
            {/* Image Logo */}
            <div className={`w-9 h-9 rounded-[10px] overflow-hidden bg-[#111111] border border-[#222222] flex items-center justify-center shrink-0 shadow-sm ${collapsed ? "mx-auto" : ""}`}>
              <img src={Logo} alt="Orkflo Logo" className="w-full h-full object-cover" />
            </div>
            {!collapsed && (
              <div className="flex flex-col animate-in fade-in duration-300">
                <span className="text-sm font-semibold text-white leading-tight">Orkflo Inc.</span>
                <span className="text-[10px] text-[#71717a] font-medium uppercase tracking-wider">Organisation account</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col flex-1 overflow-y-auto py-5 px-3 gap-6 overflow-x-hidden custom-scrollbar">
          {/* Main Section */}
          <div className="flex flex-col gap-1.5">
            {!collapsed && <span className="text-[10px] font-bold text-[#71717a] uppercase tracking-widest px-3 mb-1 animate-in fade-in duration-300">Main</span>}
            <NavLink to="/" end className={navItemClass} title="Workflows" onClick={handleLinkClick}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
              {!collapsed && <span className="whitespace-nowrap animate-in fade-in duration-300">Workflows</span>}
            </NavLink>
          </div>

          {/* Configuration Section */}
          <div className="flex flex-col gap-1.5">
            {!collapsed && <span className="text-[10px] font-bold text-[#71717a] uppercase tracking-widest px-3 mb-1 animate-in fade-in duration-300">Configure</span>}
            <NavLink to="/integrations" className={navItemClass} title="Integrations Vault" onClick={handleLinkClick}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              {!collapsed && <span className="whitespace-nowrap animate-in fade-in duration-300">Integrations Vault</span>}
            </NavLink>
            <NavLink to="/billing" className={navItemClass} title="Billing & Usage" onClick={handleLinkClick}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
              {!collapsed && <span className="whitespace-nowrap animate-in fade-in duration-300">Billing & Usage</span>}
            </NavLink>
          </div>
        </div>

        {/* Footer / Plan Limits */}
        <div className="p-4 border-t border-[#1f1f1f] bg-[#08090d] overflow-hidden whitespace-nowrap min-h-[90px] flex flex-col justify-center">
          {!collapsed ? (
            <div className="animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-[#a1a1aa]">Task Usage</span>
                <span className="text-[10px] font-mono text-[#a1a1aa]">{usage.count}/{usage.limit}</span>
              </div>
              <div className="w-full bg-[#1f1f1f] rounded-full h-1.5 mb-3">
                <div className="bg-white h-1.5 rounded-full transition-all duration-1000 ease-in-out" style={{ width: `${usage.percentage}%` }}></div>
              </div>
              <button className="w-full py-2 text-xs font-bold text-white bg-[#111111] border border-[#222222] hover:border-white rounded-md transition-all shadow-sm">
                Upgrade Plan
              </button>
            </div>
          ) : (
            <div className="flex justify-center items-center animate-in fade-in duration-300">
              <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-black bg-white" title={`Task Usage: ${usage.percentage}%`}>
                {usage.percentage}%
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
