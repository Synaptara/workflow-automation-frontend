import { useState } from "react";
import { createPortal } from "react-dom";
import { Handle, Position, useReactFlow } from "reactflow";

const base = "w-[280px] p-4 rounded-2xl flex flex-col gap-3 border transition-all duration-200 shadow-xl relative group cursor-pointer bg-[#111114]";

function borderClass(selected, liveStatus) {
  if (liveStatus === "success") return "border-[#10b981] bg-[#10b981]/5 shadow-[0_0_20px_rgba(16,185,129,0.15)]";
  if (liveStatus === "failed") return "border-[#f85149] bg-[#f85149]/5 shadow-[0_0_20px_rgba(248,81,73,0.2)]";
  if (liveStatus === "running") return "border-white bg-white/5 shadow-[0_0_20px_rgba(255,255,255,0.1)] animate-pulse";
  if (selected) return "border-white shadow-[0_0_25px_rgba(255,255,255,0.05)]";
  return "border-[#232326] hover:border-[#404040]";
}

const Icons = {
  webhook: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.5"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
  schedule: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  split: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.5"><path d="M6 3v18M18 9V3M18 21v-6M12 15V9"/></svg>,
  action: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  slack: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E01E5A" strokeWidth="1.5"><rect x="13" y="2" width="4" height="8" rx="2"/><rect x="7" y="14" width="4" height="8" rx="2"/><rect x="2" y="7" width="8" height="4" rx="2"/><rect x="14" y="13" width="8" height="4" rx="2"/></svg>,
  http: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>,
  discord: (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="#5865F2" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613 1.451.73 1.438 1.613c0 .888-.631 1.612-1.438 1.612"/>
    </svg>
  ),
  google_sheets: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F9D58" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
    </svg>
  ),
  groq_ai: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
    </svg>
  ),
  github: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f4f4f5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.03c3.18-.3 6.5-1.5 6.5-7.07a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 5.58 3.3 6.78 6.5 7.08a4.8 4.8 0 0 0-1 3.03V22"/><path d="M9 20c-5 1.5-5-2.5-7-3"/></svg>
  )
};

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#111111] border border-[#222222] p-6 rounded-2xl shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-[#a1a1aa] mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-[#181818] hover:bg-[#222222] border border-[#272727] rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 text-sm font-bold text-white bg-[#f85149] hover:bg-[#ff6a63] rounded-lg transition-colors">
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

function NodeContent({ icon, title, subtitle, warning }) {
  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center gap-3 w-full">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#181818] border border-[#272727] text-zinc-400 shrink-0 shadow-inner">
          {icon}
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-base font-bold text-white truncate tracking-tight">{title}</span>
          <span className="text-xs text-[#a1a1aa] mt-0.5 leading-relaxed line-clamp-1">{subtitle}</span>
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
  const icon = Icons[data.actionKey] || Icons.action;
  const title = data.actionKey ? data.actionKey.charAt(0).toUpperCase() + data.actionKey.slice(1).replace("_", " ") : "Action Module";
  const isConfigured = data.config && Object.keys(data.config).length > 0;

  return (
    <div className={`${base} ${borderClass(selected, data.liveStatus)}`}>
      <DeleteButton id={id} />
      <NodeContent
        icon={icon}
        title={title}
        subtitle={isConfigured ? "Executes action with mapped variables" : "Execute external task"}
        warning={!isConfigured ? "Configuration Required" : null}
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
