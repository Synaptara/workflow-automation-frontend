import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../api/workflows";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  XCircle,
  Sparkles,
  RefreshCw,
  Inbox,
  ChevronRight,
  AlertTriangle,
  History,
} from "lucide-react";
import { Button } from "../components/ui/button";

/* ---------- helpers ---------- */

function relTime(value) {
  const diff = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 1000),
  );
  if (diff < 60) return "just now";
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function dayGroup(value) {
  const d = new Date(value);
  const today = new Date();
  const start = (x) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((start(today) - start(d)) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return "Earlier";
}

const TYPE_UI = {
  run_failed: { Icon: XCircle, tone: "text-destructive", label: "Runs" },
  run_success: { Icon: CheckCircle2, tone: "text-emerald-500", label: "Runs" },
  usage_warning: {
    Icon: AlertTriangle,
    tone: "text-orange-500",
    label: "System",
  },
  integration_error: {
    Icon: XCircle,
    tone: "text-destructive",
    label: "System",
  },
  product: { Icon: Sparkles, tone: "text-blue-500", label: "Product" },
};

const TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "failed", label: "Failures" },
  { key: "product", label: "Product" },
];

const isFailure = (n) =>
  n.type === "run_failed" || n.type === "integration_error";

/* ---------- components ---------- */

function Item({ n, onOpen }) {
  const ui = TYPE_UI[n.type] || TYPE_UI.product;
  return (
    <button
      onClick={() => onOpen(n)}
      className="group relative flex w-full items-start gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-accent/50 focus-visible:bg-accent/50"
    >
      {!n.is_read && (
        <span className="absolute left-1.5 top-[22px] h-1.5 w-1.5 rounded-full bg-blue-500" />
      )}

      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background shadow-sm">
        <ui.Icon className={`h-4 w-4 ${ui.tone}`} />
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <span
              className={`truncate text-[13px] ${n.is_read ? "text-muted-foreground" : "font-medium text-foreground"}`}
            >
              {n.title}
            </span>
            {n.type === "product" && (
              <span className="shrink-0 rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-blue-500">
                New
              </span>
            )}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium tabular-nums text-muted-foreground">
            {relTime(n.created_at)}
            <ChevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
          </span>
        </span>
        <span className="line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
          {n.body}
        </span>
      </span>
    </button>
  );
}

function Skeleton() {
  return (
    <div className="divide-y divide-border animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 px-4 py-3">
          <div className="h-8 w-8 rounded-md bg-accent" />
          <div className="flex flex-1 flex-col gap-2 pt-0.5">
            <div className="h-3 w-2/5 rounded bg-accent" />
            <div className="h-3 w-4/5 rounded bg-accent/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- popover panel ---------- */

export default function Notifications({ open, onClose }) {
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

  // Fetch every time the panel opens; cached list stays visible while refreshing
  useEffect(() => {
    if (open) load();
  }, [open, load]);

  if (!open) return null;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const visible = notifications.filter((n) => {
    if (tab === "unread") return !n.is_read;
    if (tab === "failed") return isFailure(n);
    if (tab === "product") return n.type === "product";
    return true;
  });

  const groups = ["Today", "Yesterday", "Earlier"]
    .map((g) => [g, visible.filter((n) => dayGroup(n.created_at) === g)])
    .filter(([, items]) => items.length > 0);

  const counts = {
    all: notifications.length,
    unread: unreadCount,
    failed: notifications.filter(isFailure).length,
    product: notifications.filter((n) => n.type === "product").length,
  };

  const handleOpen = async (n) => {
    // Optimistically update UI
    if (!n.is_read) {
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === n.id ? { ...item, is_read: true } : item,
        ),
      );
      try {
        await markNotificationRead(n.id);
      } catch (e) {
        console.error("Failed to mark as read", e);
      }
    }

    // Check if there is a link, otherwise fallback to /history
    const target = n.link || "/history";
    onClose();

    // External links open in a new tab, internal ones route instantly
    if (target.startsWith("http://") || target.startsWith("https://")) {
      window.open(target, "_blank", "noopener,noreferrer");
    } else {
      navigate(target);
    }
  };

  const handleMarkAllRead = async () => {
    // Optimistically update UI
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, is_read: true })),
    );
    try {
      await markAllNotificationsRead();
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Notifications"
      className="fixed inset-x-3 top-[3.75rem] z-50 flex max-h-[min(580px,calc(100vh-5rem))] origin-top-right flex-col overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[420px]"
    >
      {/* header */}
      <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[14px] font-semibold tracking-tight text-foreground">
            Notifications
          </h2>
          {unreadCount > 0 && (
            <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-blue-500">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            title="Mark all read"
            aria-label="Mark all read"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <CheckCheck className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            title="Refresh"
            aria-label="Refresh"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-foreground" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* tabs */}
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-3 py-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[12px] font-medium transition-colors ${
              tab === t.key
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* body */}
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        {error && (
          <div className="m-3 flex items-center justify-between rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-[13px] font-medium text-destructive">
            {error}
            <button
              onClick={() => load(true)}
              className="underline underline-offset-4"
            >
              Retry
            </button>
          </div>
        )}

        {loading && notifications.length === 0 ? (
          <Skeleton />
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-accent shadow-sm">
              {tab === "unread" ? (
                <Bell className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Inbox className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[14px] font-medium text-foreground">
                {tab === "unread" ? "You're all caught up" : "Nothing here yet"}
              </p>
              <p className="max-w-[32ch] text-[12px] leading-relaxed text-muted-foreground">
                {tab === "unread"
                  ? "New run results and updates will show up here."
                  : "Run a workflow and its result will appear here."}
              </p>
            </div>
          </div>
        ) : (
          groups.map(([label, items]) => (
            <section key={label}>
              <h3 className="sticky top-0 z-10 border-b border-border bg-popover/95 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
                {label}
              </h3>
              <div className="divide-y divide-border">
                {items.map((n) => (
                  <Item key={n.id} n={n} onOpen={handleOpen} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* footer */}
      <div className="shrink-0 border-t border-border p-1.5">
        <Button
          variant="ghost"
          onClick={() => {
            onClose();
            navigate("/history");
          }}
          className="h-8 w-full gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground"
        >
          <History className="h-3.5 w-3.5" /> View execution history
        </Button>
      </div>
    </div>
  );
}
