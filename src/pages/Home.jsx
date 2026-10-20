import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listWorkflows,
  createWorkflow,
  updateWorkflow,
  getGlobalHistory,
  getTemplates,
  useTemplate as cloneTemplate,
  saveSteps,
  getCredentials,
} from "../api/workflows";
import { INTEGRATIONS } from "../config/integrations";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  BlocksIcon,
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
import homeBanner from "../assets/home-banner.png";


/* ==========================================================================
   HERO BANNER IMAGE PLACEHOLDER
   Replace this path with your own local asset (e.g. "/images/hero-banner.webp")
   ========================================================================== */
const HERO_BANNER_IMAGE = homeBanner

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

const IconPlus = (p) => (
  <SvgIcon {...p}>
    <path d="M12 5v14M5 12h14" />
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

const IconArrowUpRight = (p) => (
  <SvgIcon {...p}>
    <path d="M7 17 17 7" />
    <path d="M7 7h10v10" />
  </SvgIcon>
);

const IconArrowRight = (p) => (
  <SvgIcon {...p}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </SvgIcon>
);

const IconChevronRight = (p) => (
  <SvgIcon {...p}>
    <path d="m9 18 6-6-6-6" />
  </SvgIcon>
);

const IconVault = (p) => (
  <SvgIcon {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 8.5V7M12 17v-1.5M8.5 12H7M17 12h-1.5" />
  </SvgIcon>
);

const IconActivity = (p) => (
  <SvgIcon {...p}>
    <path d="M22 12h-4l-3 7L9 5l-3 7H2" />
  </SvgIcon>
);

const IconCreditCard = (p) => (
  <SvgIcon {...p}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </SvgIcon>
);

const IconSparkles = (p) => (
  <SvgIcon {...p}>
    <path d="M12 3c.5 3.5 2 5 5.5 5.5-3.5.5-5 2-5.5 5.5-.5-3.5-2-5-5.5-5.5 3.5-.5 5-2 5.5-5.5Z" />
    <path d="M19 15c.3 1.8 1 2.5 2.8 2.8-1.8.3-2.5 1-2.8 2.8-.3-1.8-1-2.5-2.8-2.8 1.8-.3 2.5-1 2.8-2.8Z" />
  </SvgIcon>
);

const IconSpinner = ({ className = "w-3.5 h-3.5" }) => (
  <SvgIcon className={`${className} animate-spin`}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </SvgIcon>
);

/* ==========================================================================
   2. BUILT-IN TEMPLATES & STEP BUILDER (Synced with TemplateGallery)
   ========================================================================== */

export const BUILT_IN_TEMPLATES = [
  {
    id: "github-slack",
    name: "GitHub issue to Slack",
    description:
      "Post a message in Slack whenever a new issue is opened in a repository.",
    category: "Notifications",
    nodes: [
      {
        id: "t",
        type: "trigger",
        key: "github",
        event: "new_issue",
        config: { repo_name: "" },
      },
      {
        id: "s",
        type: "action",
        key: "slack",
        event: "send_message",
        parent: "t",
        config: {
          text: "New issue in {{trigger.repo_name}}: {{trigger.issue_title}} (by {{trigger.author}})",
        },
      },
    ],
  },
  {
    id: "sheet-discord",
    name: "Sheet row to Discord",
    description:
      "Announce every new row added to a Google Sheet in a Discord channel.",
    category: "Data",
    nodes: [
      {
        id: "t",
        type: "trigger",
        key: "google_sheets",
        event: "new_row",
        config: { spreadsheet_id: "", sheet_name: "Sheet1" },
      },
      {
        id: "d",
        type: "action",
        key: "discord",
        event: "send_message",
        parent: "t",
        config: {
          channel_id: "",
          content:
            "New row #{{trigger.row_index}}: {{trigger.col_a}} ({{trigger.col_b}})",
        },
      },
    ],
  },
  {
    id: "webhook-ai-email",
    name: "AI summary by email",
    description:
      "Send any webhook payload through Groq to get a short summary, then email it to you.",
    category: "AI",
    nodes: [
      {
        id: "t",
        type: "trigger",
        key: "webhook",
        event: "webhook_in",
        config: {},
      },
      {
        id: "ai",
        type: "action",
        key: "groq_ai",
        event: "generate_text",
        parent: "t",
        config: {
          model: "llama-3.3-70b-versatile",
          prompt: "Summarise this in two sentences: {{trigger.message}}",
        },
      },
      {
        id: "e",
        type: "action",
        key: "email",
        event: "send_email",
        parent: "ai",
        config: { to: "", subject: "Summary", body: "{{@ai.reply}}" },
      },
    ],
  },
  {
    id: "lead-router",
    name: "High-value lead router",
    description:
      "Alert Slack for leads with a budget over 5,000 and email the rest to your inbox.",
    category: "Routing",
    nodes: [
      {
        id: "t",
        type: "trigger",
        key: "webhook",
        event: "webhook_in",
        config: {},
      },
      {
        id: "c",
        type: "condition",
        parent: "t",
        config: { field: "trigger.budget", operator: ">", value: "5000" },
      },
      {
        id: "s",
        type: "action",
        key: "slack",
        event: "send_message",
        parent: "c",
        branch: "true",
        config: {
          text: "High-value lead: {{trigger.name}} (budget {{trigger.budget}})",
        },
      },
      {
        id: "e",
        type: "action",
        key: "email",
        event: "send_email",
        parent: "c",
        branch: "false",
        config: {
          to: "",
          subject: "New lead: {{trigger.name}}",
          body: "Budget: {{trigger.budget}}",
        },
      },
    ],
  },
  {
    id: "lead-notion",
    name: "Capture leads in Notion",
    description:
      "Turn every form submission or webhook into a new item in a Notion database.",
    category: "Data",
    nodes: [
      {
        id: "t",
        type: "trigger",
        key: "webhook",
        event: "webhook_in",
        config: {},
      },
      {
        id: "n",
        type: "action",
        key: "notion",
        event: "create_page",
        parent: "t",
        config: {
          database_id: "",
          title: "New lead: {{trigger.name}}",
          content: "Email: {{trigger.email}}",
        },
      },
    ],
  },
  {
    id: "scheduled-ping",
    name: "Scheduled API check",
    description: "Call an API every 15 minutes and post the response to Slack.",
    category: "Monitoring",
    nodes: [
      {
        id: "t",
        type: "trigger",
        key: "schedule",
        event: "schedule_run",
        config: { interval: "15" },
      },
      {
        id: "h",
        type: "action",
        key: "http",
        event: "custom_request",
        parent: "t",
        config: { method: "GET", url: "" },
      },
      {
        id: "s",
        type: "action",
        key: "slack",
        event: "send_message",
        parent: "h",
        config: { text: "API response: {{@h}}" },
      },
    ],
  },
];

export function buildTemplateSteps(tpl) {
  const stamp = Date.now();
  const ids = Object.fromEntries(
    tpl.nodes.map((n, i) => [n.id, `n${stamp}_${i}`]),
  );
  const depth = {};
  const getDepth = (n) => {
    if (depth[n.id] == null) {
      depth[n.id] = n.parent
        ? getDepth(tpl.nodes.find((x) => x.id === n.parent)) + 1
        : 0;
    }
    return depth[n.id];
  };
  const cols = {};
  tpl.nodes.forEach((n) => {
    (cols[getDepth(n)] = cols[getDepth(n)] || []).push(n.id);
  });
  const sub = (v) =>
    typeof v === "string"
      ? v.replace(
          /\{\{@(\w+)(\.\w+)?\}\}/g,
          (_, k, p = "") => `{{${ids[k]}${p}}}`,
        )
      : v;

  return tpl.nodes.map((n, i) => {
    const d = depth[n.id];
    const col = cols[d];
    const row = col.indexOf(n.id);
    const config = Object.fromEntries(
      Object.entries(n.config || {}).map(([k, v]) => [k, sub(v)]),
    );
    return {
      client_id: ids[n.id],
      step_type: n.type,
      action_key: n.key || "",
      app_event: n.event || "",
      config: {
        ...config,
        ui_pos: { x: d * 380, y: (row - (col.length - 1) / 2) * 210 },
      },
      order: i,
      parent_client_id: n.parent ? ids[n.parent] : null,
      branch: n.branch || "",
    };
  });
}

/* ==========================================================================
   3. HELPERS & ICON MAPPINGS
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

const resolveGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 5) return "Late night session";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const resolveUsername = () => {
  try {
    const direct =
      localStorage.getItem("username") ||
      localStorage.getItem("orkflo_username");
    if (direct) return direct;
    const rawUser = localStorage.getItem("user");
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      if (parsed?.username) return parsed.username;
      if (parsed?.name) return parsed.name;
    }
  } catch {
    // ignore storage errors
  }
  return "";
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
  condition: <BlocksIcon className={`${ICON_CLS} text-foreground`} />,
};

const iconFor = (key) =>
  INTEGRATION_ICONS[key] || (
    <WorkflowIcon className={`${ICON_CLS} text-muted-foreground`} />
  );

const NO_VAULT = ["http", "webhook", "schedule", "email"];
const BUILTIN_NAMES = {
  webhook: "Webhook",
  schedule: "Schedule",
  http: "HTTP",
  condition: "Router",
};
const nameOf = (k) => BUILTIN_NAMES[k] || INTEGRATIONS[k]?.name || k;

function normaliseTemplate(t, source) {
  const list =
    source === "built-in"
      ? t.nodes.map((n) => ({
          key: n.type === "condition" ? "condition" : n.key,
        }))
      : (t.steps || []).map((s) => ({
          key: s.step_type === "condition" ? "condition" : s.action_key,
        }));
  const keys = list.map((x) => x.key).filter(Boolean);
  return {
    ...t,
    source,
    keys,
    apps: [...new Set(keys.filter((k) => k !== "condition"))],
  };
}

const RUN_STATE = {
  success: {
    label: "Succeeded",
    dot: "bg-status-success",
    text: "text-status-success",
  },
  failed: {
    label: "Failed",
    dot: "bg-status-danger",
    text: "text-status-danger",
  },
  running: {
    label: "Running",
    dot: "bg-foreground animate-pulse",
    text: "text-foreground",
  },
  pending: {
    label: "Queued",
    dot: "bg-muted-foreground animate-pulse",
    text: "text-muted-foreground",
  },
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

/* ==========================================================================
   4. SUB-COMPONENTS
   ========================================================================== */

function QuickRedirectCard({ title, subtitle, badge, icon, art, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col justify-between overflow-hidden rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-foreground/40 hover:bg-surface-hover/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
    >
      <div className="pointer-events-none absolute -right-2 -bottom-2 opacity-25 transition-opacity group-hover:opacity-55">
        {art}
      </div>

      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground">
          {icon}
        </div>
        <div className="flex items-center gap-1.5">
          {badge && (
            <span className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {badge}
            </span>
          )}
          <IconArrowUpRight className="w-3.5 h-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-0.5 pr-6">
        <span className="text-[13px] font-medium text-foreground">{title}</span>
        <span className="text-[12px] text-muted-foreground line-clamp-1">
          {subtitle}
        </span>
      </div>
    </button>
  );
}

function TelemetryChart({ dailyBuckets }) {
  const maxVal = Math.max(1, ...dailyBuckets.map((d) => d.total));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-muted-foreground">
          7-day execution volume
        </span>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-xs bg-foreground" /> Succeeded
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-xs bg-status-danger" /> Failed
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 items-end h-16 pt-2">
        {dailyBuckets.map((b) => {
          const okH = Math.round((b.ok / maxVal) * 44);
          const failH = Math.round((b.fail / maxVal) * 44);
          return (
            <div
              key={b.label}
              title={`${b.label}: ${b.ok} succeeded, ${b.fail} failed`}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="w-full h-11 rounded-xs bg-muted/60 flex flex-col justify-end overflow-hidden p-0.5 gap-0.5">
                {b.fail > 0 && (
                  <div
                    style={{ height: `${Math.max(4, failH)}px` }}
                    className="w-full rounded-xs bg-status-danger transition-all"
                  />
                )}
                {b.ok > 0 ? (
                  <div
                    style={{ height: `${Math.max(4, okH)}px` }}
                    className="w-full rounded-xs bg-foreground transition-all"
                  />
                ) : (
                  b.fail === 0 && (
                    <div className="w-full h-1 rounded-xs bg-border" />
                  )
                )}
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                {b.dayShort}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RadialHealthGauge({ percentage }) {
  const num = typeof percentage === "number" ? percentage : 100;
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (num / 100) * c;

  return (
    <svg viewBox="0 0 44 44" className="w-11 h-11 shrink-0 -rotate-90">
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke="var(--muted)"
        strokeWidth="3.5"
      />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke="var(--status-success)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
      />
    </svg>
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
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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

/* ==========================================================================
   5. HOME COMMAND CENTER COMPONENT
   ========================================================================== */

export default function Home() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [history, setHistory] = useState([]);
  const [remoteTemplates, setRemoteTemplates] = useState([]);
  const [vaultKeys, setVaultKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  const [templateCategory, setTemplateCategory] = useState("All");
  const [deployingTemplateId, setDeployingTemplateId] = useState(null);
  const [templateError, setTemplateError] = useState("");
  const [bannerImgFailed, setBannerImgFailed] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [newWfName, setNewWfName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [now] = useState(() => Date.now());
  const username = useMemo(() => resolveUsername(), []);
  const greeting = useMemo(() => resolveGreeting(), []);

  useEffect(() => {
    Promise.all([
      listWorkflows().catch(() => []),
      getGlobalHistory().catch(() => []),
      getTemplates().catch(() => []),
      getCredentials().catch(() => []),
    ])
      .then(([wfs, runs, tpls, creds]) => {
        setWorkflows(Array.isArray(wfs) ? wfs : []);
        setHistory(Array.isArray(runs) ? runs : []);
        setRemoteTemplates(Array.isArray(tpls) ? tpls : []);
        setVaultKeys(Array.isArray(creds) ? creds : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const workflowById = useMemo(() => {
    const map = {};
    workflows.forEach((w) => {
      map[w.id] = w;
    });
    return map;
  }, [workflows]);

  const lastRunByWorkflow = useMemo(() => {
    const map = {};
    history.forEach((r) => {
      const cur = map[r.workflow];
      if (!cur || new Date(r.started_at) > new Date(cur.started_at)) {
        map[r.workflow] = r;
      }
    });
    return map;
  }, [history]);

  /* KPIs & 7-Day Telemetry */
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
    const rateNum = done.length ? Math.round((ok / done.length) * 100) : null;

    const buckets = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayKey = d.toISOString().slice(0, 10);
      const dayShort = d.toLocaleDateString("en-US", { weekday: "short" });
      buckets.push({
        key: dayKey,
        label: dayKey,
        dayShort: dayShort.slice(0, 2),
        ok: 0,
        fail: 0,
        total: 0,
      });
    }
    const bucketMap = Object.fromEntries(buckets.map((b) => [b.key, b]));
    history.forEach((r) => {
      if (!r.started_at) return;
      const k = new Date(r.started_at).toISOString().slice(0, 10);
      const b = bucketMap[k];
      if (!b) return;
      const st = String(r.status).toLowerCase();
      if (st === "failed") b.fail += 1;
      else b.ok += 1;
      b.total += 1;
    });

    return {
      total: workflows.length,
      active,
      paused: workflows.length - active,
      runs24,
      rateNum,
      rate: rateNum !== null ? `${rateNum}%` : "—",
      buckets,
    };
  }, [workflows, history, now]);

  /* All Templates (Built-in + Backend Library) */
  const allTemplates = useMemo(
    () => [
      ...BUILT_IN_TEMPLATES.map((t) => normaliseTemplate(t, "built-in")),
      ...remoteTemplates.map((t) => normaliseTemplate(t, "library")),
    ],
    [remoteTemplates],
  );

  const templateCategories = useMemo(
    () => [
      "All",
      ...new Set(allTemplates.map((t) => t.category).filter(Boolean)),
    ],
    [allTemplates],
  );

  const visibleTemplates = useMemo(() => {
    const filtered =
      templateCategory === "All"
        ? allTemplates
        : allTemplates.filter((t) => t.category === templateCategory);
    return filtered.slice(0, 4);
  }, [allTemplates, templateCategory]);

  const missingFor = (t) =>
    t.apps.filter((a) => !NO_VAULT.includes(a) && !vaultKeys.includes(a));

  /* Recent Workflows (Top 5 sorted by latest run or creation) */
  const recentWorkflows = useMemo(() => {
    return [...workflows]
      .sort((a, b) => {
        const ta = lastRunByWorkflow[a.id]
          ? new Date(lastRunByWorkflow[a.id].started_at).getTime()
          : new Date(a.created_at || 0).getTime();
        const tb = lastRunByWorkflow[b.id]
          ? new Date(lastRunByWorkflow[b.id].started_at).getTime()
          : new Date(b.created_at || 0).getTime();
        return tb - ta;
      })
      .slice(0, 5);
  }, [workflows, lastRunByWorkflow]);

  /* Active Connectors Footprint */
  const activeIntegrationSummary = useMemo(() => {
    const counts = {};
    workflows.forEach((wf) => {
      (wf.steps || []).forEach((s) => {
        if (s.action_key) {
          counts[s.action_key] = (counts[s.action_key] || 0) + 1;
        }
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [workflows]);

  /* Deploy Template (Builds steps & redirects to Editor) */
  const handleUseTemplate = async (t) => {
    if (deployingTemplateId) return;
    setDeployingTemplateId(t.id);
    setTemplateError("");
    try {
      let wf;
      if (t.source === "built-in") {
        wf = await createWorkflow(t.name);
        await saveSteps(wf.id, buildTemplateSteps(t));
      } else {
        wf = await cloneTemplate({ name: t.name, steps: t.steps });
      }
      navigate(`/workflows/${wf.id}`);
    } catch (err) {
      setTemplateError(
        err?.response?.status === 403
          ? "Free plan limit reached. Upgrade in Billing to create more workflows."
          : "Couldn't create workflow from template. Please try again.",
      );
      setDeployingTemplateId(null);
    }
  };

  /* Toggle Active Status Inline */
  const toggleWorkflowActive = async (wf) => {
    const next = !(wf.is_active !== false);
    try {
      await updateWorkflow(wf.id, { is_active: next });
      setWorkflows((prev) =>
        prev.map((w) => (w.id === wf.id ? { ...w, is_active: next } : w)),
      );
    } catch (e) {
      console.error("Failed to toggle workflow", e);
    }
  };

  /* Create Blank Workflow Modal Submit */
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newWfName.trim()) return;
    setCreateError("");
    setIsCreating(true);
    try {
      const wf = await createWorkflow(newWfName.trim());
      navigate(`/workflows/${wf.id}`);
    } catch (err) {
      if (err?.response?.status === 403) {
        setCreateError(
          "Free plan limit reached. Upgrade to create more pipelines.",
        );
      } else {
        setCreateError("An error occurred. Please try again.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="flex-1 h-full overflow-y-auto px-4 py-6 sm:px-6 md:px-8 bg-background text-foreground custom-scrollbar">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6 pb-20">
        {/* ================================================================
            SECTION 1: HERO BANNER WITH RIGHT IMAGE & LEFT GRADIENT FADE
           ================================================================ */}
        <section className="relative overflow-hidden rounded-xl border border-border bg-card min-h-[208px] flex items-center">
          {/* Right-side Background Image Placeholder (Fades Left, Visible Right) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-full sm:w-[68%] lg:w-[58%] overflow-hidden select-none"
          >
            {!bannerImgFailed && HERO_BANNER_IMAGE ? (
              <img
                src={HERO_BANNER_IMAGE}
                alt=""
                onError={() => setBannerImgFailed(true)}
                className="h-full w-full object-cover object-center opacity-35 dark:opacity-30"
              />
            ) : (
              /* Fallback architectural grid texture if image URL is empty */
              <div
                className="h-full w-full opacity-40"
                style={{
                  backgroundImage:
                    "radial-gradient(var(--foreground) 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                }}
              />
            )}

            {/* Smooth Left-to-Right Fade Mask + Top/Bottom Vignette */}
            <div className="absolute inset-0 bg-gradient-to-r from-card via-card/85 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-card/60 via-transparent to-card/30" />
          </div>

          {/* Left Foreground Content */}
          <div className="relative z-10 w-full p-5 sm:p-7 flex flex-col gap-4 max-w-[640px]">
            <div className="inline-flex items-center gap-2 w-fit rounded-full border border-border bg-background/80 backdrop-blur-xs px-2.5 py-1 text-[11px] font-mono text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
              <span>
                {stats.active > 0
                  ? `${stats.active} active ${
                      stats.active === 1 ? "pipeline" : "pipelines"
                    } listening`
                  : "Engine online · Ready for triggers"}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                {greeting}
                {username ? `, ${username}` : ""}
              </h1>
              <p className="text-[13px] sm:text-[14px] text-muted-foreground leading-relaxed">
                {workflows.length === 0
                  ? "Start your first automation from scratch, deploy a ready-made template in one click, or connect your credentials in the encrypted vault."
                  : `Your workflows executed ${stats.runs24} ${
                      stats.runs24 === 1 ? "time" : "times"
                    } in the last 24 hours with a ${
                      stats.rate === "—" ? "100%" : stats.rate
                    } completion rate.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Button
                onClick={() => {
                  setCreateError("");
                  setNewWfName("");
                  setCreateOpen(true);
                }}
                className="h-9 px-3.5 text-[13px] font-medium gap-1.5 cursor-pointer"
              >
                <IconPlus className="w-4 h-4" /> New workflow
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/templates")}
                className="h-9 px-3.5 text-[13px] font-medium gap-1.5 bg-background/80 backdrop-blur-xs cursor-pointer"
              >
                <IconSparkles className="w-4 h-4" /> Browse templates
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate("/workflows")}
                className="h-9 px-3 text-[13px] text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
              >
                All workflows ({stats.total})
                <IconArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 2: QUICK-REDIRECT NAVIGATION CARDS (WITH SVG ART)
           ================================================================ */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickRedirectCard
            title="Manage workflows"
            subtitle="Search, filter & bulk control"
            badge={`${stats.total} total`}
            icon={<IconBranch className="w-4 h-4" />}
            onClick={() => navigate("/workflows")}
            art={
              <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20">
                <circle
                  cx="24"
                  cy="56"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle
                  cx="56"
                  cy="24"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M30 50 50 30"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            }
          />

          <QuickRedirectCard
            title="Integrations Vault"
            subtitle="OAuth & encrypted API keys"
            badge={`${vaultKeys.length} connected`}
            icon={<IconVault className="w-4 h-4" />}
            onClick={() => navigate("/integrations")}
            art={
              <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20">
                <rect
                  x="20"
                  y="20"
                  width="44"
                  height="44"
                  rx="10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle
                  cx="42"
                  cy="42"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            }
          />

          <QuickRedirectCard
            title="Run history"
            subtitle="Inspect payloads & step logs"
            badge={`${history.length} runs`}
            icon={<IconActivity className="w-4 h-4" />}
            onClick={() => navigate("/history")}
            art={
              <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20">
                <path
                  d="M12 52h16l8-20 12 30 8-16h14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
          />

          <QuickRedirectCard
            title="Billing & usage"
            subtitle="Manage plan & task quota"
            badge="Quota"
            icon={<IconCreditCard className="w-4 h-4" />}
            onClick={() => navigate("/billing")}
            art={
              <svg viewBox="0 0 80 80" fill="none" className="w-20 h-20">
                <circle
                  cx="44"
                  cy="44"
                  r="22"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                />
                <path
                  d="M44 32v12l8 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            }
          />
        </section>

        {/* ================================================================
            SECTION 3: CLICKABLE KPI STRIP & 7-DAY SPARKLINE OVERVIEW
           ================================================================ */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-4 rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
            <button
              type="button"
              onClick={() => navigate("/workflows")}
              className="flex flex-col justify-between pr-2 text-left group cursor-pointer"
            >
              <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">
                Total workflows
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-foreground tabular-nums">
                  {stats.total}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/workflows?filter=active")}
              className="flex flex-col justify-between pt-3 sm:pt-0 sm:px-4 text-left group cursor-pointer"
            >
              <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">
                Active
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-foreground tabular-nums">
                  {stats.active}
                </span>
                {stats.paused > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    {stats.paused} paused
                  </span>
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/history")}
              className="flex flex-col justify-between pt-3 sm:pt-0 sm:px-4 text-left group cursor-pointer"
            >
              <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">
                Runs (24h)
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-foreground tabular-nums">
                  {stats.runs24}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/history")}
              className="flex items-center justify-between pt-3 sm:pt-0 sm:pl-4 text-left group cursor-pointer"
            >
              <div className="flex flex-col justify-between h-full">
                <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">
                  Success rate
                </span>
                <span className="mt-2 text-2xl font-semibold text-foreground tabular-nums">
                  {stats.rate}
                </span>
              </div>
              <RadialHealthGauge percentage={stats.rateNum ?? 100} />
            </button>
          </div>

          <div className="border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-5">
            <TelemetryChart dailyBuckets={stats.buckets} />
          </div>
        </section>

        {/* ================================================================
            SECTION 4: QUICK-START TEMPLATES (WIRED TO REAL TEMPLATE BUILDER)
           ================================================================ */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[13px] font-medium text-foreground">
                Quick-start templates
              </h2>
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                1-click deploy
              </span>
              <button
                type="button"
                onClick={() => navigate("/templates")}
                className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors ml-1 cursor-pointer"
              >
                View all ({allTemplates.length})
                <IconArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="inline-flex items-center rounded-md border border-border p-0.5 bg-background w-fit overflow-x-auto max-w-full">
              {templateCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setTemplateCategory(cat)}
                  className={`h-6 px-2.5 rounded text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    templateCategory === cat
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {templateError && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-status-danger/30 bg-status-danger/5 px-3.5 py-2 text-[12.5px] text-status-danger">
              <span>{templateError}</span>
              <Button
                variant="outline"
                onClick={() => navigate("/billing")}
                className="h-7 px-2.5 text-[11.5px]"
              >
                Upgrade plan
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {visibleTemplates.map((tpl) => {
              const isBusy = deployingTemplateId === tpl.id;
              const missing = missingFor(tpl);
              return (
                <div
                  key={`${tpl.source}-${tpl.id}`}
                  className="flex flex-col justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/30"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      {/* Step chain preview */}
                      <div className="flex items-center gap-1 overflow-hidden">
                        {tpl.keys.map((k, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            {idx > 0 && (
                              <IconChevronRight className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                            )}
                            <span
                              title={nameOf(k)}
                              className="w-7 h-7 rounded-md border border-border bg-background flex items-center justify-center shrink-0"
                            >
                              {iconFor(k)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {tpl.category && (
                        <span className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground shrink-0">
                          {tpl.category}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <h3 className="text-[13px] font-medium text-foreground truncate">
                        {tpl.name}
                      </h3>
                      <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2">
                        {tpl.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-mono truncate ${
                        missing.length
                          ? "text-amber-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {missing.length
                        ? `Needs ${missing.map(nameOf).join(", ")}`
                        : `${tpl.keys.length} steps`}
                    </span>

                    <button
                      type="button"
                      disabled={!!deployingTemplateId}
                      onClick={() => handleUseTemplate(tpl)}
                      className="inline-flex h-7 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      {isBusy ? (
                        <>
                          <IconSpinner className="w-3 h-3" /> Creating
                        </>
                      ) : (
                        <>
                          Use template
                          <IconArrowUpRight className="w-3 h-3 text-muted-foreground" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================================================================
            SECTION 5: RECENT WORKFLOWS PREVIEW + LIVE ACTIVITY RAIL
           ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          {/* Left Column: Recent Workflows Preview */}
          <section className="flex flex-col gap-3 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-[13px] font-medium text-foreground">
                  Recent workflows
                </h2>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {workflows.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate("/workflows")}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Open full workflow manager
                <IconArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
              {loading ? (
                <div className="divide-y divide-border">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-4 py-3.5 animate-pulse"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-muted" />
                        <div className="flex flex-col gap-1.5">
                          <div className="h-3 w-36 rounded bg-muted" />
                          <div className="h-2.5 w-24 rounded bg-muted" />
                        </div>
                      </div>
                      <div className="h-5 w-9 rounded-full bg-muted" />
                    </div>
                  ))}
                </div>
              ) : recentWorkflows.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center gap-2.5 py-12 px-6">
                  <p className="text-[13.5px] font-medium text-foreground">
                    No workflows created yet
                  </p>
                  <p className="text-[12.5px] text-muted-foreground max-w-[36ch]">
                    Create a blank workflow or pick a quick-start template above
                    to wire up your first trigger.
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      onClick={() => setCreateOpen(true)}
                      className="h-8 px-3 text-[12px] gap-1.5 cursor-pointer"
                    >
                      <IconPlus className="w-3.5 h-3.5" /> New workflow
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/templates")}
                      className="h-8 px-3 text-[12px] cursor-pointer"
                    >
                      Explore templates
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentWorkflows.map((wf) => {
                    const trig = triggerOf(wf);
                    const active = wf.is_active !== false;
                    const lastRun = lastRunByWorkflow[wf.id];
                    const run = lastRun
                      ? RUN_STATE[String(lastRun.status).toLowerCase()]
                      : null;
                    const keys = appKeys(wf);

                    return (
                      <div
                        key={wf.id}
                        onClick={() => navigate(`/workflows/${wf.id}`)}
                        className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 shrink-0 rounded-md border border-border bg-background flex items-center justify-center">
                            {iconFor(trig?.action_key || "webhook")}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-medium text-foreground truncate">
                              {wf.name}
                            </span>
                            <span className="text-[11.5px] text-muted-foreground truncate">
                              {triggerLabel(trig)} · {wf.steps?.length || 0}{" "}
                              {(wf.steps?.length || 0) === 1 ? "step" : "steps"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          {/* Action Icons */}
                          {keys.length > 0 && (
                            <div className="hidden sm:flex items-center -space-x-1.5">
                              {keys.slice(0, 3).map((k) => (
                                <span
                                  key={k}
                                  title={nameOf(k)}
                                  className="w-6 h-6 rounded-md bg-background border border-border ring-2 ring-card flex items-center justify-center"
                                >
                                  {iconFor(k)}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Last Run Status */}
                          <div className="hidden md:flex items-center gap-1.5 text-[12px] text-muted-foreground min-w-[110px]">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                run ? run.dot : "bg-muted-foreground/40"
                              }`}
                            />
                            <span className="truncate">
                              {run
                                ? `${run.label} ${relTime(lastRun.started_at)}`
                                : "Never run"}
                            </span>
                          </div>

                          {/* Active Switch */}
                          <Toggle
                            checked={active}
                            onChange={() => toggleWorkflowActive(wf)}
                            label={
                              active ? "Pause workflow" : "Resume workflow"
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {workflows.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/40 text-[12px] text-muted-foreground">
                  <span>
                    Showing {recentWorkflows.length} of {workflows.length}{" "}
                    workflows
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate("/workflows")}
                    className="font-medium text-foreground hover:underline cursor-pointer"
                  >
                    View all in Workflows →
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Right Column: Recent Executions + Active Connectors */}
          <aside className="flex flex-col gap-4">
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <IconActivity className="w-3.5 h-3.5 text-muted-foreground" />
                  <h3 className="text-[13px] font-medium text-foreground">
                    Recent executions
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/history")}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  View all
                </button>
              </div>

              {history.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-[12px] text-muted-foreground">
                    No workflow runs recorded yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {history.slice(0, 5).map((runItem) => {
                    const st =
                      RUN_STATE[String(runItem.status).toLowerCase()] ||
                      RUN_STATE.pending;
                    const wfObj = workflowById[runItem.workflow];
                    const wfName =
                      runItem.workflow_name ||
                      wfObj?.name ||
                      `Workflow ${String(runItem.workflow).slice(0, 6)}`;
                    return (
                      <button
                        key={runItem.id}
                        type="button"
                        onClick={() =>
                          navigate(
                            runItem.workflow
                              ? `/workflows/${runItem.workflow}`
                              : "/history",
                          )
                        }
                        className="w-full px-4 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-muted/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[12.5px] font-medium text-foreground truncate">
                              {wfName}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {st.label}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                          {relTime(runItem.started_at)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active Apps Footprint Card */}
            <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-medium text-foreground">
                  Active connectors
                </h3>
                <button
                  type="button"
                  onClick={() => navigate("/integrations")}
                  className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Manage vault
                </button>
              </div>

              {activeIntegrationSummary.length === 0 ? (
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Connect Discord, GitHub, Google Sheets, and Slack inside the
                  Integrations Vault.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {activeIntegrationSummary.map(([key, count]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => navigate("/integrations")}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[12px] text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      {iconFor(key)}
                      <span>{nameOf(key)}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Create Blank Workflow Modal */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setCreateOpen(false)}
        >
          <Card
            className="w-full max-w-md p-5 shadow-2xl border border-border bg-background flex flex-col gap-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1.5">
              <h3 className="text-[15px] font-semibold text-foreground">
                New workflow
              </h3>
              <p className="text-[13px] text-muted-foreground">
                Give your workflow a name you&apos;ll recognise.
              </p>
            </div>

            {createError && (
              <div className="flex items-center justify-between gap-2">
                <Badge variant="destructive" className="rounded-md w-fit">
                  {createError}
                </Badge>
                {createError.toLowerCase().includes("upgrade") && (
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

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-5">
              <Input
                autoFocus
                placeholder="e.g. Lead sync to Notion"
                value={newWfName}
                onChange={(e) => setNewWfName(e.target.value)}
                className="h-9 text-[13px]"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="h-8 text-[13px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-8 text-[13px]"
                  disabled={isCreating || !newWfName.trim()}
                >
                  {isCreating ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </main>
  );
}
