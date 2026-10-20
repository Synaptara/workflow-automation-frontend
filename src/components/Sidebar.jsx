import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../assets/orkflo.png";
import { getUsage, listWorkflows } from "../api/workflows";
import {
  DashboardIcon,
  BlocksIcon,
  NetworkIcon,
  IndianRupeeIcon,
} from "../components/icons";
import {
  ChevronsUpDown,
  Search,
  Activity,
  Hexagon,
  CornerDownLeft,
} from "lucide-react";
import { Badge } from "./ui/badge";

/* ---------- stroked home svg + nav config ---------- */

function HomeStrokedIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9" />
      <path d="M9.5 21v-6a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5v6" />
    </svg>
  );
}

const NAV_ITEMS = [
  {
    to: "/home",
    label: "Home",
    icon: HomeStrokedIcon,
    match: ["/home"],
  },
  {
    to: "/workflows",
    label: "Workflows",
    icon: DashboardIcon,
    match: ["/workflows", "/webhooks"],
  },
  {
    to: "/templates",
    label: "Templates",
    icon: BlocksIcon,
    match: ["/templates"],
  },
  { to: "/history", label: "Executions", icon: Activity, match: ["/history"] },
  {
    to: "/integrations",
    label: "Integrations Vault",
    icon: NetworkIcon,
    match: ["/integrations"],
  },
  {
    to: "/billing",
    label: "Billing & Usage",
    icon: IndianRupeeIcon,
    match: ["/billing"],
  },
];

const isTyping = (el) =>
  !!el &&
  (el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable);

/* ---------- command palette ---------- */

function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setIndex(0);
    setLoading(true);
    listWorkflows()
      .then((d) => setWorkflows(Array.isArray(d) ? d : []))
      .catch(() => setWorkflows([]))
      .finally(() => setLoading(false));
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pages = NAV_ITEMS.filter(
      (i) => !q || i.label.toLowerCase().includes(q),
    ).map((i) => ({
      key: i.to,
      group: "Pages",
      label: i.label,
      to: i.to,
      icon: i.icon,
    }));
    let wfs = workflows
      .filter(
        (w) =>
          !q ||
          w.name.toLowerCase().includes(q) ||
          String(w.id).toLowerCase().startsWith(q),
      )
      .map((w) => ({
        key: w.id,
        group: "Workflows",
        label: w.name,
        hint: String(w.id).slice(0, 8),
        to: `/workflows/${w.id}`,
        icon: Hexagon,
      }));
    if (!q) wfs = wfs.slice(0, 6);
    return [...pages, ...wfs];
  }, [query, workflows]);

  useEffect(() => {
    setIndex(0);
  }, [query]);

  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [index, results]);

  const go = (r) => {
    onClose();
    navigate(r.to);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[index]) go(results[index]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!open) return null;

  let lastGroup = null;
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-sm px-4 pt-[14vh] animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] rounded-lg border border-border bg-background shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Find a page or workflow"
            className="h-12 flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="text-[10px] font-mono text-muted-foreground bg-accent border border-border rounded px-1.5 py-0.5">
            esc
          </kbd>
        </div>

        <div
          ref={listRef}
          className="max-h-[340px] overflow-y-auto custom-scrollbar p-1.5"
        >
          {results.map((r, i) => {
            const showHeading = r.group !== lastGroup;
            lastGroup = r.group;
            const Icon = r.icon;
            const active = i === index;
            return (
              <div key={`${r.group}-${r.key}`}>
                {showHeading && (
                  <p className="px-2.5 pt-2 pb-1 text-[11px] text-muted-foreground">
                    {r.group}
                  </p>
                )}
                <button
                  data-active={active}
                  onMouseMove={() => setIndex(i)}
                  onClick={() => go(r)}
                  className={`w-full flex items-center gap-2.5 px-2.5 h-9 rounded-md text-left text-[13px] transition-colors ${
                    active
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate flex-1">{r.label}</span>
                  {r.hint && (
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {r.hint}
                    </span>
                  )}
                  {active && (
                    <CornerDownLeft className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                </button>
              </div>
            );
          })}

          {results.length === 0 && (
            <p className="px-3 py-8 text-center text-[13px] text-muted-foreground">
              {loading ? "Searching…" : `Nothing matches "${query}".`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 px-4 py-2 border-t border-border text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <kbd className="font-mono bg-accent border border-border rounded px-1">
              ↑
            </kbd>
            <kbd className="font-mono bg-accent border border-border rounded px-1">
              ↓
            </kbd>{" "}
            Navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="font-mono bg-accent border border-border rounded px-1">
              ↵
            </kbd>{" "}
            Open
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ---------- usage ---------- */

function UsageRing({ pct, tone }) {
  const r = 11;
  const c = 2 * Math.PI * r;
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" className="-rotate-90">
      <circle
        cx="14"
        cy="14"
        r={r}
        fill="none"
        strokeWidth="2.5"
        className="stroke-accent"
      />
      <circle
        cx="14"
        cy="14"
        r={r}
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (c * pct) / 100}
        className={`${tone.stroke} transition-all duration-700`}
      />
    </svg>
  );
}

/* ---------- sidebar ---------- */

export default function Sidebar() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [usage, setUsage] = useState({ count: 0, limit: 1000, percentage: 0 });

  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved !== null ? JSON.parse(saved) : false;
  });

  const loadUsage = useCallback(() => {
    getUsage()
      .then((d) => d && setUsage(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadUsage();
  }, [pathname, loadUsage]);

  useEffect(() => {
    window.addEventListener("focus", loadUsage);

    // Listen for toggle event from TopNav
    const handleToggle = (e) => {
      if (e.detail?.mobile) {
        setMobileOpen((prev) => !prev);
      } else {
        setCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("toggleSidebar", handleToggle);

    return () => {
      window.removeEventListener("focus", loadUsage);
      window.removeEventListener("toggleSidebar", handleToggle);
    };
  }, [loadUsage]);

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (
        !mod &&
        !e.altKey &&
        e.key.toLowerCase() === "f" &&
        !isTyping(e.target)
      ) {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isCollapsed = collapsed && !mobileOpen;

  const pct = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        usage.percentage ??
          (usage.limit ? (usage.count / usage.limit) * 100 : 0),
      ),
    ),
  );
  const tone =
    pct >= 100
      ? { bar: "bg-red-500", stroke: "stroke-red-500", text: "text-red-500" }
      : pct >= 80
        ? {
            bar: "bg-amber-400",
            stroke: "stroke-amber-400",
            text: "text-amber-400",
          }
        : {
            bar: "bg-foreground",
            stroke: "stroke-foreground",
            text: "text-muted-foreground",
          };
  const remaining = Math.max(0, (usage.limit || 0) - (usage.count || 0));
  const usageNote =
    pct >= 100
      ? "Limit reached. Upgrade to keep running."
      : pct >= 80
        ? "Nearly at your limit."
        : `${remaining.toLocaleString()} tasks left`;

  const isActive = (item) =>
    item.match.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <>
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-background/80 z-[40] backdrop-blur-sm animate-in fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Changed h-screen to h-[100dvh] pb-safe area constraints */}
      <aside
        className={`fixed md:relative top-0 bottom-0 left-0 z-[50] ${isCollapsed ? "w-[60px]" : "w-64"} h-[100dvh] bg-background border-r border-border flex flex-col shrink-0 transition-[width,transform] duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Workspace */}
        <div
          className={`h-14 flex items-center shrink-0 ${isCollapsed ? "justify-center px-0" : "px-3"} mt-2`}
        >
          <Link
            to="/home"
            className="flex items-center gap-2.5 w-full hover:bg-accent/50 p-1.5 rounded-md transition-colors overflow-hidden whitespace-nowrap"
          >
            <div
              className={`w-6 h-6 overflow-hidden  shrink-0 ${isCollapsed ? "mx-auto" : ""}`}
            >
              <img
                src={Logo}
                alt="Orkflo"
                className="w-full h-full object-cover"
              />
            </div>
            {!isCollapsed && (
              <>
                <span className="text-[14px] font-medium text-foreground tracking-tight truncate">
                  Orkflo Inc.
                </span>
                <Badge
                  variant="secondary"
                  className="bg-accent text-foreground hover:bg-accent px-1.5 py-0 text-[10px] rounded-full ml-auto"
                >
                  {usage.plan || "Pro"}
                </Badge>
                <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </>
            )}
          </Link>
        </div>

        {/* Find */}
        <div
          className={`shrink-0 ${isCollapsed ? "px-0 py-2 flex justify-center" : "px-3 py-2"}`}
        >
          {isCollapsed ? (
            <button
              onClick={() => setPaletteOpen(true)}
              title="Find (F)"
              className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setPaletteOpen(true)}
              className="group w-full h-8 rounded-md border border-border bg-background pl-2.5 pr-2 flex items-center gap-2 text-[13px] text-muted-foreground hover:border-foreground/25 hover:bg-accent/30 transition-colors"
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1 text-left">Find</span>
              <kbd className="inline-flex h-4 items-center rounded bg-accent px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                F
              </kbd>
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 custom-scrollbar">
          {NAV_ITEMS.map((item, i) => {
            const active = isActive(item);
            return (
              <div key={item.to}>
                {i === 4 && <div className="h-px bg-border my-2 mx-1" />}
                <Link
                  to={item.to}
                  title={item.label}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center ${
                    isCollapsed
                      ? "justify-center w-8 h-8 mx-auto mb-1"
                      : "gap-3 px-2.5 h-8 w-full mb-0.5"
                  } rounded-md text-[13px] font-medium transition-colors duration-150 ${
                    active
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && (
                    <span className="whitespace-nowrap">{item.label}</span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Usage - Pinned firmly to the bottom with safe area padding */}
        <div className="shrink-0 w-full mt-auto pb-[env(safe-area-inset-bottom)] bg-background">
          <Link
            to="/billing"
            title={
              isCollapsed
                ? `Task usage: ${usage.count}/${usage.limit}`
                : undefined
            }
            className="block border-t border-border px-4 py-3 min-h-[72px] hover:bg-accent/30 transition-colors overflow-hidden whitespace-nowrap"
          >
            {isCollapsed ? (
              <div className="flex justify-center">
                <UsageRing pct={pct} tone={tone} />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-medium text-foreground">
                    Task usage
                  </span>
                  <span className="text-[11px] font-mono  text-muted-foreground tabular-nums">
                    {Number(usage.count || 0).toLocaleString()}/
                    {Number(usage.limit || 0).toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-accent rounded-full h-1 overflow-hidden">
                  <div
                    className={`${tone.bar} h-full rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={`text-[11px] ${tone.text}`}>{usageNote}</span>
              </div>
            )}
          </Link>
        </div>
      </aside>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
    </>
  );
}
