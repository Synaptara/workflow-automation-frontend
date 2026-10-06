import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import Logo from "../assets/orkflo.jpeg";
import { getUsage } from "../api/workflows";
import { DashboardIcon, BlocksIcon, NetworkIcon, IndianRupeeIcon } from "../components/icons";
import { LayoutGrid, Settings2 } from "lucide-react";

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [usage, setUsage] = useState({ count: 0, limit: 1000, percentage: 0 });

  // Initialize state from localStorage, defaulting to false if not found
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    getUsage().then(data => setUsage(data)).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  const handleLinkClick = () => {
    if (mobileOpen) setMobileOpen(false);
  };

  // ENTERPRISE UX FIX: Override the collapsed state if the mobile drawer is open.
  // This ensures the mobile sidebar is always full-width, without deleting the user's desktop preference.
  const isCollapsed = collapsed && !mobileOpen;

  // Enterprise Tree-Node Renderer
  const renderNavSection = (title, SectionIcon, items) => (
    <div className="flex flex-col mb-4">
      {/* Section Header */}
      {!isCollapsed && (
        <div className="flex items-center gap-2 px-3 mb-2 text-[#71717a] animate-in fade-in duration-300">
          <SectionIcon className="w-4 h-4 shrink-0" />
          <span className="text-[11px] font-bold uppercase tracking-widest">{title}</span>
        </div>
      )}

      {/* Tree Structure Wrapper */}
      <div className={`flex flex-col ${!isCollapsed ? "ml-[21px]" : "gap-2 mt-2"}`}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <div key={item.to} className="relative flex items-center mt-1">

              {/* Vertical Trunk Segment */}
              {!isCollapsed && (
                <div
                  className="absolute left-0 w-px bg-[#333333] pointer-events-none z-0 transition-all"
                  style={{
                    top: index === 0 ? '-16px' : '-4px',
                    bottom: isLast ? '50%' : '-4px'
                  }}
                />
              )}

              {/* Horizontal Branch Segment */}
              {!isCollapsed && (
                <div className="absolute top-1/2 left-0 w-[12px] h-px bg-[#333333] pointer-events-none z-0" />
              )}

              <NavLink
                to={item.to}
                end={item.end}
                onClick={handleLinkClick}
                title={item.label}
                className={({ isActive }) =>
                  `relative z-10 flex items-center ${
                    isCollapsed
                      ? "justify-center w-10 h-10 mx-auto"
                      : "gap-3 px-3 py-2.5 w-full ml-[12px]"
                  } rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[#141414] text-white shadow-sm border border-white/5"
                      : "text-[#a1a1aa] hover:text-white hover:bg-[#141414]/50"
                  }`
                }
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {!isCollapsed && (
                  <span className="whitespace-nowrap animate-in fade-in duration-300">
                    {item.label}
                  </span>
                )}
              </NavLink>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger Toggle */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden fixed top-3 left-4 z-[40] w-10 h-10 flex items-center justify-center bg-[#111111] border border-[#222222] rounded-xl text-white shadow-md transition-transform active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      {/* Mobile Overlay Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-[40] backdrop-blur-sm animate-in fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`fixed md:relative inset-y-0 left-0 z-[50] ${isCollapsed ? "w-20" : "w-64"} h-screen bg-[#08090d] border-r border-[#1f1f1f] flex flex-col shrink-0 transition-transform md:transition-[width] duration-300 ease-in-out shadow-2xl md:shadow-[4px_0_24px_rgba(0,0,0,0.2)] ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>

        {/* Floating Toggle Button (Desktop Only) */}
        <button
          onClick={() => setCollapsed(!collapsed)} // We still toggle the base state to save to localStorage
          className="hidden md:flex absolute -right-3 top-5 w-6 h-6 bg-[#111111] border border-[#222222] rounded-full items-center justify-center text-[#71717a] hover:text-white hover:border-[#404040] z-50 shadow-md transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Workspace Header */}
        <div className={`h-16 flex items-center border-b border-[#1f1f1f] ${isCollapsed ? "justify-center px-0" : "px-5"}`}>
          <div className="flex items-center gap-3 w-full cursor-pointer hover:opacity-80 transition-opacity overflow-hidden whitespace-nowrap">
            {/* Image Logo */}
            <div className={`w-9 h-9 rounded-[10px] overflow-hidden bg-[#111111] border border-[#222222] flex items-center justify-center shrink-0 shadow-sm ${isCollapsed ? "mx-auto" : ""}`}>
              <img src={Logo} alt="Orkflo Logo" className="w-full h-full object-cover" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in duration-300">
                <span className="text-sm font-semibold text-white leading-tight">Orkflo Inc.</span>
                <span className="text-[10px] text-[#71717a] font-medium uppercase tracking-wider">Organisation account</span>
              </div>
            )}
          </div>

          {/* Close button placed on top-right of mobile drawer */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden ml-auto p-1.5 rounded-lg text-[#71717a] hover:text-white hover:bg-[#141414] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col flex-1 overflow-y-auto py-6 px-3 gap-6 overflow-x-hidden custom-scrollbar">

          {/* Main Section */}
          {renderNavSection("Main", LayoutGrid, [
            { to: "/workflows", label: "Workflows", icon: DashboardIcon, end: true },
            { to: "/templates", label: "Templates", icon: BlocksIcon, end: false },
          ])}

          {/* Configure Section */}
          {renderNavSection("Configure", Settings2, [
            { to: "/integrations", label: "Integrations Vault", icon: NetworkIcon, end: false },
            { to: "/billing", label: "Billing & Usage", icon: IndianRupeeIcon, end: false },
          ])}

        </div>

        {/* Footer / Plan Limits */}
        <div className="p-4 border-t border-[#1f1f1f] bg-[#08090d] overflow-hidden whitespace-nowrap min-h-[90px] flex flex-col justify-center">
          {!isCollapsed ? (
            <div className="animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-[#a1a1aa]">Task Usage</span>
                <span className="text-[10px] font-mono text-[#a1a1aa]">{usage.count}/{usage.limit}</span>
              </div>
              <div className="w-full bg-[#1f1f1f] rounded-full h-1.5 mb-3 overflow-hidden">
                <div className="bg-white h-full rounded-full transition-all duration-1000 ease-in-out" style={{ width: `${usage.percentage}%` }}></div>
              </div>
              <button className="w-full py-2 text-xs font-bold text-white bg-[#111111] border border-[#222222] hover:border-[#404040] hover:bg-[#141414] rounded-md transition-all shadow-sm">
                Upgrade Plan
              </button>
            </div>
          ) : (
            <div className="flex justify-center items-center animate-in fade-in duration-300">
              <div className="w-8 h-8 rounded-full border border-[#404040] flex items-center justify-center text-[9px] font-bold text-white bg-[#111111]" title={`Task Usage: ${usage.percentage}%`}>
                {usage.percentage}%
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
