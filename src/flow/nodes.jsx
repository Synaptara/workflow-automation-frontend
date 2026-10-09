import { useState } from "react";
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
  NotionIcon
} from "../components/icons";
import { LayoutGrid, AlertTriangle, Trash2 } from "lucide-react";
import { INTEGRATIONS } from "../config/integrations";

const base = "w-[240px] p-3 rounded-lg border bg-card relative group cursor-pointer transition-colors duration-150";

function borderClass(selected, liveStatus, isUnconfigured = false) {
  if (liveStatus === "success") return "border-emerald-500/60";
  if (liveStatus === "failed") return "border-destructive/60";
  if (liveStatus === "running") return "border-amber-400/60 animate-pulse";
  if (selected) return "border-foreground";
  if (isUnconfigured) return "border-dashed border-border hover:border-muted-foreground";
  return "border-border hover:border-muted-foreground/60";
}

const iconCls = "w-[18px] h-[18px]";
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
  notion: <NotionIcon className={iconCls} />
};

const handleBase = "!w-2.5 !h-2.5 !rounded-full !bg-background !border-[1.5px] !transition-colors";

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150" onClick={onClose}>
      <div className="bg-background border border-border p-5 rounded-lg shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[15px] font-semibold text-foreground mb-1.5">{title}</h3>
        <p className="text-[13px] text-muted-foreground mb-5 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="h-8 px-3 text-[13px] font-medium text-foreground bg-background hover:bg-accent border border-border rounded-md transition-colors">
            Cancel
          </button>
          <button onClick={() => { onConfirm(); onClose(); }} className="h-8 px-3 text-[13px] font-medium text-white bg-destructive hover:bg-destructive/90 rounded-md transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function DeleteButton({ id }) {
  const { setNodes, setEdges } = useReactFlow();
  const [showModal, setShowModal] = useState(false);

  const handleDelete = () => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  };

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
        className="absolute -top-2.5 -right-2.5 bg-background text-muted-foreground border border-border rounded-md p-1 opacity-0 group-hover:opacity-100 transition-all duration-150 z-20 hover:text-destructive hover:border-destructive/50"
      >
        <Trash2 className="w-3 h-3" />
      </button>
      <ConfirmModal isOpen={showModal} onClose={() => setShowModal(false)} onConfirm={handleDelete} title="Delete Module" message="Are you sure you want to remove this module?" />
    </>
  );
}

function StatusDot({ liveStatus }) {
  if (!liveStatus) return null;
  const color =
    liveStatus === "success" ? "bg-emerald-500" :
    liveStatus === "failed" ? "bg-destructive" :
    "bg-amber-400 animate-pulse";
  return <span className={`w-1.5 h-1.5 rounded-full ${color}`} />;
}

function NodeContent({ kind, icon, title, subtitle, warning, isBlank, liveStatus }) {
  return (
    <div className="flex flex-col gap-2.5 w-full">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{kind}</span>
        <StatusDot liveStatus={liveStatus} />
      </div>
      <div className="flex items-center gap-2.5 w-full">
        <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 border ${isBlank ? 'border-dashed border-border text-muted-foreground bg-transparent' : 'border-border bg-background text-foreground'}`}>
          {icon}
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className={`text-[13px] font-medium truncate tracking-tight ${isBlank ? 'text-muted-foreground' : 'text-foreground'}`}>{title}</span>
          <span className="text-[11px] text-muted-foreground mt-0.5 truncate">{subtitle}</span>
        </div>
      </div>
      {warning && (
        <div className="flex items-center gap-1.5 pt-2 border-t border-border">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <span className="text-[10px] text-amber-500 font-mono uppercase tracking-wider">{warning}</span>
        </div>
      )}
    </div>
  );
}

export function TriggerNode({ data, selected }) {
  const key = data.actionKey;
  const integration = INTEGRATIONS[key];
  const isSchedule = key === "schedule";
  const isWebhook = !key || key === "webhook";
  const interval = data.config?.interval || 15;

  const icon = isSchedule ? Icons.schedule : isWebhook ? Icons.webhook : (Icons[key] || Icons.webhook);
  const title = isSchedule
    ? "Schedule"
    : isWebhook
      ? "Incoming Webhook"
      : integration?.name || key.charAt(0).toUpperCase() + key.slice(1).replace("_", " ");
  const subtitle = isSchedule
    ? `Every ${interval} minutes`
    : isWebhook
      ? "Listens for external payloads"
      : integration?.triggers?.[data.appEvent]?.name || "Select an event";

  return (
    <div className={`${base} ${borderClass(selected, data.liveStatus)}`}>
      <NodeContent
        kind="Trigger"
        liveStatus={data.liveStatus}
        icon={icon}
        title={title}
        subtitle={subtitle}
      />
      <Handle type="source" position={Position.Right} id="out" className={`${handleBase} !border-muted-foreground hover:!border-foreground !right-[-5px]`} />
    </div>
  );
}

export function ConditionNode({ id, data, selected }) {
  const isConfigured = data.config?.field && data.config?.value;
  return (
    <div className={`${base} ${borderClass(selected, data.liveStatus, !isConfigured)}`}>
      <DeleteButton id={id} />
      <NodeContent
        kind="Router"
        liveStatus={data.liveStatus}
        icon={Icons.split}
        title="Condition"
        subtitle={isConfigured ? `${data.config.field} ${data.config.operator} ${data.config.value}` : "Split via condition"}
        warning={!isConfigured ? "Needs configuration" : null}
      />

      <div className="mt-3 -mx-3 -mb-3 border-t border-border rounded-b-lg overflow-visible">
        <div className="relative flex items-center justify-between px-3 py-2">
          <span className="text-[11px] font-mono text-muted-foreground">True</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <Handle type="source" position={Position.Right} id="true" className={`${handleBase} !border-emerald-500 !right-[-5px]`} />
        </div>
        <div className="relative flex items-center justify-between px-3 py-2 border-t border-border">
          <span className="text-[11px] font-mono text-muted-foreground">False</span>
          <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
          <Handle type="source" position={Position.Right} id="false" className={`${handleBase} !border-destructive !right-[-5px]`} />
        </div>
      </div>

      <Handle type="target" position={Position.Left} id="in" className={`${handleBase} !border-muted-foreground hover:!border-foreground !left-[-5px] !top-[44px]`} />
    </div>
  );
}

export function ActionNode({ id, data, selected }) {
  const isBlank = !data.actionKey;
  const integration = INTEGRATIONS[data.actionKey];
  const icon = isBlank ? <LayoutGrid className="w-[18px] h-[18px] text-muted-foreground" /> : (Icons[data.actionKey] || Icons.action);

  const title = isBlank
    ? "Blank Action"
    : integration?.name || data.actionKey.charAt(0).toUpperCase() + data.actionKey.slice(1).replace("_", " ");

  const userKeys = Object.keys(data.config || {}).filter((k) => k !== "ui_pos");
  const isConfigured = !isBlank && !!data.appEvent && userKeys.length > 0;
  const eventName = integration?.actions?.[data.appEvent]?.name;

  const subtitle = isBlank
    ? "Click to select an app"
    : eventName || (data.appEvent ? data.appEvent.replace(/_/g, " ") : "Select an event");

  return (
    <div className={`${base} ${borderClass(selected, data.liveStatus, isBlank)}`}>
      <DeleteButton id={id} />
      <NodeContent
        kind="Action"
        isBlank={isBlank}
        liveStatus={data.liveStatus}
        icon={icon}
        title={title}
        subtitle={subtitle}
        warning={!isBlank && !isConfigured ? "Needs configuration" : null}
      />
      <Handle type="target" position={Position.Left} id="in" className={`${handleBase} !border-muted-foreground hover:!border-foreground !left-[-5px]`} />
      <Handle type="source" position={Position.Right} id="out" className={`${handleBase} !border-muted-foreground hover:!border-foreground !right-[-5px]`} />
    </div>
  );
}

export const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
};
