import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  listWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  getGlobalHistory,
} from "../api/workflows";
import { INTEGRATIONS } from "../config/integrations";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  DiscordIcon,
  GithubIcon,
  FileSheetIcon,
  SlackIcon,
  RobotIcon,
  GmailIcon,
  NotionIcon,
  NetworkIcon,
  RotateCcwClockIcon,
  WorkflowIcon,
} from "../components/icons";

/* ==========================================================================
   1. PRECISION STROKED SVG ICONS (1.6px geometric stroke, currentColor)
   ========================================================================== */

const SvgIcon = ({
  children,
  className = "w-4 h-4",
  viewBox = "0 0 24 24",
}) => (
  <svg
    viewBox={viewBox}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {children}
  </svg>
);

const IconSearch = (p) => (
  <SvgIcon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </SvgIcon>
);

const IconPlus = (p) => (
  <SvgIcon {...p}>
    <path d="M12 5v14M5 12h14" />
  </SvgIcon>
);

const IconTrash = (p) => (
  <SvgIcon {...p}>
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6M14 11v6" />
  </SvgIcon>
);

const IconPencil = (p) => (
  <SvgIcon {...p}>
    <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </SvgIcon>
);

const IconMore = (p) => (
  <SvgIcon {...p}>
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="19" cy="12" r="1" fill="currentColor" />
    <circle cx="5" cy="12" r="1" fill="currentColor" />
  </SvgIcon>
);

const IconCopy = (p) => (
  <SvgIcon {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </SvgIcon>
);

const IconCheck = (p) => (
  <SvgIcon {...p}>
    <path d="M20 6 9 17l-5-5" />
  </SvgIcon>
);

const IconLink = (p) => (
  <SvgIcon {...p}>
    <path d="M9 17H7A5 5 0 0 1 7 7h2" />
    <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </SvgIcon>
);

const IconPause = (p) => (
  <SvgIcon {...p}>
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </SvgIcon>
);

const IconPlay = (p) => (
  <SvgIcon {...p}>
    <polygon points="6 3 20 12 6 21 6 3" />
  </SvgIcon>
);

const IconBranch = (p) => (
  <SvgIcon {...p}>
    <line x1="6" y1="3" x2="6" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </SvgIcon>
);

const IconArrowUp = (p) => (
  <SvgIcon {...p}>
    <path d="m5 12 7-7 7 7" />
    <path d="M12 19V5" />
  </SvgIcon>
);

const IconArrowDown = (p) => (
  <SvgIcon {...p}>
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </SvgIcon>
);

const IconChevronsUpDown = (p) => (
  <SvgIcon {...p}>
    <path d="m7 15 5 5 5-5" />
    <path d="m7 9 5-5 5 5" />
  </SvgIcon>
);

const IconClose = (p) => (
  <SvgIcon {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </SvgIcon>
);

const IconSparkles = (p) => (
  <SvgIcon {...p}>
    <path d="M12 3c.5 3.5 2 5 5.5 5.5-3.5.5-5 2-5.5 5.5-.5-3.5-2-5-5.5-5.5 3.5-.5 5-2 5.5-5.5Z" />
    <path d="M19 15c.3 1.8 1 2.5 2.8 2.8-1.8.3-2.5 1-2.8 2.8-.3-1.8-1-2.5-2.8-2.8 1.8-.3 2.5-1 2.8-2.8Z" />
  </SvgIcon>
);

function EmptyCanvasIllustration() {
  return (
    <svg
      viewBox="0 0 180 96"
      fill="none"
      className="w-40 h-auto text-foreground select-none"
      aria-hidden="true"
    >
      <rect
        x="12"
        y="26"
        width="44"
        height="44"
        rx="10"
        fill="var(--card)"
        stroke="var(--border)"
        strokeWidth="1.5"
      />
      <circle
        cx="34"
        cy="48"
        r="9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.65"
      />
      <path
        d="M56 48H124"
        stroke="var(--border)"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />
      <circle
        cx="90"
        cy="48"
        r="11"
        fill="var(--muted)"
        stroke="var(--border)"
        strokeWidth="1.5"
      />
      <path
        d="M90 44v8M86 48h8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect
        x="124"
        y="26"
        width="44"
        height="44"
        rx="10"
        fill="var(--card)"
        stroke="var(--border)"
        strokeWidth="1.5"
      />
      <path
        d="M139 48h14M146 41l7 7-7 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.65"
      />
    </svg>
  );
}

/* ==========================================================================
   2. HELPERS
   ========================================================================== */

const relTime = (value) => {
  if (!value) return "";
  const diff = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
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
    year: "numeric",
  });
};

const ICON_CLS = "w-3.5 h-3.5";
const INTEGRATION_ICONS = {
  webhook: <NetworkIcon className={`${ICON_CLS} text-foreground`} />,
  schedule: <RotateCcwClockIcon className={`${ICON_CLS} text-foreground`} />,
  http: <NetworkIcon className={`${ICON_CLS} text-blue-500`} />,
  discord: <DiscordIcon className={ICON_CLS} />,
  github: <GithubIcon className={`${ICON_CLS} text-foreground`} />,
  google_sheets: <FileSheetIcon className={ICON_CLS} />,
  slack: <SlackIcon className={ICON_CLS} />,
  groq_ai: <RobotIcon className={`${ICON_CLS} text-orange-500`} />,
  email: <GmailIcon className={ICON_CLS} />,
  gmail: <GmailIcon className={ICON_CLS} />,
  notion: <NotionIcon className={ICON_CLS} />,
};

const iconFor = (key) =>
  INTEGRATION_ICONS[key] || (
    <WorkflowIcon className={`${ICON_CLS} text-muted-foreground`} />
  );

const RUN_STATE = {
  success: { label: "Succeeded", dot: "bg-status-success" },
  failed: { label: "Failed", dot: "bg-status-danger" },
  running: { label: "Running", dot: "bg-foreground animate-pulse" },
  pending: { label: "Queued", dot: "bg-muted-foreground animate-pulse" },
};

function triggerOf(wf) {
  return wf.steps?.find((s) => s.step_type === "trigger");
}

function triggerLabel(t) {
  if (!t || !t.action_key) return "No trigger set";
  if (t.action_key === "schedule")
    return `Every ${t.config?.interval || 15} min`;
  if (t.action_key === "webhook") return "Incoming webhook";
  const integ = INTEGRATIONS[t.action_key];
  const ev = integ?.triggers?.[t.app_event]?.name;
  return ev ? `${integ.name}: ${ev}` : integ?.name || t.action_key;
}

function appKeys(wf) {
  const seen = new Set();
  (wf.steps || []).forEach((s) => {
    if (s.step_type === "action" && s.action_key) seen.add(s.action_key);
  });
  return [...seen];
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* ==========================================================================
   3. TABLE SUB-COMPONENTS
   ========================================================================== */

function Stat({ label, value, hint }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-semibold text-foreground tabular-nums">
          {value}
        </span>
        {hint && (
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        )}
      </div>
    </div>
  );
}

function IdChip({ id }) {
  const [copied, setCopied] = useState(false);
  const short = String(id).slice(0, 8);
  return (
    <button
      type="button"
      title="Copy workflow ID"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(String(id));
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="group/id inline-flex items-center gap-1.5 text-[12px] font-mono text-muted-foreground hover:text-foreground transition-colors"
    >
      {short}
      {copied ? (
        <IconCheck className="w-3 h-3 text-status-success" />
      ) : (
        <IconCopy className="w-3 h-3 opacity-0 group-hover/id:opacity-100 transition-opacity" />
      )}
    </button>
  );
}

function AppStack({ keys }) {
  if (keys.length === 0)
    return (
      <span className="text-[12px] text-muted-foreground">No actions yet</span>
    );
  const shown = keys.slice(0, 4);
  const extra = keys.length - shown.length;
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((k) => (
        <span
          key={k}
          title={INTEGRATIONS[k]?.name || k}
          className="w-6 h-6 rounded-md bg-background border border-border ring-2 ring-card flex items-center justify-center"
        >
          {iconFor(k)}
        </span>
      ))}
      {extra > 0 && (
        <span className="w-6 h-6 rounded-md bg-muted border border-border ring-2 ring-card flex items-center justify-center text-[10px] font-mono text-muted-foreground">
          +{extra}
        </span>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        checked ? "bg-primary" : "bg-input"
      }`}
    >
      <span
        className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm ring-0 transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function Checkbox({ checked, indeterminate, onChange, label }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
    />
  );
}

function SortHead({ label, active, dir, onClick, className = "" }) {
  const Icon = !active
    ? IconChevronsUpDown
    : dir === "asc"
      ? IconArrowUp
      : IconArrowDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors hover:text-foreground cursor-pointer ${
        active ? "text-foreground" : "text-muted-foreground"
      } ${className}`}
    >
      {label}
      <Icon className="w-3 h-3" />
    </button>
  );
}

function WorkflowRow({
  wf,
  lastRun,
  selected,
  onSelect,
  onOpen,
  onRename,
  onDelete,
  onToggle,
}) {
  const trig = triggerOf(wf);
  const active = wf.is_active !== false;
  const run = lastRun ? RUN_STATE[String(lastRun.status).toLowerCase()] : null;
  const steps = wf.steps?.length || 0;

  return (
    <tr
      onClick={onOpen}
      className={`group border-b border-border last:border-b-0 cursor-pointer transition-colors ${
        selected ? "bg-muted" : "hover:bg-muted/50"
      }`}
    >
      <td className="w-10 pl-4 pr-0 py-3" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selected}
          onChange={onSelect}
          label={`Select ${wf.name}`}
        />
      </td>

      <td className="px-4 py-3 min-w-[200px]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-md border border-border bg-background flex items-center justify-center">
            {iconFor(trig?.action_key || "webhook")}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-medium text-foreground truncate max-w-[280px]">
              {wf.name}
            </span>
            <IdChip id={wf.id} />
          </div>
        </div>
      </td>

      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Toggle
            checked={active}
            onChange={onToggle}
            label={active ? "Pause workflow" : "Resume workflow"}
          />
          <span className="hidden sm:inline text-[12px] text-muted-foreground">
            {active ? "On" : "Paused"}
          </span>
        </div>
      </td>

      <td className="px-4 py-3">
        <AppStack keys={appKeys(wf)} />
      </td>

      <td className="hidden lg:table-cell px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap">
        {triggerLabel(trig)}
      </td>

      <td className="hidden md:table-cell px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              run ? run.dot : "bg-muted-foreground/40"
            }`}
          />
          {run ? (
            <span>
              <span className="text-foreground">{run.label}</span>{" "}
              {relTime(lastRun.started_at)}
            </span>
          ) : (
            "Never run"
          )}
        </div>
      </td>

      <td
        className="hidden sm:table-cell px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap"
        title={wf.created_at ? `Created ${relTime(wf.created_at)}` : undefined}
      >
        <span className="inline-flex items-center gap-1.5">
          <IconBranch className="w-3.5 h-3.5" />
          {steps} {steps === 1 ? "step" : "steps"}
        </span>
      </td>

      <td
        className="w-12 pr-3 py-3 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-muted-foreground hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <IconMore className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(e) => e.stopPropagation()}
            className="w-48 text-[13px]"
          >
            <DropdownMenuItem onClick={onRename} className="cursor-pointer">
              <IconPencil className="w-4 h-4 mr-2" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggle} className="cursor-pointer">
              {active ? (
                <IconPause className="w-4 h-4 mr-2" />
              ) : (
                <IconPlay className="w-4 h-4 mr-2" />
              )}
              {active ? "Pause workflow" : "Resume workflow"}
            </DropdownMenuItem>
            {wf.webhook_url && (
              <DropdownMenuItem
                onClick={() =>
                  navigator.clipboard.writeText(`${API_BASE}${wf.webhook_url}`)
                }
                className="cursor-pointer"
              >
                <IconLink className="w-4 h-4 mr-2" /> Copy webhook URL
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={onDelete}
              className="cursor-pointer"
            >
              <IconTrash className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

function SkeletonRows() {
  return Array.from({ length: 6 }).map((_, i) => (
    <tr
      key={i}
      className="border-b border-border last:border-b-0 animate-pulse"
    >
      <td className="w-10 pl-4 py-4">
        <div className="w-4 h-4 rounded bg-muted" />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-muted" />
          <div className="flex flex-col gap-2">
            <div className="h-3 w-32 rounded bg-muted" />
            <div className="h-2.5 w-16 rounded bg-muted" />
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="h-5 w-9 rounded-full bg-muted" />
      </td>
      <td className="px-4 py-4">
        <div className="h-6 w-16 rounded bg-muted" />
      </td>
      <td className="hidden lg:table-cell px-4 py-4">
        <div className="h-2.5 w-32 rounded bg-muted" />
      </td>
      <td className="hidden md:table-cell px-4 py-4">
        <div className="h-2.5 w-24 rounded bg-muted" />
      </td>
      <td className="hidden sm:table-cell px-4 py-4">
        <div className="h-2.5 w-14 rounded bg-muted" />
      </td>
      <td className="w-12 pr-3 py-4" />
    </tr>
  ));
}

/* ==========================================================================
   4. WORKFLOW LIST PAGE
   ========================================================================== */

export default function WorkflowList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [workflows, setWorkflows] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(() => {
    const param = searchParams.get("filter");
    return param === "active" || param === "paused" ? param : "all";
  });
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [selected, setSelected] = useState(() => new Set());
  const searchRef = useRef(null);

  const [modalState, setModalState] = useState({
    type: null,
    id: null,
    name: "",
  });
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [now] = useState(() => Date.now());

  useEffect(() => {
    Promise.all([listWorkflows(), getGlobalHistory().catch(() => [])])
      .then(([wfs, runs]) => {
        setWorkflows(Array.isArray(wfs) ? wfs : []);
        setHistory(Array.isArray(runs) ? runs : []);
      })
      .finally(() => setLoading(false));
  }, []);

  /* Sync incoming URL query params from Home.jsx (?filter=active or ?new=1) */
  useEffect(() => {
    const paramFilter = searchParams.get("filter");
    if (paramFilter === "active" || paramFilter === "paused") {
      setFilter(paramFilter);
    }
    if (searchParams.get("new") === "1") {
      setModalError("");
      setInputValue("");
      setModalState({ type: "create", id: null, name: "" });
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("new");
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const lastRunByWorkflow = useMemo(() => {
    const map = {};
    history.forEach((r) => {
      const cur = map[r.workflow];
      if (!cur || new Date(r.started_at) > new Date(cur.started_at))
        map[r.workflow] = r;
    });
    return map;
  }, [history]);

  const stats = useMemo(() => {
    const active = workflows.filter((w) => w.is_active !== false).length;
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const runs24 = history.filter(
      (r) => new Date(r.started_at).getTime() > dayAgo,
    ).length;
    const done = history.filter((r) =>
      ["success", "failed"].includes(String(r.status).toLowerCase()),
    );
    const ok = done.filter(
      (r) => String(r.status).toLowerCase() === "success",
    ).length;
    return {
      total: workflows.length,
      active,
      paused: workflows.length - active,
      runs24,
      rate: done.length ? `${Math.round((ok / done.length) * 100)}%` : "—",
    };
  }, [workflows, history, now]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = workflows.filter((w) => {
      const isActive = w.is_active !== false;
      if (filter === "active" && !isActive) return false;
      if (filter === "paused" && isActive) return false;
      if (!q) return true;
      return (
        w.name.toLowerCase().includes(q) ||
        String(w.id).toLowerCase().startsWith(q)
      );
    });
    const mul = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sort.key === "lastRun") {
        const ta = lastRunByWorkflow[a.id]
          ? new Date(lastRunByWorkflow[a.id].started_at).getTime()
          : 0;
        const tb = lastRunByWorkflow[b.id]
          ? new Date(lastRunByWorkflow[b.id].started_at).getTime()
          : 0;
        return (ta - tb) * mul;
      }
      if (sort.key === "steps") {
        return ((a.steps?.length || 0) - (b.steps?.length || 0)) * mul;
      }
      return a.name.localeCompare(b.name) * mul;
    });
  }, [workflows, query, filter, sort, lastRunByWorkflow]);

  const selectedVisible = useMemo(
    () => visible.filter((w) => selected.has(w.id)),
    [visible, selected],
  );
  const allSelected =
    visible.length > 0 && selectedVisible.length === visible.length;
  const someSelected = selectedVisible.length > 0 && !allSelected;

  const toggleSort = (key) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "name" ? "asc" : "desc" },
    );

  const toggleSelect = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleSelectAll = () =>
    setSelected(allSelected ? new Set() : new Set(visible.map((w) => w.id)));

  const clearSelection = () => setSelected(new Set());

  const openCreateModal = () => {
    setModalError("");
    setInputValue("");
    setModalState({ type: "create", id: null, name: "" });
  };
  const openRenameModal = (id, name) => {
    setModalError("");
    setInputValue(name);
    setModalState({ type: "rename", id, name });
  };
  const openDeleteModal = (id, name) => {
    setModalError("");
    setModalState({ type: "delete", id, name });
  };
  const openBulkDeleteModal = () => {
    setModalError("");
    setModalState({ type: "bulk-delete", id: null, name: "" });
  };
  const closeModal = () => {
    setModalState({ type: null, id: null, name: "" });
    setInputValue("");
    setModalError("");
  };

  const toggleActive = async (wf) => {
    const next = !(wf.is_active !== false);
    try {
      await updateWorkflow(wf.id, { is_active: next });
      setWorkflows((prev) =>
        prev.map((w) => (w.id === wf.id ? { ...w, is_active: next } : w)),
      );
    } catch (e) {
      console.error("Failed to update workflow", e);
    }
  };

  const bulkSetActive = async (next) => {
    const ids = selectedVisible.map((w) => w.id);
    const results = await Promise.allSettled(
      ids.map((id) => updateWorkflow(id, { is_active: next })),
    );
    const done = new Set(
      ids.filter((_, i) => results[i].status === "fulfilled"),
    );
    setWorkflows((prev) =>
      prev.map((w) => (done.has(w.id) ? { ...w, is_active: next } : w)),
    );
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError("");
    setIsSubmitting(true);
    try {
      if (modalState.type === "create") {
        const wf = await createWorkflow(inputValue.trim());
        navigate(`/workflows/${wf.id}`);
      } else if (modalState.type === "rename") {
        if (inputValue.trim() !== "" && inputValue !== modalState.name) {
          await updateWorkflow(modalState.id, { name: inputValue.trim() });
          setWorkflows((prev) =>
            prev.map((w) =>
              w.id === modalState.id ? { ...w, name: inputValue.trim() } : w,
            ),
          );
        }
        closeModal();
      } else if (modalState.type === "delete") {
        await deleteWorkflow(modalState.id);
        setWorkflows((prev) => prev.filter((w) => w.id !== modalState.id));
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(modalState.id);
          return next;
        });
        closeModal();
      } else if (modalState.type === "bulk-delete") {
        const ids = selectedVisible.map((w) => w.id);
        const results = await Promise.allSettled(
          ids.map((id) => deleteWorkflow(id)),
        );
        const done = new Set(
          ids.filter((_, i) => results[i].status === "fulfilled"),
        );
        setWorkflows((prev) => prev.filter((w) => !done.has(w.id)));
        setSelected((prev) => {
          const next = new Set(prev);
          done.forEach((id) => next.delete(id));
          return next;
        });
        if (done.size < ids.length) {
          setModalError(
            `${ids.length - done.size} workflow(s) could not be deleted.`,
          );
        } else {
          closeModal();
        }
      }
    } catch (err) {
      if (modalState.type === "create" && err.response?.status === 403) {
        setModalError(
          "Free plan limit reached. Upgrade to create more pipelines.",
        );
      } else {
        setModalError("An error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const FILTERS = [
    { key: "all", label: "All", n: stats.total },
    { key: "active", label: "Active", n: stats.active },
    { key: "paused", label: "Paused", n: stats.paused },
  ];

  const isDeleteLike =
    modalState.type === "delete" || modalState.type === "bulk-delete";

  return (
    <main className="flex-1 h-full overflow-y-auto px-4 py-6 sm:px-6 md:px-8 bg-background text-foreground custom-scrollbar">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6 pb-20">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            <div className="relative w-full sm:max-w-[360px] group">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
              <Input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or ID"
                className="pl-9 h-9 bg-background border-border text-[13px]"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:block text-[10px] font-mono text-muted-foreground bg-muted border border-border rounded px-1.5">
                /
              </kbd>
            </div>

            <div className="inline-flex items-center rounded-md border border-border p-0.5 bg-background w-fit">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`h-7 px-2.5 rounded text-[12px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    filter === f.key
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                  <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                    {f.n}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => navigate("/templates")}
              className="h-9 px-3 text-[13px] font-medium gap-1.5 cursor-pointer"
            >
              <IconSparkles className="w-4 h-4" /> Templates
            </Button>
            <Button
              onClick={openCreateModal}
              className="h-9 px-3.5 text-[13px] font-medium gap-1.5 cursor-pointer"
            >
              <IconPlus className="w-4 h-4" /> New workflow
            </Button>
          </div>
        </div>

        {/* Overview Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 rounded-lg border border-border bg-card divide-border divide-x [&>*:nth-child(n+3)]:border-t md:[&>*:nth-child(n+3)]:border-t-0 [&>*:nth-child(3)]:border-l-0 md:[&>*:nth-child(3)]:border-l [&>*]:border-border">
          <Stat label="Workflows" value={stats.total} />
          <Stat
            label="Active"
            value={stats.active}
            hint={stats.paused ? `${stats.paused} paused` : undefined}
          />
          <Stat label="Runs, last 24h" value={stats.runs24} />
          <Stat label="Success rate" value={stats.rate} />
        </div>

        {/* Workflows Table Section */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between min-h-8">
            <h2 className="text-[13px] font-medium text-foreground">
              Workflows
              {!loading && (
                <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                  {visible.length}
                </span>
              )}
            </h2>

            {selectedVisible.length > 0 && (
              <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                <span className="text-[12px] text-muted-foreground mr-1.5">
                  {selectedVisible.length} selected
                </span>
                <Button
                  variant="outline"
                  className="h-8 px-2.5 text-[12px] gap-1.5"
                  onClick={() => bulkSetActive(false)}
                >
                  <IconPause className="w-3.5 h-3.5" /> Pause
                </Button>
                <Button
                  variant="outline"
                  className="h-8 px-2.5 text-[12px] gap-1.5"
                  onClick={() => bulkSetActive(true)}
                >
                  <IconPlay className="w-3.5 h-3.5" /> Resume
                </Button>
                <Button
                  variant="outline"
                  className="h-8 px-2.5 text-[12px] gap-1.5 text-destructive hover:text-destructive"
                  onClick={openBulkDeleteModal}
                >
                  <IconTrash className="w-3.5 h-3.5" /> Delete
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground"
                  onClick={clearSelection}
                  title="Clear selection"
                >
                  <IconClose className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {!loading && visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center gap-3 rounded-lg border border-dashed border-border bg-card/50 py-20 px-6">
              <EmptyCanvasIllustration />
              <div className="flex flex-col gap-1">
                <p className="text-[14px] font-medium text-foreground">
                  {workflows.length === 0
                    ? "No workflows yet"
                    : "No workflows match"}
                </p>
                <p className="text-[13px] text-muted-foreground max-w-[36ch]">
                  {workflows.length === 0
                    ? "Create a workflow from scratch or start from a pre-built template."
                    : "Try a different name, ID, or status filter."}
                </p>
              </div>
              {workflows.length === 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    onClick={openCreateModal}
                    className="h-9 px-3.5 text-[13px] gap-1.5 cursor-pointer"
                  >
                    <IconPlus className="w-4 h-4" /> New workflow
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/templates")}
                    className="h-9 px-3.5 text-[13px] gap-1.5 cursor-pointer"
                  >
                    <IconSparkles className="w-4 h-4" /> Browse templates
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="w-10 pl-4 pr-0 py-2.5">
                        <Checkbox
                          checked={allSelected}
                          indeterminate={someSelected}
                          onChange={toggleSelectAll}
                          label="Select all workflows"
                        />
                      </th>
                      <th className="px-4 py-2.5">
                        <SortHead
                          label="Name"
                          active={sort.key === "name"}
                          dir={sort.dir}
                          onClick={() => toggleSort("name")}
                        />
                      </th>
                      <th className="px-4 py-2.5 text-[12px] font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-2.5 text-[12px] font-medium text-muted-foreground">
                        Apps
                      </th>
                      <th className="hidden lg:table-cell px-4 py-2.5 text-[12px] font-medium text-muted-foreground">
                        Trigger
                      </th>
                      <th className="hidden md:table-cell px-4 py-2.5">
                        <SortHead
                          label="Last run"
                          active={sort.key === "lastRun"}
                          dir={sort.dir}
                          onClick={() => toggleSort("lastRun")}
                        />
                      </th>
                      <th className="hidden sm:table-cell px-4 py-2.5">
                        <SortHead
                          label="Steps"
                          active={sort.key === "steps"}
                          dir={sort.dir}
                          onClick={() => toggleSort("steps")}
                        />
                      </th>
                      <th className="w-12 pr-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <SkeletonRows />
                    ) : (
                      visible.map((wf) => (
                        <WorkflowRow
                          key={wf.id}
                          wf={wf}
                          lastRun={lastRunByWorkflow[wf.id]}
                          selected={selected.has(wf.id)}
                          onSelect={() => toggleSelect(wf.id)}
                          onOpen={() => navigate(`/workflows/${wf.id}`)}
                          onRename={() => openRenameModal(wf.id, wf.name)}
                          onDelete={() => openDeleteModal(wf.id, wf.name)}
                          onToggle={() => toggleActive(wf)}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {!loading && (
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/40 text-[12px] text-muted-foreground">
                  <span>
                    <span className="text-foreground font-medium">
                      {visible.length}
                    </span>{" "}
                    of {workflows.length}
                  </span>
                  <span className="hidden sm:inline">
                    Click a row to open the editor
                  </span>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      {modalState.type && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={closeModal}
        >
          <Card
            className="w-full max-w-md p-5 shadow-2xl border border-border bg-background flex flex-col gap-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1.5">
              <h3 className="text-[15px] font-semibold text-foreground">
                {modalState.type === "create"
                  ? "New workflow"
                  : modalState.type === "rename"
                    ? "Rename workflow"
                    : modalState.type === "bulk-delete"
                      ? "Delete workflows"
                      : "Delete workflow"}
              </h3>
              <p className="text-[13px] text-muted-foreground">
                {modalState.type === "delete"
                  ? `Delete "${modalState.name}"? This can't be undone.`
                  : modalState.type === "bulk-delete"
                    ? `Delete ${selectedVisible.length} selected ${
                        selectedVisible.length === 1 ? "workflow" : "workflows"
                      }? This can't be undone.`
                    : "Give your workflow a name you'll recognise."}
              </p>
            </div>

            {modalError && (
              <div className="flex items-center justify-between gap-2">
                <Badge variant="destructive" className="rounded-md w-fit">
                  {modalError}
                </Badge>
                {modalError.toLowerCase().includes("upgrade") && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/billing")}
                    className="h-7 px-2.5 text-[12px]"
                  >
                    Go to Billing
                  </Button>
                )}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="flex flex-col gap-5">
              {!isDeleteLike && (
                <Input
                  autoFocus
                  placeholder="e.g. Lead sync to Notion"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="h-9 text-[13px]"
                />
              )}
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={closeModal}
                  className="h-8 text-[13px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={isDeleteLike ? "destructive" : "default"}
                  className="h-8 text-[13px]"
                  disabled={
                    isSubmitting ||
                    (!isDeleteLike && !inputValue.trim()) ||
                    (modalState.type === "bulk-delete" &&
                      selectedVisible.length === 0)
                  }
                >
                  {isSubmitting
                    ? "Working..."
                    : isDeleteLike
                      ? "Delete"
                      : modalState.type === "create"
                        ? "Create"
                        : "Save"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </main>
  );
}
