import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTemplates, useTemplate as cloneTemplate, createWorkflow, saveSteps, getCredentials } from "../api/workflows";
import { INTEGRATIONS } from "../config/integrations";
import {
  BlocksIcon, WorkflowIcon, NetworkIcon, RotateCcwClockIcon, DiscordIcon, GithubIcon,
  FileSheetIcon, SlackIcon, RobotIcon, GmailIcon, NotionIcon,
} from "../components/icons";
import { Search, ChevronRight, ArrowRight, Loader2, AlertCircle, LayoutTemplate } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

/* ---------- built-in templates ---------- */
// Use {{@id}} or {{@id.reply}} to reference another node's output; ids are swapped on creation.

const BUILT_IN = [
  {
    id: "github-slack",
    name: "GitHub issue to Slack",
    description: "Post a message in Slack whenever a new issue is opened in a repository.",
    category: "Notifications",
    nodes: [
      { id: "t", type: "trigger", key: "github", event: "new_issue", config: { repo_name: "" } },
      { id: "s", type: "action", key: "slack", event: "send_message", parent: "t", config: { text: "New issue in {{trigger.repo_name}}: {{trigger.issue_title}} (by {{trigger.author}})" } },
    ],
  },
  {
    id: "sheet-discord",
    name: "Sheet row to Discord",
    description: "Announce every new row added to a Google Sheet in a Discord channel.",
    category: "Data",
    nodes: [
      { id: "t", type: "trigger", key: "google_sheets", event: "new_row", config: { spreadsheet_id: "", sheet_name: "Sheet1" } },
      { id: "d", type: "action", key: "discord", event: "send_message", parent: "t", config: { channel_id: "", content: "New row #{{trigger.row_index}}: {{trigger.col_a}} ({{trigger.col_b}})" } },
    ],
  },
  {
    id: "webhook-ai-email",
    name: "AI summary by email",
    description: "Send any webhook payload through Groq to get a short summary, then email it to you.",
    category: "AI",
    nodes: [
      { id: "t", type: "trigger", key: "webhook", event: "webhook_in", config: {} },
      { id: "ai", type: "action", key: "groq_ai", event: "generate_text", parent: "t", config: { model: "llama-3.3-70b-versatile", prompt: "Summarise this in two sentences: {{trigger.message}}" } },
      { id: "e", type: "action", key: "email", event: "send_email", parent: "ai", config: { to: "", subject: "Summary", body: "{{@ai.reply}}" } },
    ],
  },
  {
    id: "lead-router",
    name: "High-value lead router",
    description: "Alert Slack for leads with a budget over 5,000 and email the rest to your inbox.",
    category: "Routing",
    nodes: [
      { id: "t", type: "trigger", key: "webhook", event: "webhook_in", config: {} },
      { id: "c", type: "condition", parent: "t", config: { field: "trigger.budget", operator: ">", value: "5000" } },
      { id: "s", type: "action", key: "slack", event: "send_message", parent: "c", branch: "true", config: { text: "High-value lead: {{trigger.name}} (budget {{trigger.budget}})" } },
      { id: "e", type: "action", key: "email", event: "send_email", parent: "c", branch: "false", config: { to: "", subject: "New lead: {{trigger.name}}", body: "Budget: {{trigger.budget}}" } },
    ],
  },
  {
    id: "lead-notion",
    name: "Capture leads in Notion",
    description: "Turn every form submission or webhook into a new item in a Notion database.",
    category: "Data",
    nodes: [
      { id: "t", type: "trigger", key: "webhook", event: "webhook_in", config: {} },
      { id: "n", type: "action", key: "notion", event: "create_page", parent: "t", config: { database_id: "", title: "New lead: {{trigger.name}}", content: "Email: {{trigger.email}}" } },
    ],
  },
  {
    id: "scheduled-ping",
    name: "Scheduled API check",
    description: "Call an API every 15 minutes and post the response to Slack.",
    category: "Monitoring",
    nodes: [
      { id: "t", type: "trigger", key: "schedule", event: "schedule_run", config: { interval: "15" } },
      { id: "h", type: "action", key: "http", event: "custom_request", parent: "t", config: { method: "GET", url: "" } },
      { id: "s", type: "action", key: "slack", event: "send_message", parent: "h", config: { text: "API response: {{@h}}" } },
    ],
  },
];

function buildSteps(tpl) {
  const stamp = Date.now();
  const ids = Object.fromEntries(tpl.nodes.map((n, i) => [n.id, `n${stamp}_${i}`]));
  const depth = {};
  const getDepth = (n) => {
    if (depth[n.id] == null) depth[n.id] = n.parent ? getDepth(tpl.nodes.find((x) => x.id === n.parent)) + 1 : 0;
    return depth[n.id];
  };
  const cols = {};
  tpl.nodes.forEach((n) => { (cols[getDepth(n)] = cols[getDepth(n)] || []).push(n.id); });
  const sub = (v) => (typeof v === "string" ? v.replace(/\{\{@(\w+)(\.\w+)?\}\}/g, (_, k, p = "") => `{{${ids[k]}${p}}}`) : v);

  return tpl.nodes.map((n, i) => {
    const d = depth[n.id];
    const col = cols[d];
    const row = col.indexOf(n.id);
    const config = Object.fromEntries(Object.entries(n.config || {}).map(([k, v]) => [k, sub(v)]));
    return {
      client_id: ids[n.id],
      step_type: n.type,
      action_key: n.key || "",
      app_event: n.event || "",
      config: { ...config, ui_pos: { x: d * 380, y: (row - (col.length - 1) / 2) * 210 } },
      order: i,
      parent_client_id: n.parent ? ids[n.parent] : null,
      branch: n.branch || "",
    };
  });
}

/* ---------- helpers ---------- */

const cls = "w-4 h-4";
const ICONS = {
  webhook: <NetworkIcon className={`${cls} text-foreground`} />,
  schedule: <RotateCcwClockIcon className={`${cls} text-foreground`} />,
  http: <NetworkIcon className={`${cls} text-blue-500`} />,
  discord: <DiscordIcon className={cls} />,
  github: <GithubIcon className={`${cls} text-foreground`} />,
  google_sheets: <FileSheetIcon className={cls} />,
  slack: <SlackIcon className={cls} />,
  groq_ai: <RobotIcon className={`${cls} text-orange-500`} />,
  email: <GmailIcon className={cls} />,
  notion: <NotionIcon className={cls} />,
  condition: <BlocksIcon className={`${cls} text-foreground`} />,
};
const iconFor = (k) => ICONS[k] || <WorkflowIcon className={`${cls} text-muted-foreground`} />;

const NO_VAULT = ["http", "webhook", "schedule", "email"];
const BUILTIN_NAMES = { webhook: "Webhook", schedule: "Schedule", http: "HTTP", condition: "Router" };
const nameOf = (k) => BUILTIN_NAMES[k] || INTEGRATIONS[k]?.name || k;

// Normalise built-in and backend templates to one shape for display.
function normalise(t, source) {
  const list = source === "built-in"
    ? t.nodes.map((n) => ({ key: n.type === "condition" ? "condition" : n.key }))
    : (t.steps || []).map((s) => ({ key: s.step_type === "condition" ? "condition" : s.action_key }));
  const keys = list.map((x) => x.key).filter(Boolean);
  return { ...t, source, keys, apps: [...new Set(keys.filter((k) => k !== "condition"))] };
}

/* ---------- components ---------- */

function FlowPreview({ keys }) {
  return (
    <div className="relative flex items-center justify-center gap-1.5 h-[88px] rounded-lg border border-border bg-card overflow-hidden px-3"
      style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "14px 14px" }}>
      {keys.map((k, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground/60 shrink-0" />}
          <span title={nameOf(k)} className="w-9 h-9 rounded-md border border-border bg-background flex items-center justify-center shrink-0">
            {iconFor(k)}
          </span>
        </div>
      ))}
    </div>
  );
}

function TemplateCard({ tpl, missing, busy, disabled, onUse }) {
  return (
    <div className="group flex flex-col rounded-lg border border-border bg-card hover:border-foreground/30 transition-colors overflow-hidden">
      <div className="p-3 pb-0"><FlowPreview keys={tpl.keys} /></div>

      <div className="flex flex-col gap-1.5 p-4 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[14px] font-medium tracking-tight text-foreground truncate">{tpl.name}</h3>
          {tpl.category && <span className="text-[11px] text-muted-foreground shrink-0">{tpl.category}</span>}
        </div>
        <p className="text-[12px] leading-relaxed text-muted-foreground line-clamp-2">{tpl.description}</p>
        <p className="font-mono text-[11px] text-muted-foreground/80 truncate mt-1">
          {tpl.keys.map(nameOf).join(" → ")}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border">
        <span className={`text-[12px] truncate ${missing.length ? "text-amber-400" : "text-muted-foreground"}`}>
          {missing.length ? `Needs ${missing.map(nameOf).join(", ")}` : `${tpl.keys.length} steps`}
        </span>
        <Button onClick={onUse} disabled={disabled} className="h-8 px-3 text-[12px] gap-1.5 shrink-0">
          {busy ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating</> : <>Use template <ArrowRight className="w-3.5 h-3.5" /></>}
        </Button>
      </div>
    </div>
  );
}

/* ---------- page ---------- */

export default function TemplateGallery() {
  const navigate = useNavigate();
  const [remote, setRemote] = useState([]);
  const [vaultKeys, setVaultKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    Promise.all([
      getTemplates().catch(() => []),
      getCredentials().catch(() => []),
    ]).then(([tpls, creds]) => {
      setRemote(Array.isArray(tpls) ? tpls : []);
      setVaultKeys(Array.isArray(creds) ? creds : []);
    }).finally(() => setLoading(false));
  }, []);

  const all = useMemo(
    () => [...BUILT_IN.map((t) => normalise(t, "built-in")), ...remote.map((t) => normalise(t, "library"))],
    [remote]
  );

  const categories = useMemo(() => ["All", ...new Set(all.map((t) => t.category).filter(Boolean))], [all]);

  const visible = all.filter((t) => {
    if (category !== "All" && t.category !== category) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return t.name.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q) || t.apps.some((a) => nameOf(a).toLowerCase().includes(q));
  });

  const missingFor = (t) => t.apps.filter((a) => !NO_VAULT.includes(a) && !vaultKeys.includes(a));

  const handleUse = async (t) => {
    setBusy(t.id);
    setError("");
    try {
      let wf;
      if (t.source === "built-in") {
        wf = await createWorkflow(t.name);
        await saveSteps(wf.id, buildSteps(t));
      } else {
        wf = await cloneTemplate({ name: t.name, steps: t.steps });
      }
      navigate(`/workflows/${wf.id}`);
    } catch (err) {
      setError(err?.response?.status === 403
        ? "Free plan limit reached. Upgrade to create more workflows."
        : "Couldn't create the workflow. Try again.");
      setBusy(null);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto px-4 py-6 sm:px-6 md:px-8 bg-background custom-scrollbar">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6 pb-20">

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Templates</h1>
          <p className="text-[13px] text-muted-foreground max-w-[60ch]">
            Start from a working flow. Pick one, connect your apps, and fill in the blanks.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="relative w-full sm:max-w-[360px] group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or app" className="pl-9 h-9 bg-background border-border text-[13px]" />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`h-7 px-3 rounded-full border text-[12px] whitespace-nowrap transition-colors ${
                  category === c ? "border-foreground bg-foreground text-background font-medium" : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-red-500/25 bg-red-500/5 px-3 py-2 text-[13px] text-red-500">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[280px] rounded-lg border border-border bg-card animate-pulse" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center text-center gap-3 rounded-lg border border-dashed border-border py-20 px-6">
            <div className="w-10 h-10 rounded-md border border-border bg-card flex items-center justify-center">
              <LayoutTemplate className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[14px] font-medium text-foreground">No templates match</p>
              <p className="text-[13px] text-muted-foreground">Try a different search or category.</p>
            </div>
            <Button variant="outline" className="h-8 text-[12px]" onClick={() => { setQuery(""); setCategory("All"); }}>Clear filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((t) => (
              <TemplateCard
                key={`${t.source}-${t.id}`}
                tpl={t}
                missing={missingFor(t)}
                busy={busy === t.id}
                disabled={!!busy}
                onUse={() => handleUse(t)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
