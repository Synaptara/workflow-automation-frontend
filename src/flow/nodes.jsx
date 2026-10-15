import { useContext, useState } from "react";
import { createPortal } from "react-dom";
import { Handle, Position, useReactFlow } from "reactflow";
import {
  NetworkIcon,
  RotateCcwClockIcon,
  BlocksIcon,
  WorkflowIcon,
  SlackIcon,
  DiscordIcon,
  FileSheetIcon,
  RobotIcon,
  GithubIcon,
  GmailIcon,
  NotionIcon,
} from "../components/icons";
import {
  LayoutGrid,
  AlertTriangle,
  AlertCircle,
  Trash2,
  ShieldCheck,
  Settings2,
  Mail,
  Clock,
  Globe,
  Activity,
} from "lucide-react";
import { INTEGRATIONS } from "../config/integrations";
import { VaultContext } from "./vaultContext";

/* ---------- constants ---------- */

const W = "w-[280px] sm:w-[300px]";
const iconCls = "w-[18px] h-[18px]";
const NO_VAULT = ["http", "webhook", "schedule", "email"];
const AUTH_KEYS = ["webhook_url", "api_key"];
const HANDLE_TOP = "!top-[63px]"; // centre of the icon row

const FRIENDLY_FIELDS = {
  issue_title: "Title",
  issue_body: "Description",
  author: "Author",
  repo_name: "Repository",
  url: "Link",
  content: "Message",
  author_name: "Sender",
  author_id: "Sender ID",
  channel_id: "Channel",
  guild_id: "Server",
  row_index: "Row #",
  col_a: "Column A",
  col_b: "Column B",
  col_c: "Column C",
  reply: "AI response",
  result: "Result",
  status_code: "Status code",
};
const FRIENDLY_OPS = {
  "==": "equals",
  "!=": "is not",
  ">": ">",
  "<": "<",
  ">=": "≥",
  "<=": "≤",
  contains: "contains",
};
const BUILTIN = {
  webhook: "Incoming Webhook",
  schedule: "Schedule",
  http: "HTTP Request",
};

export function humanizeVariable(rawPath) {
  if (!rawPath) return "";
  const parts = String(rawPath)
    .replace(/^\{\{|\}\}$/g, "")
    .trim()
    .split(".");
  const key = parts[parts.length - 1];
  if (/^n\d+_\d+$/.test(key)) return "Step output";
  if (FRIENDLY_FIELDS[key]) return FRIENDLY_FIELDS[key];
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function humanizeText(s) {
  return String(s)
    .replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, p) => `[${humanizeVariable(p)}]`)
    .replace(/\s+/g, " ")
    .trim();
}

const Icons = {
  webhook: <NetworkIcon className={`${iconCls} text-foreground`} />,
  schedule: <RotateCcwClockIcon className={`${iconCls} text-foreground`} />,
  split: <BlocksIcon className={`${iconCls} text-foreground`} />,
  action: <WorkflowIcon className={`${iconCls} text-foreground`} />,
  slack: <SlackIcon className={iconCls} />,
  http: <NetworkIcon className={`${iconCls} text-blue-500`} />,
  discord: <DiscordIcon className={iconCls} />,
  google_sheets: <FileSheetIcon className={iconCls} />,
  groq_ai: <RobotIcon className={`${iconCls} text-orange-500`} />,
  github: <GithubIcon className={`${iconCls} text-foreground`} />,
  email: <GmailIcon className={iconCls} />,
  gmail: <GmailIcon className={iconCls} />,
  notion: <NotionIcon className={iconCls} />,
};

const handleBase =
  "!w-2.5 !h-2.5 !rounded-full !bg-background !border-[1.5px] !transition-colors";
const handleIn = `${handleBase} !border-muted-foreground hover:!border-foreground !left-[-5px] ${HANDLE_TOP}`;
const handleOut = `${handleBase} !border-muted-foreground hover:!border-foreground !right-[-5px] ${HANDLE_TOP}`;

const STATE_UI = {
  ready: { dot: "bg-emerald-500", text: "text-muted-foreground" },
  ok: { dot: "bg-emerald-500", text: "text-emerald-500" },
  warn: { dot: "bg-amber-400", text: "text-amber-400" },
  bad: { dot: "bg-red-500", text: "text-red-400" },
  live: { dot: "bg-amber-400 animate-pulse", text: "text-amber-400" },
  idle: { dot: "bg-muted-foreground/50", text: "text-muted-foreground" },
};

/* ---------- analysis ---------- */

const isOptional = (f) =>
  f.optional === true || /leave blank|optional/i.test(f.placeholder || "");
const filled = (v) => String(v ?? "").trim() !== "";
const shortLabel = (l) => String(l).replace(/\s*\(.*\)/, "");

function analyze(data, vaultKeys) {
  const key = data.actionKey;
  const isTrigger = data.stepType === "trigger";
  const integration = INTEGRATIONS[key];
  const cfg = data.config && typeof data.config === "object" ? data.config : {};

  const blank = !key;
  const needsVault = !!integration && !NO_VAULT.includes(key);
  const vaultOk = vaultKeys.includes(key);
  const noEvent = !!integration && !data.appEvent;
  const ev = integration?.[isTrigger ? "triggers" : "actions"]?.[data.appEvent];
  const defs = ev?.fields || [];

  const required = defs.filter(
    (f) =>
      f.type !== "select" &&
      !isOptional(f) &&
      !(AUTH_KEYS.includes(f.key) && vaultOk),
  );
  const missing = required.filter((f) => !filled(cfg[f.key]));
  const shown = defs.find(
    (f) =>
      f.type !== "select" && !AUTH_KEYS.includes(f.key) && filled(cfg[f.key]),
  );

  return {
    key,
    cfg,
    blank,
    needsVault,
    vaultOk,
    noEvent,
    missing,
    reqTotal: required.length,
    reqSet: required.length - missing.length,
    name:
      integration?.name || BUILTIN[key] || (key ? key.replace(/_/g, " ") : ""),
    eventName: ev?.name,
    preview: shown
      ? { label: shortLabel(shown.label), value: humanizeText(cfg[shown.key]) }
      : null,
    ready:
      !blank && !noEvent && !(needsVault && !vaultOk) && missing.length === 0,
  };
}

function getBanner(a, liveStatus, connected) {
  if (liveStatus === "failed")
    return { tone: "bad", text: "This step failed on the last run" };
  if (a.blank) return null;
  if (!connected)
    return {
      tone: "warn",
      text: "Connect this step to the flow so it can run",
    };
  if (a.noEvent)
    return { tone: "warn", text: "Choose what this step should do" };
  if (a.needsVault && !a.vaultOk)
    return { tone: "warn", text: `Connect ${a.name} in the Vault` };
  if (a.missing.length) {
    const names = a.missing
      .slice(0, 2)
      .map((f) => shortLabel(f.label))
      .join(", ");
    return {
      tone: "warn",
      text: `Fill in ${names}${a.missing.length > 2 ? ` +${a.missing.length - 2}` : ""}`,
    };
  }
  return null;
}

function getState({ liveStatus, ready, connected, blank }) {
  if (liveStatus === "running") return { label: "Running", tone: "live" };
  if (liveStatus === "success") return { label: "Succeeded", tone: "ok" };
  if (liveStatus === "failed") return { label: "Failed", tone: "bad" };
  if (blank) return { label: "Not set up", tone: "idle" };
  if (!connected) return { label: "Not connected", tone: "idle" };
  if (!ready) return { label: "Setup needed", tone: "warn" };
  return { label: "Ready", tone: "ready" };
}

function borderClass(selected, liveStatus, blank) {
  if (liveStatus === "success") return "border-emerald-500/60";
  if (liveStatus === "failed") return "border-red-500/60";
  if (liveStatus === "running") return "border-amber-400/60 animate-pulse";
  if (selected) return "border-foreground ring-1 ring-foreground/20";
  if (blank) return "border-dashed border-border hover:border-muted-foreground";
  return "border-border hover:border-muted-foreground/60";
}

/* ---------- modal + delete ---------- */

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border p-5 rounded-lg shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[15px] font-semibold text-foreground mb-1.5">
          {title}
        </h3>
        <p className="text-[13px] text-muted-foreground mb-5 leading-relaxed">
          {message}
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-8 px-3 text-[13px] font-medium text-foreground bg-background hover:bg-accent border border-border rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="h-8 px-3 text-[13px] font-medium text-white bg-destructive hover:bg-destructive/90 rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function DeleteButton({ id }) {
  const { setNodes, setEdges } = useReactFlow();
  const [showModal, setShowModal] = useState(false);
  const handleDelete = () => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  };
  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        aria-label="Delete step"
        className="absolute -top-2.5 -right-2.5 bg-background text-muted-foreground border border-border rounded-md p-1 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-150 z-20 hover:text-destructive hover:border-destructive/50"
      >
        <Trash2 className="w-3 h-3" />
      </button>
      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDelete}
        title="Delete step"
        message="Are you sure you want to remove this step from your workflow?"
      />
    </>
  );
}

/* ---------- building blocks ---------- */

function Banner({ tone, text }) {
  const cls =
    tone === "bad"
      ? "border-red-500/30 bg-red-500/10 text-red-400"
      : "border-amber-500/30 bg-amber-500/10 text-amber-400";
  return (
    <div
      className={`flex items-center gap-1.5 rounded-t-xl border border-b-0 px-3 pt-1.5 pb-4 text-[11px] font-medium ${cls}`}
    >
      <AlertTriangle className="w-3 h-3 shrink-0" />
      <span className="truncate">{text}</span>
    </div>
  );
}

function Shell({
  id,
  selected,
  liveStatus,
  blank,
  banner,
  deletable,
  children,
}) {
  return (
    <div className={W}>
      {banner && <Banner {...banner} />}
      <div
        className={`group relative rounded-xl border bg-background cursor-pointer transition-colors duration-150 ${banner ? "-mt-3" : ""} ${borderClass(selected, liveStatus, blank)}`}
      >
        {deletable && <DeleteButton id={id} />}
        {children}
      </div>
    </div>
  );
}

function TopBar({ number, role, state }) {
  const ui = STATE_UI[state.tone];
  return (
    <div className="flex items-center gap-2 px-3 h-[30px] border-b border-border bg-card rounded-t-xl">
      {number != null ? (
        <span
          className="text-[11px] font-semibold text-foreground tabular-nums"
          title={`This is step ${number} of your flow`}
        >
          Step {number}
        </span>
      ) : (
        <span
          className="text-[11px] font-medium text-muted-foreground"
          title="Not part of the flow yet"
        >
          Not in flow
        </span>
      )}
      <span className="w-px h-3 bg-border" />
      <span className="text-[11px] text-muted-foreground">{role}</span>
      <span
        className={`ml-auto inline-flex items-center gap-1.5 text-[11px] font-medium ${ui.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${ui.dot}`} />
        {state.label}
      </span>
    </div>
  );
}

function Body({ icon, title, subtitle, blank }) {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <div
        className={`w-10 h-10 shrink-0 rounded-lg border flex items-center justify-center ${blank ? "border-dashed border-border" : "border-border bg-card"}`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <span
          title={title}
          className={`text-[13px] font-semibold leading-tight truncate ${blank ? "text-muted-foreground" : "text-foreground"}`}
        >
          {title}
        </span>
        <span className="text-[12px] text-muted-foreground truncate mt-0.5">
          {subtitle}
        </span>
      </div>
    </div>
  );
}

function Footer({ preview, children }) {
  return (
    <div className="flex flex-col gap-1.5 px-3 py-2 border-t border-border bg-card rounded-b-xl">
      {preview && (
        <p
          className="text-[11px] text-muted-foreground truncate"
          title={`${preview.label}: ${preview.value}`}
        >
          <span className="text-foreground/70">{preview.label}:</span>{" "}
          {preview.value}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-1.5 min-h-[20px]">
        {children}
      </div>
    </div>
  );
}

function Chip({
  icon: Icon,
  tone = "text-muted-foreground",
  className = "",
  children,
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 h-5 px-2 rounded-md bg-accent text-[11px] font-medium min-w-0 ${tone} ${className}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  );
}

function ConnectionChip({ a }) {
  if (!a.needsVault) return null;
  return a.vaultOk ? (
    <Chip icon={ShieldCheck} tone="text-emerald-500">
      Account connected
    </Chip>
  ) : (
    <Chip icon={AlertCircle} tone="text-amber-400">
      Not connected
    </Chip>
  );
}

function FieldChip({ a }) {
  if (a.reqTotal === 0) return null;
  const left = a.reqTotal - a.reqSet;
  return (
    <Chip
      icon={Settings2}
      tone={left === 0 ? "text-muted-foreground" : "text-amber-400"}
    >
      {left === 0
        ? "All fields set"
        : `${left} ${left === 1 ? "field" : "fields"} left`}
    </Chip>
  );
}

/* ---------- nodes ---------- */

export function TriggerNode({ data, selected }) {
  const vaultKeys = useContext(VaultContext);
  const a = analyze({ ...data, stepType: "trigger" }, vaultKeys);
  const isSchedule = a.key === "schedule";
  const isWebhook = !a.key || a.key === "webhook";
  const builtIn = isSchedule || isWebhook;
  const interval = a.cfg.interval || 15;
  const ready = builtIn || a.ready;

  const icon = isSchedule
    ? Icons.schedule
    : isWebhook
      ? Icons.webhook
      : Icons[a.key] || Icons.webhook;
  const title = isSchedule
    ? "Schedule"
    : isWebhook
      ? "Incoming Webhook"
      : a.eventName || "Choose a trigger event";
  const subtitle = isSchedule
    ? `Runs every ${interval} minutes`
    : isWebhook
      ? "Starts when data is received"
      : a.name;

  const banner = builtIn
    ? data.liveStatus === "failed"
      ? { tone: "bad", text: "This step failed on the last run" }
      : null
    : getBanner(a, data.liveStatus, true);
  const state = getState({
    liveStatus: data.liveStatus,
    ready,
    connected: true,
    blank: false,
  });

  return (
    <Shell selected={selected} liveStatus={data.liveStatus} banner={banner}>
      <TopBar number={data.stepNumber ?? 1} role="Trigger" state={state} />
      <Body icon={icon} title={title} subtitle={subtitle} />
      <Footer preview={builtIn ? null : a.preview}>
        {isWebhook && (
          <>
            <Chip icon={Globe}>Webhook URL</Chip>
            <Chip icon={Activity}>Instant</Chip>
          </>
        )}
        {isSchedule && <Chip icon={Clock}>Every {interval}m</Chip>}
        {!builtIn && (
          <>
            <FieldChip a={a} />
            <ConnectionChip a={a} />
          </>
        )}
      </Footer>
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className={handleOut}
      />
    </Shell>
  );
}

function BranchRow({ label, hint, hid, dot, border, top }) {
  return (
    <div
      className={`relative flex items-center justify-between px-3 py-2 ${top ? "border-t border-border" : ""}`}
    >
      <span className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        <span className="text-[11px] font-medium text-foreground">{label}</span>
      </span>
      <span className="text-[11px] text-muted-foreground">{hint}</span>
      <Handle
        type="source"
        position={Position.Right}
        id={hid}
        className={`${handleBase} ${border} !right-[-5px]`}
      />
    </div>
  );
}

export function ConditionNode({ id, data, selected }) {
  const cfg = data.config && typeof data.config === "object" ? data.config : {};
  const connected = data.connected !== false;
  const missing = [
    !filled(cfg.field) && "a value to check",
    !filled(cfg.value) && "a match value",
  ].filter(Boolean);
  const ready = missing.length === 0;

  const banner =
    data.liveStatus === "failed"
      ? { tone: "bad", text: "This step failed on the last run" }
      : !connected
        ? { tone: "warn", text: "Connect this step to the flow so it can run" }
        : ready
          ? null
          : { tone: "warn", text: `Choose ${missing.join(" and ")}` };
  const state = getState({
    liveStatus: data.liveStatus,
    ready,
    connected,
    blank: false,
  });

  const op = FRIENDLY_OPS[cfg.operator || "=="] || cfg.operator;
  const title = ready
    ? `If ${humanizeVariable(cfg.field)} ${op} "${cfg.value}"`
    : "Set up the condition";

  return (
    <Shell
      id={id}
      deletable
      selected={selected}
      liveStatus={data.liveStatus}
      banner={banner}
    >
      <TopBar number={data.stepNumber} role="Router" state={state} />
      <Body
        icon={Icons.split}
        title={title}
        subtitle="Splits the flow into two paths"
      />
      <div className="border-t border-border bg-card rounded-b-xl">
        <BranchRow
          label="Yes"
          hint="when it matches"
          hid="true"
          dot="bg-emerald-500"
          border="!border-emerald-500"
        />
        <BranchRow
          label="No"
          hint="otherwise"
          hid="false"
          dot="bg-red-500"
          border="!border-red-500"
          top
        />
      </div>
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className={handleIn}
      />
    </Shell>
  );
}

export function ActionNode({ id, data, selected }) {
  const vaultKeys = useContext(VaultContext);
  const connected = data.connected !== false;
  const a = analyze({ ...data, stepType: "action" }, vaultKeys);
  const banner = getBanner(a, data.liveStatus, connected);
  const state = getState({
    liveStatus: data.liveStatus,
    ready: a.ready,
    connected,
    blank: a.blank,
  });

  const icon = a.blank ? (
    <LayoutGrid className={`${iconCls} text-muted-foreground`} />
  ) : (
    Icons[a.key] || Icons.action
  );
  const title = a.blank
    ? "Choose an app"
    : a.eventName ||
      (data.appEvent ? data.appEvent.replace(/_/g, " ") : "Choose an action");
  const subtitle = a.blank ? "Click to set up this step" : a.name;

  return (
    <Shell
      id={id}
      deletable
      selected={selected}
      liveStatus={data.liveStatus}
      banner={banner}
      blank={a.blank}
    >
      <TopBar number={data.stepNumber} role="Action" state={state} />
      <Body icon={icon} title={title} subtitle={subtitle} blank={a.blank} />
      {!a.blank && (
        <Footer preview={a.preview}>
          {a.key === "http" && (
            <Chip icon={Globe}>{a.cfg.method || "GET"}</Chip>
          )}
          {a.key === "email" && <Chip icon={Mail}>Email</Chip>}
          <FieldChip a={a} />
          <ConnectionChip a={a} />
        </Footer>
      )}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className={handleIn}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className={handleOut}
      />
    </Shell>
  );
}

export const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
};
