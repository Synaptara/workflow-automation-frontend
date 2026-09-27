import { useState } from "react";
import { createPortal } from "react-dom";
import { Handle, Position, useReactFlow } from "reactflow";

const base = "w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-xl bg-base-900 relative group cursor-pointer";

function borderClass(selected, liveStatus) {
  if (liveStatus === "success") return "border-status-success shadow-[0_0_25px_rgba(63,185,80,0.4)] bg-[#111c14]";
  if (liveStatus === "failed") return "border-status-danger shadow-[0_0_25px_rgba(248,81,73,0.5)] bg-[#1c1111]";
  if (liveStatus === "running") return "border-accent shadow-[0_0_25px_rgba(124,92,255,0.6)] animate-pulse bg-[#141221]";
  if (selected) return "border-accent shadow-[0_0_20px_rgba(124,92,255,0.2)] scale-105";
  return "border-border hover:border-gray-400 hover:shadow-[0_0_15px_rgba(255,255,255,0.08)] bg-base-900";
}

const Icons = {
  webhook: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#eceef2" strokeWidth="1.5"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
  schedule: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  split: <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#eceef2" strokeWidth="1.5"><path d="M6 3v18M18 9V3M18 21v-6M12 15V9"/></svg>,
  action: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#eceef2" strokeWidth="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  slack: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#E01E5A" strokeWidth="1.5"><rect x="13" y="2" width="4" height="8" rx="2"/><rect x="7" y="14" width="4" height="8" rx="2"/><rect x="2" y="7" width="8" height="4" rx="2"/><rect x="14" y="13" width="8" height="4" rx="2"/></svg>,
  email: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#EA4335" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  http: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>,
  discord: (
    <svg width="36" height="36" viewBox="0 0 16 16" fill="#5865F2" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613 1.451.73 1.438 1.613c0 .888-.631 1.612-1.438 1.612"/>
    </svg>
  ),
  google_sheets: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0F9D58" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="9" y1="21" x2="9" y2="9"/>
    </svg>
  )
};

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-base-900 border border-border p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
        <p className="text-sm text-text-muted mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-primary bg-base-800 hover:bg-base-700 border border-border rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 text-sm font-medium text-white bg-status-danger hover:bg-status-danger/80 rounded-lg transition-colors shadow-[0_0_15px_rgba(248,81,73,0.3)]">
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function NodeLabel({ title, subtitle }) {
  return (
    <div className="absolute -bottom-14 flex flex-col items-center min-w-[140px] pointer-events-none">
      <span className="text-[11px] font-bold text-text-primary bg-base-950 px-3 py-1.5 rounded-md border border-border/60 shadow-lg tracking-wide">
        {title}
      </span>
      {subtitle && <span className="text-[10px] text-text-muted mt-1 text-center font-medium uppercase tracking-wider">{subtitle}</span>}
    </div>
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
        className="absolute -top-2 -right-2 bg-base-950 text-status-danger border border-border/60 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 shadow-lg hover:scale-110 hover:border-status-danger hover:bg-status-danger/20"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
      <ConfirmModal isOpen={showModal} onClose={() => setShowModal(false)} onConfirm={handleDelete} title="Delete Module" message="Are you sure you want to remove this module? All connected lines will also be deleted." />
    </>
  );
}

export function TriggerNode({ data, selected }) {
  const isSchedule = data.actionKey === "schedule";
  return (
    <div className={`${base} ${borderClass(selected, data.liveStatus)}`}>
      {isSchedule ? Icons.schedule : Icons.webhook}
      <NodeLabel title={isSchedule ? "Scheduled Trigger" : "Incoming Webhook"} subtitle="Trigger" />
      <Handle type="source" position={Position.Right} id="out" className="!bg-accent !w-3 !h-3 !border-2 !border-base-950" />
    </div>
  );
}

export function ConditionNode({ id, data, selected }) {
  const isConfigured = data.config?.field && data.config?.value;
  return (
    <div className={`${base} ${borderClass(selected, data.liveStatus)}`}>
      <DeleteButton id={id} />
      {Icons.split}
      <NodeLabel title={isConfigured ? `${data.config.field} ${data.config.operator} ${data.config.value}` : "Condition"} subtitle={isConfigured ? "Router" : "Not configured"} />
      <Handle type="target" position={Position.Left} id="in" className="!bg-border !w-3 !h-3 !border-2 !border-base-950" />
      
      {/* Positioned the true/false split neatly on the right curve of the node */}
      <Handle type="source" position={Position.Right} id="true" style={{ top: "25%" }} className="!bg-status-success !w-3 !h-3 !border-2 !border-base-950" />
      <Handle type="source" position={Position.Right} id="false" style={{ top: "75%" }} className="!bg-status-danger !w-3 !h-3 !border-2 !border-base-950" />
    </div>
  );
}

export function ActionNode({ id, data, selected }) {
  const icon = Icons[data.actionKey] || Icons.action;
  const title = data.actionKey ? data.actionKey.charAt(0).toUpperCase() + data.actionKey.slice(1) : "Action";
  const isConfigured = data.config && Object.keys(data.config).length > 0;
  
  return (
    <div className={`${base} ${borderClass(selected, data.liveStatus)}`}>
      <DeleteButton id={id} />
      {icon}
      <NodeLabel title={title} subtitle={isConfigured ? "Configured" : "Needs setup"} />
      <Handle type="target" position={Position.Left} id="in" className="!bg-border !w-3 !h-3 !border-2 !border-base-950" />
      <Handle type="source" position={Position.Right} id="out" className="!bg-accent !w-3 !h-3 !border-2 !border-base-950" />
    </div>
  );
}

export const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
};