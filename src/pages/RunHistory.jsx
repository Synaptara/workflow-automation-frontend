import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGlobalHistory } from "../api/workflows";
import { INTEGRATIONS } from "../config/integrations";
import {
  Search, RefreshCw, ChevronRight, CheckCircle2, XCircle, Loader2, Copy, Check,
  ArrowUpRight, Inbox, CircleDashed,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

/* ---------- helpers ---------- */

const relTime = (value) => {
  if (!value) return "";
  const diff = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const durationMs = (start, end) => (start && end ? new Date(end) - new Date(start) : null);

const fmtDur = (ms) => {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
};

const normStatus = (s) => {
  const v = String(s || "pending").toLowerCase();
  if (v === "success" || v === "succeeded" || v === "completed") return "success";
  if (v === "failed" || v === "error") return "failed";
  if (v === "running") return "running";
  if (v === "skipped") return "skipped";
  return "pending";
};

const STATUS = {
  success: { label: "Succeeded", dot: "bg-emerald-500", text: "text-emerald-500", Icon: CheckCircle2 },
  failed: { label: "Failed", dot: "bg-red-500", text: "text-red-500", Icon: XCircle },
  running: { label: "Running", dot: "bg-amber-400 animate-pulse", text: "text-amber-400", Icon: Loader2 },
  pending: { label: "Queued", dot: "bg-amber-400 animate-pulse", text: "text-amber-400", Icon: Loader2 },
  skipped: { label: "Skipped", dot: "bg-muted-foreground/50", text: "text-muted-foreground", Icon: CircleDashed },
};

const isLive = (r) => ["running", "pending"].includes(normStatus(r.status));
const hasContent = (o) => o && (typeof o !== "object" || Object.keys(o).length > 0);

const stepName = (s) => {
  if (s.step_type === "condition") return "Router";
  if (s.step_type === "trigger") return INTEGRATIONS[s.action_key]?.name || (s.action_key === "schedule" ? "Schedule" : "Webhook trigger");
  return INTEGRATIONS[s.action_key]?.name || s.action_key || s.step_type;
};

const GRID = "grid grid-cols-[minmax(0,2.2fr)_130px_minmax(0,1.4fr)_90px_150px_90px] gap-4 items-center";
const PAGE = 25;

/* ---------- small components ---------- */

function Stat({ label, value, hint }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-semibold tracking-tight text-foreground tabular-nums">{value}</span>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

function StatusCell({ status }) {
  const c = STATUS[normStatus(status)];
  return (
    <span className="inline-flex items-center gap-2 text-[13px] text-foreground">
      <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  );
}

function StepBar({ steps }) {
  if (!steps?.length) return <span className="text-[12px] text-muted-foreground">No steps</span>;
  const ok = steps.filter((s) => normStatus(s.status) === "success").length;
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="flex items-center gap-0.5">
        {steps.slice(0, 12).map((s) => (
          <span
            key={s.id}
            className={`h-3 w-1.5 rounded-[2px] ${
              { success: "bg-emerald-500", failed: "bg-red-500", skipped: "bg-muted-foreground/30" }[normStatus(s.status)] || "bg-amber-400"
            }`}
          />
        ))}
      </div>
      <span className="text-[12px] text-muted-foreground font-mono tabular-nums">{ok}/{steps.length}</span>
    </div>
  );
}

function CopyButton({ text, label = "Copy" }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1200);
      }}
      className="inline-flex items-center gap-1.5 h-6 px-2 rounded border border-border bg-background text-[11px] text-muted-foreground hover:text-foreground transition-colors"
    >
      {done ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
      {done ? "Copied" : label}
    </button>
  );
}

function JsonBlock({ title, value, tone = "default" }) {
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return (
    <div className={`rounded-md border ${tone === "error" ? "border-red-500/25 bg-red-500/5" : "border-border bg-background"}`}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-inherit">
        <span className={`text-[11px] font-medium ${tone === "error" ? "text-red-500" : "text-muted-foreground"}`}>{title}</span>
        <CopyButton text={text} />
      </div>
      <pre className={`px-3 py-2.5 text-[12px] font-mono leading-relaxed overflow-auto max-h-64 custom-scrollbar ${tone === "error" ? "text-red-500 whitespace-pre-wrap" : "text-foreground"}`}>
        {text}
      </pre>
    </div>
  );
}

function TraceStep({ step, index, isLast }) {
  const st = normStatus(step.status);
  const c = STATUS[st];
  const [open, setOpen] = useState(st === "failed");
  const expandable = hasContent(step.output) || !!step.error;
  const dur = durationMs(step.started_at, step.finished_at);

  return (
    <div className="relative flex gap-3">
      <div className="flex flex-col items-center">
        <span className={`w-6 h-6 rounded-full border border-border bg-background flex items-center justify-center shrink-0 ${c.text}`}>
          <c.Icon className={`w-3.5 h-3.5 ${st === "running" ? "animate-spin" : ""}`} />
        </span>
        {!isLast && <span className="w-px flex-1 bg-border my-1" />}
      </div>

      <div className="flex-1 min-w-0 pb-4">
        <button
          type="button"
          disabled={!expandable}
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-3 text-left min-h-6 disabled:cursor-default"
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className="text-[13px] font-medium text-foreground truncate">{stepName(step)}</span>
            <span className="text-[11px] text-muted-foreground font-mono shrink-0">Step {index + 1}</span>
          </span>
          <span className="flex items-center gap-2 shrink-0 text-[12px] text-muted-foreground font-mono tabular-nums">
            {fmtDur(dur)}
            {expandable && <ChevronRight className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-90" : ""}`} />}
          </span>
        </button>

        {open && expandable && (
          <div className="mt-2 flex flex-col gap-2">
            {step.error && <JsonBlock title="Error" value={step.error} tone="error" />}
            {hasContent(step.output) && <JsonBlock title="Output" value={step.output} />}
          </div>
        )}
      </div>
    </div>
  );
}

function RunDetails({ run, onOpenWorkflow }) {
  const steps = run.step_runs || [];
  return (
    <div className="border-t border-border bg-card/50 px-4 py-5 md:px-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="flex flex-col gap-4 min-w-0">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[12px]">
          <Meta label="Run ID" value={<span className="font-mono">{String(run.id).slice(0, 8)}</span>} />
          <Meta label="Started" value={run.started_at ? new Date(run.started_at).toLocaleString() : "—"} />
          <Meta label="Duration" value={fmtDur(durationMs(run.started_at, run.finished_at))} />
          <Meta label="Workflow" value={run.workflow_name || run.workflow} />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-7 px-2.5 text-[12px] gap-1.5" onClick={onOpenWorkflow}>
            Open workflow <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        {hasContent(run.trigger_payload) ? (
          <JsonBlock title="Trigger payload" value={run.trigger_payload} />
        ) : (
          <p className="text-[12px] text-muted-foreground">This run had no trigger payload.</p>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-[12px] font-medium text-foreground mb-3">Trace</p>
        {steps.length > 0 ? (
          steps.map((s, i) => <TraceStep key={s.id} step={s} index={i} isLast={i === steps.length - 1} />)
        ) : (
          <p className="text-[13px] text-muted-foreground">No steps were executed.</p>
        )}
      </div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground truncate">{value}</span>
    </div>
  );
}

/* ---------- page ---------- */

export default function RunHistory() {
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [workflowFilter, setWorkflowFilter] = useState("all");
  const [limit, setLimit] = useState(PAGE);
  const [live, setLive] = useState(true);
  const [, setTick] = useState(0);

  const fetchHistory = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const data = await getGlobalHistory();
      setRuns(Array.isArray(data) ? data : []);
      setError("");
    } catch {
      setError("Couldn't load executions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const anyLive = runs.some(isLive);

  // Poll while something is running (or live mode is on); keep relative times fresh.
  useEffect(() => {
    if (!live && !anyLive) return;
    const id = setInterval(() => fetchHistory(true), anyLive ? 3000 : 10000);
    return () => clearInterval(id);
  }, [live, anyLive, fetchHistory]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
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

  const sorted = useMemo(
    () => [...runs].sort((a, b) => new Date(b.started_at) - new Date(a.started_at)),
    [runs]
  );

  const workflowsInRuns = useMemo(() => {
    const m = new Map();
    runs.forEach((r) => m.set(r.workflow, r.workflow_name || String(r.workflow)));
    return [...m.entries()];
  }, [runs]);

  const stats = useMemo(() => {
    const done = runs.filter((r) => ["success", "failed"].includes(normStatus(r.status)));
    const ok = done.filter((r) => normStatus(r.status) === "success").length;
    const durs = done.map((r) => durationMs(r.started_at, r.finished_at)).filter((d) => d != null);
    return {
      total: runs.length,
      rate: done.length ? `${Math.round((ok / done.length) * 100)}%` : "—",
      failed: runs.filter((r) => normStatus(r.status) === "failed").length,
      avg: durs.length ? fmtDur(Math.round(durs.reduce((a, b) => a + b, 0) / durs.length)) : "—",
    };
  }, [runs]);

  const counts = useMemo(() => {
    const c = { all: runs.length, success: 0, failed: 0, running: 0 };
    runs.forEach((r) => {
      const s = normStatus(r.status);
      if (s === "success") c.success++;
      else if (s === "failed") c.failed++;
      else if (s === "running" || s === "pending") c.running++;
    });
    return c;
  }, [runs]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((r) => {
      const s = normStatus(r.status);
      if (statusFilter === "success" && s !== "success") return false;
      if (statusFilter === "failed" && s !== "failed") return false;
      if (statusFilter === "running" && !(s === "running" || s === "pending")) return false;
      if (workflowFilter !== "all" && String(r.workflow) !== workflowFilter) return false;
      if (!q) return true;
      return (
        (r.workflow_name || "").toLowerCase().includes(q) ||
        String(r.id).toLowerCase().startsWith(q) ||
        String(r.trigger_payload?.event_type || "").toLowerCase().includes(q)
      );
    });
  }, [sorted, statusFilter, workflowFilter, query]);

  const shown = visible.slice(0, limit);

  const TABS = [
    { key: "all", label: "All" },
    { key: "success", label: "Succeeded" },
    { key: "failed", label: "Failed" },
    { key: "running", label: "Running" },
  ];

  if (loading) {
    return (
      <div className="h-full px-4 py-6 sm:px-6 md:px-8 bg-background">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-6 animate-pulse">
          <div className="h-8 w-40 rounded bg-accent" />
          <div className="h-[72px] rounded-lg bg-accent/60" />
          <div className="h-9 w-80 rounded bg-accent/60" />
          <div className="rounded-lg border border-border divide-y divide-border">
            {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-[52px]" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto px-4 py-6 sm:px-6 md:px-8 bg-background custom-scrollbar">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6 pb-20">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Executions</h1>
            <p className="text-[13px] text-muted-foreground">Every run across your workflows, with the full step trace.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setLive((v) => !v)}
              className={`h-8 px-2.5 rounded-md border text-[12px] font-medium flex items-center gap-2 transition-colors ${
                live ? "border-border text-foreground" : "border-border text-muted-foreground"
              } hover:bg-accent`}
              title={live ? "Auto-refresh on" : "Auto-refresh off"}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${live ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/50"}`} />
              Live
            </button>
            <button
              onClick={() => fetchHistory()}
              disabled={refreshing}
              title="Refresh"
              className="w-8 h-8 rounded-md flex items-center justify-center border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-foreground" : ""}`} />
            </button>
          </div>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 rounded-lg border border-border bg-card divide-border divide-x [&>*:nth-child(n+3)]:border-t md:[&>*:nth-child(n+3)]:border-t-0 [&>*]:border-border [&>*:nth-child(3)]:border-l-0 md:[&>*:nth-child(3)]:border-l">
          <Stat label="Total runs" value={stats.total} />
          <Stat label="Success rate" value={stats.rate} />
          <Stat label="Failed" value={stats.failed} />
          <Stat label="Avg duration" value={stats.avg} />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative w-full lg:max-w-[340px] group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }}
              placeholder="Search workflow, event or run ID"
              className="pl-9 h-9 bg-background border-border text-[13px]"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:block text-[10px] font-mono text-muted-foreground bg-accent border border-border rounded px-1.5">/</kbd>
          </div>

          <div className="inline-flex items-center rounded-md border border-border p-0.5 bg-background w-fit overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => { setStatusFilter(t.key); setLimit(PAGE); }}
                className={`h-7 px-2.5 rounded text-[12px] font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  statusFilter === t.key ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
                <span className="font-mono text-[10px] text-muted-foreground tabular-nums">{counts[t.key]}</span>
              </button>
            ))}
          </div>

          {workflowsInRuns.length > 1 && (
            <select
              value={workflowFilter}
              onChange={(e) => { setWorkflowFilter(e.target.value); setLimit(PAGE); }}
              className="h-9 rounded-md border border-border bg-background px-2.5 text-[13px] text-foreground outline-none focus:border-foreground cursor-pointer lg:ml-auto max-w-[220px]"
            >
              <option value="all">All workflows</option>
              {workflowsInRuns.map(([id, name]) => <option key={id} value={String(id)}>{name}</option>)}
            </select>
          )}
        </div>

        {error && (
          <div className="rounded-md border border-red-500/25 bg-red-500/5 px-3 py-2 text-[13px] text-red-500 flex items-center justify-between">
            {error}
            <button onClick={() => fetchHistory()} className="underline underline-offset-4">Retry</button>
          </div>
        )}

        {/* Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <div className="min-w-[880px]">
              <div className={`${GRID} px-4 py-2.5 border-b border-border text-[12px] text-muted-foreground select-none`}>
                <div>Workflow</div>
                <div>Status</div>
                <div>Trigger</div>
                <div>Duration</div>
                <div>Steps</div>
                <div className="text-right">Started</div>
              </div>

              {shown.map((r, i) => {
                const isOpen = expanded === r.id;
                const dur = durationMs(r.started_at, r.finished_at);
                return (
                  <div key={r.id} className={i !== 0 ? "border-t border-border" : ""}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpanded(isOpen ? null : r.id)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpanded(isOpen ? null : r.id); } }}
                      className={`${GRID} px-4 py-3 text-[13px] cursor-pointer outline-none transition-colors focus-visible:bg-accent/40 ${isOpen ? "bg-accent/30" : "hover:bg-accent/30"}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-foreground truncate">{r.workflow_name || r.workflow}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">{String(r.id).slice(0, 8)}</span>
                        </div>
                      </div>

                      <StatusCell status={r.status} />

                      <span className="text-muted-foreground truncate font-mono text-[12px]">
                        {r.trigger_payload?.event_type || "webhook"}
                      </span>

                      <span className="text-muted-foreground font-mono text-[12px] tabular-nums">
                        {isLive(r) ? "—" : fmtDur(dur)}
                      </span>

                      <StepBar steps={r.step_runs} />

                      <span
                        className="text-right text-muted-foreground"
                        title={r.started_at ? new Date(r.started_at).toLocaleString() : undefined}
                      >
                        {relTime(r.started_at)}
                      </span>
                    </div>

                    {isOpen && <RunDetails run={r} onOpenWorkflow={() => navigate(`/workflows/${r.workflow}`)} />}
                  </div>
                );
              })}

              {visible.length === 0 && (
                <div className="flex flex-col items-center text-center gap-3 py-16 px-6">
                  <div className="w-10 h-10 rounded-md border border-border bg-background flex items-center justify-center">
                    <Inbox className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[14px] font-medium text-foreground">
                      {runs.length === 0 ? "No executions yet" : "No executions match"}
                    </p>
                    <p className="text-[13px] text-muted-foreground max-w-[40ch]">
                      {runs.length === 0
                        ? "Runs appear here once a workflow is triggered by a webhook, a schedule or a test run."
                        : "Try a different search or filter."}
                    </p>
                  </div>
                  {runs.length > 0 && (
                    <Button
                      variant="outline"
                      className="h-8 text-[12px]"
                      onClick={() => { setQuery(""); setStatusFilter("all"); setWorkflowFilter("all"); }}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {visible.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border text-[12px] text-muted-foreground">
              <span>
                Showing <span className="text-foreground tabular-nums">{shown.length}</span> of <span className="tabular-nums">{visible.length}</span>
              </span>
              {visible.length > shown.length && (
                <Button variant="outline" className="h-7 px-3 text-[12px]" onClick={() => setLimit((l) => l + PAGE)}>
                  Load more
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
