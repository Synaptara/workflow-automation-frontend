import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useLocation, useMatch, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGlobalSocket } from "../hooks/useGlobalSocket";
import { getWorkflow } from "../api/workflows";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Plug,
  Activity,
  LogOut,
  PanelLeft,
  Inbox,
  Image as ImageIcon,
  Check,
  ArrowLeft,
} from "lucide-react";
import Notifications from "../pages/Notifications";
import avatar1 from "../assets/profile/avatar-1.png";
import avatar2 from "../assets/profile/avatar-2.png";
import avatar3 from "../assets/profile/avatar-3.png";
import avatar4 from "../assets/profile/avatar-4.png";
import avatar5 from "../assets/profile/avatar-5.png";
import avatar6 from "../assets/profile/avatar-6.png";

/* ---------- profile options (from src/assets/profile/) ---------- */
const PROFILE_AVATARS = [
  { id: 1, src: avatar1, label: "Art 1" },
  { id: 2, src: avatar2, label: "Art 2" },
  { id: 3, src: avatar3, label: "Art 3" },
  { id: 4, src: avatar4, label: "Art 4" },
  { id: 5, src: avatar5, label: "Art 5" },
  { id: 6, src: avatar6, label: "Art 6" },
];

const PAGES = [
  { prefix: "/home", title: "Home" },
  { prefix: "/webhooks", title: "Workflows" },
  { prefix: "/workflows", title: "Workflows" },
  { prefix: "/templates", title: "Templates" },
  { prefix: "/history", title: "Executions" },
  { prefix: "/integrations", title: "Integrations Vault" },
  { prefix: "/billing", title: "Billing & Usage" },
  { prefix: "/notifications", title: "Notifications" },
];

export default function TopNav() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { unreadCount, clearUnread } = useGlobalSocket();
  const builderMatch = useMatch("/workflows/:id");
  const workflowId = builderMatch?.params.id;

  const [workflowName, setWorkflowName] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSubView, setActiveSubView] = useState("main"); // 'main' | 'avatars'
  const notifRef = useRef(null);

  const username = localStorage.getItem("username") || "Account";
  const email = localStorage.getItem("email");
  const initials = username.substring(0, 2).toUpperCase();

  /* Randomly initialize a default avatar if none exists */
  const [currentAvatar, setCurrentAvatar] = useState(() => {
    const saved = localStorage.getItem("user_avatar");
    if (saved) return saved;
    const randomIndex = Math.floor(Math.random() * PROFILE_AVATARS.length);
    const chosen = PROFILE_AVATARS[randomIndex].src;
    localStorage.setItem("user_avatar", chosen);
    return chosen;
  });

  const handleSelectAvatar = (e, src) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentAvatar(src);
    localStorage.setItem("user_avatar", src);
    setActiveSubView("main");
  };

  const handleMenuOpenChange = (open) => {
    setMenuOpen(open);
    if (!open) {
      // Reset sub-view after closing animation completes
      setTimeout(() => setActiveSubView("main"), 200);
    }
  };

  useEffect(() => {
    if (!workflowId) {
      setWorkflowName("");
      return;
    }
    let cancelled = false;
    getWorkflow(workflowId)
      .then((w) => {
        if (!cancelled) setWorkflowName(w?.name || "");
      })
      .catch(() => {
        if (!cancelled) setWorkflowName("");
      });
    return () => {
      cancelled = true;
    };
  }, [workflowId]);

  // Close the popover on route change
  useEffect(() => {
    setNotifOpen(false);
  }, [pathname]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!notifOpen) return;
    const onDown = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setNotifOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setNotifOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [notifOpen]);

  const page = PAGES.find(
    (p) => pathname === p.prefix || pathname.startsWith(`${p.prefix}/`),
  );
  const crumbs = workflowId
    ? [
        { label: "Workflows", to: "/workflows" },
        { label: workflowName || "Untitled workflow" },
      ]
    : [{ label: page?.title || "Home" }];

  const toggleNotifications = () => {
    if (!notifOpen) clearUnread();
    setNotifOpen((v) => !v);
  };

  const handleToggleSidebar = () => {
    const isMobile = window.innerWidth < 768;
    window.dispatchEvent(
      new CustomEvent("toggleSidebar", { detail: { mobile: isMobile } }),
    );
  };

  return (
    <header className="h-14 border-b border-border bg-background flex items-center justify-between gap-4 px-4 shrink-0 z-10 sticky top-0 w-full">
      {/* Sidebar Toggle & Breadcrumbs */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 pr-2">
        <button
          onClick={handleToggleSidebar}
          aria-label="Toggle Sidebar"
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0 cursor-pointer"
        >
          <PanelLeft className="w-[18px] h-[18px]" />
        </button>

        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex items-center gap-1.5 text-[13px] sm:text-[14px] tracking-tight min-w-0">
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <li key={i} className="flex items-center gap-1.5 min-w-0">
                  {i > 0 && (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                  )}
                  {c.to && !last ? (
                    <Link
                      to={c.to}
                      className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <span
                      aria-current={last ? "page" : undefined}
                      className="font-medium text-foreground truncate"
                    >
                      {c.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <div ref={notifRef} className="sm:relative">
          <button
            onClick={toggleNotifications}
            title={
              unreadCount > 0
                ? `${unreadCount} new notifications`
                : "Notifications"
            }
            aria-label="Notifications"
            aria-haspopup="dialog"
            aria-expanded={notifOpen}
            className={`relative w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:text-foreground hover:bg-accent cursor-pointer ${
              notifOpen ? "bg-accent text-foreground" : "text-muted-foreground"
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-blue-500 text-white text-[10px] font-medium leading-4 text-center ring-2 ring-background tabular-nums">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <Notifications open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        <DropdownMenu open={menuOpen} onOpenChange={handleMenuOpenChange}>
          <DropdownMenuTrigger
            className="outline-none rounded-full focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Account menu"
          >
            <Avatar className="w-8 h-8 border border-border cursor-pointer hover:ring-1 hover:ring-foreground/20 transition-all bg-accent text-foreground">
              <AvatarImage src={currentAvatar} alt={username} />
              <AvatarFallback className="text-[11px] font-medium bg-accent">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-64 mt-1 text-[13px] p-1.5"
          >
            {activeSubView === "main" ? (
              <>
                <DropdownMenuLabel className="font-normal px-2 py-1.5">
                  <div className="flex flex-col gap-1">
                    <p className="text-[14px] font-medium leading-none text-foreground truncate">
                      {username}
                    </p>
                    {email && (
                      <p className="text-[12px] leading-none text-muted-foreground truncate">
                        {email}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setActiveSubView("avatars");
                  }}
                  className="cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 mr-2" /> Change profile image
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    clearUnread();
                    setNotifOpen(true);
                  }}
                >
                  <Inbox className="w-4 h-4 mr-2" /> Notifications
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate("/history")}
                >
                  <Activity className="w-4 h-4 mr-2" /> Executions
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate("/integrations")}
                >
                  <Plug className="w-4 h-4 mr-2" /> Integrations Vault
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => navigate("/billing")}
                >
                  <CreditCard className="w-4 h-4 mr-2" /> Billing & Usage
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" /> Log out
                </DropdownMenuItem>
              </>
            ) : (
              <div className="p-1">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border px-1">
                  <button
                    type="button"
                    onClick={() => setActiveSubView("main")}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <span className="text-[12px] font-medium text-foreground">
                    Choose Avatar
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 p-1">
                  {PROFILE_AVATARS.map((art) => {
                    const isSelected = currentAvatar === art.src;
                    return (
                      <button
                        key={art.id}
                        type="button"
                        onClick={(e) => handleSelectAvatar(e, art.src)}
                        className={`relative group rounded-lg border p-1 aspect-square flex items-center justify-center overflow-hidden transition-all cursor-pointer ${
                          isSelected
                            ? "border-foreground ring-1 ring-foreground"
                            : "border-border hover:border-muted-foreground/50 bg-muted/30"
                        }`}
                      >
                        <img
                          src={art.src}
                          alt={art.label}
                          className="w-full h-full object-cover rounded-md"
                        />
                        <div className="absolute inset-0 bg-background/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[10px] text-foreground font-medium">
                          {art.label}
                        </div>
                        {isSelected && (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-foreground text-background flex items-center justify-center shadow-xs">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
