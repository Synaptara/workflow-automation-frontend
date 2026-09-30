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
import { LayoutGrid } from "lucide-react";

const base = "w-[280px] p-4 rounded-2xl flex flex-col gap-3 border transition-colors duration-200 shadow-xl relative group cursor-pointer bg-[#111114]";

function borderClass(selected, liveStatus, isUnconfigured = false) {
  if (liveStatus === "success") return "border-[#10b981] bg-[#10b981]/5 shadow-[0_0_20px_rgba(16,185,129,0.15)]";
  if (liveStatus === "failed") return "border-[#f85149] bg-[#f85149]/5 shadow-[0_0_20px_rgba(248,81,73,0.2)]";
  if (liveStatus === "running") return "border-white bg-white/5 shadow-[0_0_20px_rgba(255,255,255,0.1)] animate-pulse";
  if (selected) return "border-white shadow-[0_0_25px_rgba(255,255,255,0.05)]";
  if (isUnconfigured) return "border-dashed border-[#404040] hover:border-white bg-[#0a0a0a]";
  return "border-[#232326] hover:border-[#404040]";
}

const Icons = {
  webhook: <NetworkIcon className="w-[22px] h-[22px] text-[#a1a1aa]" />,
  schedule: <RotateCcwClockIcon className="w-[22px] h-[22px] text-[#a1a1aa]" />,
  split: <BlocksIcon className="w-[20px] h-[20px] text-[#a1a1aa]" />,
  action: <WorkflowIcon className="w-[20px] h-[20px] text-[#a1a1aa]" />,
  slack: <SlackIcon className="w-[22px] h-[22px]" />,
  http: <NetworkIcon className="w-[22px] h-[22px] text-blue-500" />,
  discord: <DiscordIcon className="w-[22px] h-[22px]" />,
  google_sheets: <FileSheetIcon className="w-[22px] h-[22px]" />,
  groq_ai: <RobotIcon className="w-[22px] h-[22px] text-orange-500" />,
  github: <GithubIcon className="w-[22px] h-[22px] text-[#f4f4f5]" />,
  email: <GmailIcon className="w-[22px] h-[22px]" />,
  gmail: <GmailIcon className="w-[22px] h-[22px]" />,
  notion: <NotionIcon className="w-[22px] h-[22px]" />
};

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-[#111111] border border-[#222222] p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-[#a1a1aa] mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-[#181818] hover:bg-[#222222] border border-[#272727] rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 text-sm font-bold text-white bg-[#f85149] hover:bg-[#ff6a63] rounded-lg transition-colors shadow-[0_0_15px_rgba(248,81,73,0.4)]">
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
        className="absolute -top-3 -right-3 bg-[#0a0a0a] text-[#f85149] border border-[#222222] rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 shadow-lg hover:scale-110 hover:bg-[#f85149]/10 hover:border-[#f85149]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
      <ConfirmModal isOpen={showModal} onClose={() => setShowModal(false)} onConfirm={handleDelete} title="Delete Module" message="Are you sure you want to remove this module?" />
    </>
  );
}

function NodeContent({ icon, title, subtitle, warning, isBlank }) {
  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center gap-3 w-full">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${isBlank ? 'bg-transparent border border-dashed border-[#404040] text-[#71717a]' : 'bg-[#181818] border border-[#272727] text-zinc-400'}`}>
          {icon}
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className={`text-base font-bold truncate tracking-tight ${isBlank ? 'text-[#a1a1aa]' : 'text-white'}`}>{title}</span>
          <span className="text-xs text-[#71717a] mt-0.5 leading-relaxed line-clamp-1">{subtitle}</span>
        </div>
      </div>
      {warning && (
        <div className="mt-3 pt-2 border-t border-[#222222] flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f85149" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          <span className="text-[10px] text-[#f85149] font-bold uppercase tracking-wider">{warning}</span>
        </div>
      )}
    </div>
  );
}

export function TriggerNode({ data, selected }) {
  const isSchedule = data.actionKey === "schedule";
  const interval = data.config?.interval || 15;
  return (
    <div className={`${base} ${borderClass(selected, data.liveStatus)}`}>
      <NodeContent
        icon={isSchedule ? Icons.schedule : Icons.webhook}
        title={isSchedule ? "Scheduled Trigger" : "Incoming Webhook"}
        subtitle={isSchedule ? `Runs autonomously every ${interval} minutes` : "Listens for external payload data"}
      />
      <Handle type="source" position={Position.Right} id="out" className="!bg-[#0a0a0a] !w-3.5 !h-3.5 !border-[2.5px] !border-white !right-[-7px]" />
    </div>
  );
}

export function ConditionNode({ id, data, selected }) {
  const isConfigured = data.config?.field && data.config?.value;
  return (
    <div className={`${base} ${borderClass(selected, data.liveStatus)}`}>
      <DeleteButton id={id} />
      <NodeContent
        icon={Icons.split}
        title="Router"
        subtitle={isConfigured ? `If ${data.config.field} ${data.config.operator} ${data.config.value}` : "Split via condition"}
        warning={!isConfigured ? "Configuration Required" : null}
      />
      <Handle type="target" position={Position.Left} id="in" className="!bg-[#0a0a0a] !w-3.5 !h-3.5 !border-[2.5px] !border-[#52525b] !left-[-7px]" />
      <Handle type="source" position={Position.Right} id="true" style={{ top: "35%" }} className="!bg-[#10b981] !w-3 !h-3 !border-[2px] !border-[#111114] !right-[-6px]" />
      <Handle type="source" position={Position.Right} id="false" style={{ top: "65%" }} className="!bg-[#f85149] !w-3 !h-3 !border-[2px] !border-[#111114] !right-[-6px]" />
    </div>
  );
}

export function ActionNode({ id, data, selected }) {
  const isBlank = !data.actionKey;
  const icon = isBlank ? <LayoutGrid className="w-5 h-5 text-[#52525b]" /> : (Icons[data.actionKey] || Icons.action);
  const title = isBlank ? "Blank Action" : data.actionKey.charAt(0).toUpperCase() + data.actionKey.slice(1).replace("_", " ");

  const isConfigured = !isBlank && data.config && Object.keys(data.config).length > 0;

  return (
    <div className={`${base} ${borderClass(selected, data.liveStatus, isBlank)}`}>
      <DeleteButton id={id} />
      <NodeContent
        isBlank={isBlank}
        icon={icon}
        title={title}
        subtitle={isBlank ? "Click to select an application" : (isConfigured ? "Executes action with mapped variables" : "Execute external task")}
        warning={!isBlank && !isConfigured ? "Configuration Required" : null}
      />
      <Handle type="target" position={Position.Left} id="in" className="!bg-[#0a0a0a] !w-3.5 !h-3.5 !border-[2.5px] !border-[#52525b] !left-[-7px]" />
      <Handle type="source" position={Position.Right} id="out" className="!bg-[#0a0a0a] !w-3.5 !h-3.5 !border-[2.5px] !border-white !right-[-7px]" />
    </div>
  );
}

export const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
};
