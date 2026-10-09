import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../api/workflows";
import {
  Bell, CheckCheck, CheckCircle2, XCircle, Sparkles, RefreshCw, Inbox, ChevronRight, AlertTriangle
} from "lucide-react";
import { Button } from "../components/ui/button";

/* ---------- helpers ---------- */

function relTime(value) {
  const diff = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (diff < 60) return "just now";
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dayGroup(value) {
  const d = new Date(value);
  const today = new Date();
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((start(today) - start(d)) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return "Earlier";
}

const TYPE_UI = {
  run_failed: { Icon: XCircle, tone: "text-destructive", label: "Runs" },
  run_success: { Icon: CheckCircle2, tone: "text-emerald-500", label: "Runs" },
  usage_warning: { Icon: AlertTriangle, tone: "text-orange-500", label: "System" },
  integration_error: { Icon: XCircle, tone: "text-destructive", label: "System" },
  product: { Icon: Sparkles, tone: "text-blue-500", label: "Product" },
};

const TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "failed", label: "Failures" },
  { key: "product", label: "Product" },
];

/* ---------- components ---------- */

function Item({ n, onOpen }) {
  const ui = TYPE_UI[n.type] || TYPE_UI.product;
  return (
    <button
      onClick={() => onOpen(n)}
      className="group w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-accent/40 transition-colors focus-visible:bg-accent/40 outline-none"
    >
      <span className="relative mt-0.5 w-8 h-8 shrink-0 rounded-md border border-border bg-background flex items-center justify-center shadow-sm">
        <ui.Icon className={`w-4 h-4 ${ui.tone}`} />
        {!n.is_read && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-card" />}
      </span>

      <span className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="flex items-center gap-2">
          <span className={`text-[13px] truncate ${n.is_read ? "text-muted-foreground" : "text-foreground font-medium"}`}>{n.title}</span>
          {n.type === "product" && (
            <span className="text-[9px] font-bold text-blue-500 border border-blue-500/20 bg-blue-500/10 rounded px-1.5 py-0.5 shrink-0 uppercase tracking-widest">New</span>
          )}
        </span>
        <span className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2">{n.body}</span>
      </span>

      <span className="flex items-center gap-1.5 shrink-0 text-[11px] text-muted-foreground mt-0.5 font-medium">
        {relTime(n.created_at)}
        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </span>
    </button>
  );
}

/* ---------- page ---------- */

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      // Fetch merged notifications and announcements from Django
      const data = await getNotifications(false);
      setNotifications(Array.isArray(data) ? data : []);
      setError("");
    } catch {
      setError("Couldn't load notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const visible = notifications.filter((n) => {
    if (tab === "unread") return !n.is_read;
    if (tab === "failed") return n.type === "run_failed" || n.type === "integration_error";
    if (tab === "product") return n.type === "product";
    return true;
  });

  const groups = ["Today", "Yesterday", "Earlier"]
    .map((g) => [g, visible.filter((n) => dayGroup(n.created_at) === g)])
    .filter(([, items]) => items.length > 0);

  const counts = {
    all: notifications.length,
    unread: unreadCount,
    failed: notifications.filter((n) => n.type === "run_failed" || n.type === "integration_error").length,
    product: notifications.filter((n) => n.type === "product").length,
  };

  const handleOpen = async (n) => {
      // Optimistically update UI
      if (!n.is_read) {
          setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
          try {
              await markNotificationRead(n.id);
          } catch (e) {
              console.error("Failed to mark as read", e);
          }
      }

      // Check if there is a link, otherwise fallback to /history
      const target = n.link || "/history";

      // If the admin put an external link (http...), open it in a new tab
      if (target.startsWith("http://") || target.startsWith("https://")) {
          window.open(target, "_blank", "noopener,noreferrer");
      } else {
          // Otherwise, use React Router to navigate instantly within the app
          navigate(target);
      }
    };

  const handleMarkAllRead = async () => {
    // Optimistically update UI
    setNotifications(prev => prev.map(item => ({ ...item, is_read: true })));
    try {
        await markAllNotificationsRead();
    } catch (e) {
        console.error("Failed to mark all as read", e);
    }
  };

  if (loading) {
    return (
      <div className="h-full px-4 py-6 sm:px-6 md:px-8 bg-background">
        <div className="max-w-[800px] mx-auto flex flex-col gap-6 animate-pulse">
          <div className="h-8 w-44 rounded bg-accent" />
          <div className="rounded-lg border border-border divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-[72px] bg-card" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-6 sm:px-6 md:px-8 bg-background custom-scrollbar">
      <div className="max-w-[800px] mx-auto flex flex-col gap-6 pb-20">

        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Notifications</h1>
            <p className="text-[13px] text-muted-foreground">Run results, account alerts and what's new in Orkflo.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" onClick={handleMarkAllRead} disabled={unreadCount === 0} className="h-8 px-3 text-[12px] gap-1.5 font-medium border-border">
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </Button>
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              title="Refresh"
              className="w-8 h-8 rounded-md flex items-center justify-center border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-foreground" : ""}`} />
            </button>
          </div>
        </div>

        <div className="inline-flex items-center rounded-md border border-border p-0.5 bg-background w-fit overflow-x-auto max-w-full shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`h-7 px-3 rounded text-[12px] font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                tab === t.key ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              <span className="font-mono text-[10px] text-muted-foreground tabular-nums">{counts[t.key]}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-[13px] text-destructive flex items-center justify-between font-medium">
            {error}
            <button onClick={() => load(true)} className="underline underline-offset-4">Retry</button>
          </div>
        )}

        {groups.length === 0 ? (
          <div className="flex flex-col items-center text-center gap-3 rounded-xl border border-dashed border-border py-24 px-6 bg-accent/10">
            <div className="w-12 h-12 rounded-xl border border-border bg-accent flex items-center justify-center shadow-sm">
              {tab === "unread" ? <Bell className="w-5 h-5 text-muted-foreground" /> : <Inbox className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[14px] font-medium text-foreground">{tab === "unread" ? "You're all caught up" : "Nothing here yet"}</p>
              <p className="text-[13px] text-muted-foreground max-w-[36ch] leading-relaxed">
                {tab === "unread" ? "New run results and updates will show up here." : "Run a workflow and its result will appear here."}
              </p>
            </div>
          </div>
        ) : (
          groups.map(([label, items]) => (
            <section key={label} className="flex flex-col gap-2">
              <h2 className="text-[12px] font-semibold text-foreground uppercase tracking-wider">{label}</h2>
              <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden shadow-sm">
                {items.map((n) => (
                  <Item key={n.id} n={n} onOpen={handleOpen} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
