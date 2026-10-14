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
  Activity,
  ShieldCheck,
  Settings2,
  Mail,
  Clock,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { INTEGRATIONS } from "../config/integrations";
import { VaultContext } from "./vaultContext";

/* ---------- constants ---------- */

const W = "w-[280px] sm:w-[300px]";
const iconCls = "w-[18px] h-[18px]";
const NO_VAULT = ["http", "webhook", "schedule", "email"];
const AUTH_KEYS = ["webhook_url", "api_key"];
const BUILTIN = {
  webhook: "Incoming Webhook",
  schedule: "Schedule",
  http: "HTTP Request",
};

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

export function humanizeVariable(rawPath) {
  if (!rawPath) return "";
  const clean = String(rawPath)
    .replace(/^\{\{|\}\}$/g, "")
    .trim();
  const parts = clean.split(".");
  const key = parts[parts.length - 1];
  if (FRIENDLY_FIELDS[key]) return FRIENDLY_FIELDS[key];
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
const DOT = {
  ok: "bg-emerald-500",
  warn: "bg-amber-400",
  bad: "bg-red-500",
  live: "bg-amber-400 animate-pulse",
  idle: "bg-muted-foreground/40",
};

/* ---------- analysis: what is wrong / configured on a node ---------- */

const isOptional = (f) =>
  f.optional === true || /leave blank|optional/i.test(f.placeholder || "");
const filled = (v) => String(v ?? "").trim() !== "";

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

  const fields = (ev?.fields || []).filter((f) => f.type !== "select");
  const required = fields.filter(
    (f) => !isOptional(f) && !(AUTH_KEYS.includes(f.key) && vaultOk),
  );
  const missing = required.filter((f) => !filled(cfg[f.key]));

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
    ready:
      !blank && !noEvent && !(needsVault && !vaultOk) && missing.length === 0,
  };
}

function getBanner(a, liveStatus) {
  if (liveStatus === "failed")
    return { tone: "bad", text: "This step failed on the last run" };
  if (a.blank) return null;
  if (a.noEvent)
    return { tone: "warn", text: "Choose what this step should do" };
  if (a.needsVault && !a.vaultOk)
    return { tone: "warn", text: `Connect ${a.name} in the Vault` };
  if (a.missing.length) {
    const names = a.missing
      .slice(0, 2)
      .map((f) => f.label)
      .join(", ");
    return {
      tone: "warn",
      text: `Fill in ${names}${a.missing.length > 2 ? ` +${a.missing.length - 2}` : ""}`,
    };
  }
  return null;
}

const runTone = (s) =>
  ({ success: "ok", failed: "bad", running: "live", pending: "live" })[s] ||
  "idle";

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

function Tile({ icon: Icon, tone, title }) {
  return (
    <span
      title={title}
      className="relative w-7 h-9 shrink-0 rounded-md border border-border bg-background flex items-end justify-center pb-1.5"
    >
      <span
        className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${DOT[tone]}`}
      />
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
    </span>
  );
}

function Header({
  stepNumber,
  icon,
  title,
  subtitle,
  blank,
  configTone,
  configTitle,
  liveStatus,
}) {
  return (
    <div className="flex items-center gap-3 p-3">
      <div
        className={`relative w-10 h-10 shrink-0 rounded-lg border flex items-center justify-center ${blank ? "border-dashed border-border bg-transparent" : "border-border bg-card"}`}
      >
        {icon}
        {stepNumber != null && (
          <span className="absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-foreground text-background text-[10px] font-semibold flex items-center justify-center shadow-sm">
            {stepNumber}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col">
        <span
          className={`text-[13px] font-semibold truncate ${blank ? "text-muted-foreground" : "text-foreground"}`}
        >
          {title}
        </span>
        <span className="text-[12px] text-muted-foreground truncate">
          {subtitle}
        </span>
      </div>
      {!blank && (
        <div className="flex gap-1 shrink-0">
          <Tile icon={CheckCircle2} tone={configTone} title={configTitle} />
          <Tile
            icon={Activity}
            tone={runTone(liveStatus)}
            title={`Last run: ${liveStatus || "not run yet"}`}
          />
        </div>
      )}
    </div>
  );
}

function Footer({ children }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 border-t border-border bg-card rounded-b-xl min-h-[36px]">
      {children}
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

function ConnectionChips({ a }) {
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
  const done = left === 0;
  return (
    <Chip
      icon={Settings2}
      tone={done ? "text-muted-foreground" : "text-amber-400"}
    >
      {done
        ? "All fields set"
        : `${left} ${left === 1 ? "field" : "fields"} left`}
    </Chip>
  );
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return String(url).slice(0, 24);
  }
}

/* ---------- nodes ---------- */

export function TriggerNode({ data, selected }) {
  const vaultKeys = useContext(VaultContext);
  const a = analyze({ ...data, stepType: "trigger" }, vaultKeys);
  const isSchedule = a.key === "schedule";
  const isWebhook = !a.key || a.key === "webhook";
  const interval = a.cfg.interval || 15;

  const icon = isSchedule
    ? Icons.schedule
    : isWebhook
      ? Icons.webhook
      : Icons[a.key] || Icons.webhook;
  const title = isSchedule
    ? "Schedule"
    : isWebhook
      ? "Incoming Webhook"
      : a.name;
  const subtitle = isSchedule
    ? `Runs every ${interval} minutes`
    : isWebhook
      ? "Starts when data is received"
      : a.eventName || "Choose a trigger event";
  const builtIn = isSchedule || isWebhook;
  const banner = getBanner(
    builtIn
      ? {
          ...a,
          ready: true,
          blank: false,
          noEvent: false,
          missing: [],
          needsVault: false,
        }
      : a,
    data.liveStatus,
  );
  const ready = builtIn || a.ready;

  return (
    <Shell selected={selected} liveStatus={data.liveStatus} banner={banner}>
      <Header
        stepNumber={data.stepNumber ?? 1}
        icon={icon}
        title={title}
        subtitle={subtitle}
        liveStatus={data.liveStatus}
        configTone={ready ? "ok" : "warn"}
        configTitle={ready ? "Ready to run" : "Setup required"}
      />
      <Footer>
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
            <ConnectionChips a={a} />
          </>
        )}
      </Footer>
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className={`${handleBase} !border-muted-foreground hover:!border-foreground !right-[-5px] !top-[32px]`}
      />
    </Shell>
  );
}

const BranchRow = ({ label, hint, hid, dot, border, top }) => (
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

export function ConditionNode({ id, data, selected }) {
  const cfg = data.config && typeof data.config === "object" ? data.config : {};
  const missing = [
    !filled(cfg.field) && "a value to check",
    !filled(cfg.value) && "a match value",
  ].filter(Boolean);
  const ready = missing.length === 0;
  const banner =
    data.liveStatus === "failed"
      ? { tone: "bad", text: "This step failed on the last run" }
      : ready
        ? null
        : { tone: "warn", text: `Choose ${missing.join(" and ")}` };

  const friendlyField = humanizeVariable(cfg.field);
  const friendlyOp =
    FRIENDLY_OPS[cfg.operator || "=="] || cfg.operator || "equals";

  return (
    <Shell
      id={id}
      deletable
      selected={selected}
      liveStatus={data.liveStatus}
      banner={banner}
      blank={false}
    >
      <Header
        stepNumber={data.stepNumber}
        icon={Icons.split}
        title="Router"
        subtitle={
          ready
            ? `If ${friendlyField} ${friendlyOp} "${cfg.value}"`
            : "Route into two paths"
        }
        liveStatus={data.liveStatus}
        configTone={ready ? "ok" : "warn"}
        configTitle={ready ? "Ready to run" : "Setup required"}
      />
      <div className="border-t border-border bg-card rounded-b-xl">
        <BranchRow
          label="Yes"
          hint="when condition matches"
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
        className={`${handleBase} !border-muted-foreground hover:!border-foreground !left-[-5px] !top-[32px]`}
      />
    </Shell>
  );
}

export function ActionNode({ id, data, selected }) {
  const vaultKeys = useContext(VaultContext);
  const a = analyze({ ...data, stepType: "action" }, vaultKeys);
  const banner = getBanner(a, data.liveStatus);

  const icon = a.blank ? (
    <LayoutGrid className={`${iconCls} text-muted-foreground`} />
  ) : (
    Icons[a.key] || Icons.action
  );
  const title = a.blank ? "Choose an app" : a.name;
  const subtitle = a.blank
    ? "Click to pick an action"
    : a.eventName ||
      (data.appEvent ? data.appEvent.replace(/_/g, " ") : "Choose an action");

  const method = a.cfg.method || "GET";

  return (
    <Shell
      id={id}
      deletable
      selected={selected}
      liveStatus={data.liveStatus}
      banner={banner}
      blank={a.blank}
    >
      <Header
        stepNumber={data.stepNumber}
        icon={icon}
        title={title}
        subtitle={subtitle}
        blank={a.blank}
        liveStatus={data.liveStatus}
        configTone={a.ready ? "ok" : "warn"}
        configTitle={a.ready ? "Ready to run" : "Setup required"}
      />
      {!a.blank && (
        <Footer>
          {a.key === "http" && (
            <>
              <Chip icon={Globe}>{method}</Chip>
              {filled(a.cfg.url) && (
                <Chip icon={Activity} className="max-w-[130px]">
                  {hostOf(a.cfg.url)}
                </Chip>
              )}
            </>
          )}
          {a.key === "email" && <Chip icon={Mail}>Email</Chip>}
          <FieldChip a={a} />
          <ConnectionChips a={a} />
        </Footer>
      )}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className={`${handleBase} !border-muted-foreground hover:!border-foreground !left-[-5px] !top-[32px]`}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className={`${handleBase} !border-muted-foreground hover:!border-foreground !right-[-5px] !top-[32px]`}
      />
    </Shell>
  );
}

export const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
};
