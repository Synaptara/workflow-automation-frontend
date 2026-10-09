import { useEffect, useState } from "react";
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
import { Bell, ChevronRight, CreditCard, Plug, Activity, LogOut, PanelLeft, Inbox } from "lucide-react";

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

  const username = localStorage.getItem("username") || "Account";
  const email = localStorage.getItem("email");
  const initials = username.substring(0, 2).toUpperCase();

  useEffect(() => {
    if (!workflowId) { setWorkflowName(""); return; }
    let cancelled = false;
    getWorkflow(workflowId)
      .then((w) => { if (!cancelled) setWorkflowName(w?.name || ""); })
      .catch(() => { if (!cancelled) setWorkflowName(""); });
    return () => { cancelled = true; };
  }, [workflowId]);

  const page = PAGES.find((p) => pathname === p.prefix || pathname.startsWith(`${p.prefix}/`));
  const crumbs = workflowId
    ? [{ label: "Workflows", to: "/webhooks" }, { label: workflowName || "Untitled workflow" }]
    : [{ label: page?.title || "Workflows" }];

  const openNotifications = () => {
    clearUnread();
    // FIXED: Now routes to /notifications instead of /history
    navigate("/notifications");
  };

  const handleToggleSidebar = () => {
    const isMobile = window.innerWidth < 768;
    window.dispatchEvent(new CustomEvent("toggleSidebar", { detail: { mobile: isMobile } }));
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
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />}
                  {c.to && !last ? (
                    <Link to={c.to} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current={last ? "page" : undefined} className="font-medium text-foreground truncate">
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
        <button
          onClick={openNotifications}
          title={unreadCount > 0 ? `${unreadCount} new notifications` : "Notifications"}
          aria-label="Notifications"
          className="relative w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-blue-500 text-white text-[10px] font-medium leading-4 text-center ring-2 ring-background tabular-nums">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none rounded-full focus-visible:ring-2 focus-visible:ring-ring" aria-label="Account menu">
            <Avatar className="w-8 h-8 border border-border cursor-pointer hover:ring-1 hover:ring-foreground/20 transition-all bg-accent text-foreground">
              <AvatarImage src={`https://avatar.vercel.sh/${encodeURIComponent(username)}?colors=111111,222222,333333`} />
              <AvatarFallback className="text-[11px] font-medium bg-accent">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-60 mt-1 text-[13px]">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-[14px] font-medium leading-none text-foreground truncate">{username}</p>
                {email && <p className="text-[12px] leading-none text-muted-foreground truncate">{email}</p>}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* Added Notifications to Dropdown */}
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/notifications")}>
              <Inbox className="w-4 h-4 mr-2" /> Notifications
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/history")}>
              <Activity className="w-4 h-4 mr-2" /> Executions
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/integrations")}>
              <Plug className="w-4 h-4 mr-2" /> Integrations Vault
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/billing")}>
              <CreditCard className="w-4 h-4 mr-2" /> Billing & Usage
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              onClick={() => { logout(); navigate("/login"); }}
            >
              <LogOut className="w-4 h-4 mr-2" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
