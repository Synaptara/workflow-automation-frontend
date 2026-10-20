import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import Notifications from "../pages/Notifications";

const PAGES = [
  { prefix: "/webhooks", title: "Workflows" },
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
  const notifRef = useRef(null);

  const username = localStorage.getItem("username") || "Account";
  const email = localStorage.getItem("email");
  const initials = username.substring(0, 2).toUpperCase();

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
        { label: "Workflows", to: "/webhooks" },
        { label: workflowName || "Untitled workflow" },
      ]
    : [{ label: page?.title || "Workflows" }];

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
          className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
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
            className={`relative w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:text-foreground hover:bg-accent ${
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

        <DropdownMenu>
          <DropdownMenuTrigger
            className="outline-none rounded-full focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Account menu"
          >
            <Avatar className="w-8 h-8 border border-border cursor-pointer hover:ring-1 hover:ring-foreground/20 transition-all bg-accent text-foreground">
              <AvatarImage
                src={`https://avatar.vercel.sh/${encodeURIComponent(username)}?colors=111111,222222,333333`}
              />
              <AvatarFallback className="text-[11px] font-medium bg-accent">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-60 mt-1 text-[13px]">
            <DropdownMenuLabel className="font-normal">
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
