import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Search,
  Plus,
  Trash2,
  Pencil,
  MoreHorizontal,
  Copy,
  Check,
  Link2,
  Pause,
  Play,
  GitBranch,
  Workflow as WorkflowEmptyIcon,
} from "lucide-react";

/* ---------- helpers ---------- */

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
  success: { label: "Succeeded", dot: "bg-emerald-500" },
  failed: { label: "Failed", dot: "bg-red-500" },
  running: { label: "Running", dot: "bg-amber-400 animate-pulse" },
  pending: { label: "Queued", dot: "bg-amber-400 animate-pulse" },
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

/* ---------- small components ---------- */

function Stat({ label, value, hint }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-semibold tracking-tight text-foreground tabular-nums">
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
        <Check className="w-3 h-3 text-emerald-500" />
      ) : (
        <Copy className="w-3 h-3 opacity-0 group-hover/id:opacity-100 transition-opacity" />
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
        <span className="w-6 h-6 rounded-md bg-accent border border-border ring-2 ring-card flex items-center justify-center text-[10px] font-mono text-muted-foreground">
          +{extra}
        </span>
      )}
    </div>
  );
}

function WorkflowCard({ wf, lastRun, onOpen, onRename, onDelete, onToggle }) {
  const trig = triggerOf(wf);
  const active = wf.is_active !== false;
  const run = lastRun ? RUN_STATE[String(lastRun.status).toLowerCase()] : null;
  const steps = wf.steps?.length || 0;

  return (
    <div
      onClick={onOpen}
      className="group flex flex-col rounded-lg border border-border bg-card hover:border-foreground/30 transition-colors cursor-pointer overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 shrink-0 rounded-md border border-border bg-background flex items-center justify-center">
            {iconFor(trig?.action_key || "webhook")}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[14px] font-medium text-foreground tracking-tight truncate">
              {wf.name}
            </span>
            <IdChip id={wf.id} />
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 -mr-1.5 -mt-1 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(e) => e.stopPropagation()}
            className="w-48 text-[13px]"
          >
            <DropdownMenuItem onClick={onRename} className="cursor-pointer">
              <Pencil className="w-4 h-4 mr-2" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggle} className="cursor-pointer">
              {active ? (
                <Pause className="w-4 h-4 mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
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
                <Link2 className="w-4 h-4 mr-2" /> Copy webhook URL
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={onDelete}
              className="cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="px-4 pb-4 flex flex-col gap-3 flex-1">
        <p className="text-[12px] text-muted-foreground truncate">
          {triggerLabel(trig)}
        </p>
        <div className="flex items-center justify-between">
          <AppStack keys={appKeys(wf)} />
          {!active && (
            <span className="text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">
              Paused
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-border text-[12px] text-muted-foreground">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${run ? run.dot : "bg-muted-foreground/40"}`}
          />
          <span className="truncate">
            {run ? (
              <>
                <span className="text-foreground">{run.label}</span>{" "}
                {relTime(lastRun.started_at)}
              </>
            ) : (
              "Never run"
            )}
          </span>
        </div>
        <span
          className="flex items-center gap-1.5 shrink-0"
          title={
            wf.created_at ? `Created ${relTime(wf.created_at)}` : undefined
          }
        >
          <GitBranch className="w-3.5 h-3.5" />
          {steps} {steps === 1 ? "step" : "steps"}
        </span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-card h-[168px] p-4 animate-pulse flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-accent" />
        <div className="flex flex-col gap-2">
          <div className="h-3 w-28 rounded bg-accent" />
          <div className="h-2.5 w-16 rounded bg-accent" />
        </div>
      </div>
      <div className="h-2.5 w-40 rounded bg-accent" />
      <div className="h-6 w-24 rounded bg-accent mt-auto" />
    </div>
  );
}

/* ---------- page ---------- */

export default function WorkflowList() {
  const [workflows, setWorkflows] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
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
        setWorkflows(wfs);
        setHistory(Array.isArray(runs) ? runs : []);
      })
      .finally(() => setLoading(false));
  }, []);

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
    return workflows.filter((w) => {
      const isActive = w.is_active !== false;
      if (filter === "active" && !isActive) return false;
      if (filter === "paused" && isActive) return false;
      if (!q) return true;
      return (
        w.name.toLowerCase().includes(q) ||
        String(w.id).toLowerCase().startsWith(q)
      );
    });
  }, [workflows, query, filter]);

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
        closeModal();
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

  return (
    <main className="flex-1 h-full overflow-y-auto px-4 py-6 sm:px-6 md:px-8 bg-background custom-scrollbar">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6 pb-20">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
            <div className="relative w-full sm:max-w-[360px] group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
              <Input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or ID"
                className="pl-9 h-9 bg-background border-border text-[13px]"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:block text-[10px] font-mono text-muted-foreground bg-accent border border-border rounded px-1.5">
                /
              </kbd>
            </div>

            <div className="inline-flex items-center rounded-md border border-border p-0.5 bg-background w-fit">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`h-7 px-2.5 rounded text-[12px] font-medium transition-colors flex items-center gap-1.5 ${
                    filter === f.key
                      ? "bg-accent text-foreground"
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

          <Button
            onClick={openCreateModal}
            className="h-9 px-3.5 text-[13px] font-medium gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> New workflow
          </Button>
        </div>

        {/* Overview strip */}
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

        {/* Grid */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[13px] font-medium text-foreground">
            Workflows
            {!loading && (
              <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                {visible.length}
              </span>
            )}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center gap-3 rounded-lg border border-dashed border-border py-20 px-6">
              <div className="w-10 h-10 rounded-md border border-border bg-card flex items-center justify-center">
                <WorkflowEmptyIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[14px] font-medium text-foreground">
                  {workflows.length === 0
                    ? "No workflows yet"
                    : "No workflows match"}
                </p>
                <p className="text-[13px] text-muted-foreground max-w-[36ch]">
                  {workflows.length === 0
                    ? "Create a workflow to connect a trigger to your apps."
                    : "Try a different name, ID, or filter."}
                </p>
              </div>
              {workflows.length === 0 && (
                <Button
                  onClick={openCreateModal}
                  className="h-9 px-3.5 text-[13px] gap-1.5 mt-1"
                >
                  <Plus className="w-4 h-4" /> New workflow
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {visible.map((wf) => (
                <WorkflowCard
                  key={wf.id}
                  wf={wf}
                  lastRun={lastRunByWorkflow[wf.id]}
                  onOpen={() => navigate(`/workflows/${wf.id}`)}
                  onRename={() => openRenameModal(wf.id, wf.name)}
                  onDelete={() => openDeleteModal(wf.id, wf.name)}
                  onToggle={() => toggleActive(wf)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modals */}
      {modalState.type && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={closeModal}
        >
          <Card
            className="w-full max-w-md p-5 shadow-2xl border bg-background flex flex-col gap-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1.5">
              <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
                {modalState.type === "create"
                  ? "New workflow"
                  : modalState.type === "rename"
                    ? "Rename workflow"
                    : "Delete workflow"}
              </h3>
              <p className="text-[13px] text-muted-foreground">
                {modalState.type === "delete"
                  ? `Delete "${modalState.name}"? This can't be undone.`
                  : "Give your workflow a name you'll recognise."}
              </p>
            </div>

            {modalError && (
              <Badge variant="destructive" className="rounded-md w-fit">
                {modalError}
              </Badge>
            )}

            <form onSubmit={handleModalSubmit} className="flex flex-col gap-5">
              {modalState.type !== "delete" && (
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
                  variant={
                    modalState.type === "delete" ? "destructive" : "default"
                  }
                  className="h-8 text-[13px]"
                  disabled={
                    isSubmitting ||
                    (modalState.type !== "delete" && !inputValue.trim())
                  }
                >
                  {isSubmitting
                    ? "Working..."
                    : modalState.type === "delete"
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
