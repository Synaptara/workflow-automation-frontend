import { useState } from "react";
import { createPortal } from "react-dom";
import { Handle, Position, useReactFlow } from "reactflow";

const base = "w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-xl bg-base-900 relative group cursor-pointer";

function borderClass(selected, liveStatus) {
  if (liveStatus === "success") return "border-status-success shadow-[0_0_25px_rgba(63,185,80,0.3)]";
  if (liveStatus === "failed") return "border-status-danger shadow-[0_0_25px_rgba(248,81,73,0.4)]";
  if (liveStatus === "running") return "border-accent shadow-[0_0_25px_rgba(124,92,255,0.5)] animate-pulse";
  if (selected) return "border-accent shadow-[0_0_20px_rgba(124,92,255,0.2)] scale-105";
  return "border-border hover:border-gray-500 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]";
}

const Icons = {
  webhook: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#eceef2" strokeWidth="1.5"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
  split: <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#eceef2" strokeWidth="1.5"><path d="M6 3v18M18 9V3M18 21v-6M12 15V9"/></svg>,
  action: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#eceef2" strokeWidth="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  slack: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#E01E5A" strokeWidth="1.5"><rect x="13" y="2" width="4" height="8" rx="2"/><rect x="7" y="14" width="4" height="8" rx="2"/><rect x="2" y="7" width="8" height="4" rx="2"/><rect x="14" y="13" width="8" height="4" rx="2"/></svg>,
  email: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#EA4335" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  sheets: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#34A853" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
  http: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
};

// Reusable Custom Popup Modal
export function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-base-900 border border-border p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
        <p className="text-sm text-text-muted mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-primary bg-base-800 hover:bg-base-700 border border-border rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 text-sm font-medium text-white bg-status-danger hover:bg-status-danger/80 rounded-lg transition-colors shadow-lg shadow-status-danger/20">
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
      <span className="text-xs font-semibold text-text-primary bg-base-800 px-3 py-1.5 rounded-full border border-border shadow-md whitespace-nowrap">
        {title}
      </span>
      {subtitle && <span className="text-[10px] text-text-muted mt-1 text-center whitespace-nowrap">{subtitle}</span>}
    </div>
  );
}

// Hover button that triggers the modal
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
        className="absolute -top-2 -right-2 bg-base-800 text-status-danger border border-border rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 shadow-lg hover:scale-110 hover:border-status-danger hover:bg-status-danger/10"
      >
        {/* Trash Icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>

      <ConfirmModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onConfirm={handleDelete}
        title="Delete Module"
        message="Are you sure you want to remove this module? All connected lines will also be deleted."
      />
    </>
  );
}

export function TriggerNode({ data, selected }) {
  return (
    <div className={`${base} ${borderClass(selected, data.liveStatus)}`}>
      {Icons.webhook}
      <NodeLabel title="Incoming Webhook" subtitle="Trigger" />
      <Handle type="source" position={Position.Bottom} id="out" className="!bg-accent !w-4 !h-4 !border-4 !border-base-900" />
    </div>
  );
}

export function ConditionNode({ id, data, selected }) {
  const isConfigured = data.config?.field && data.config?.value;
  return (
    <div className={`${base} ${borderClass(selected, data.liveStatus)}`}>
      <DeleteButton id={id} />
      {Icons.split}
      <NodeLabel 
        title={isConfigured ? `${data.config.field} ${data.config.operator} ${data.config.value}` : "Condition"} 
        subtitle={isConfigured ? "Router" : "Not configured"} 
      />
      <Handle type="target" position={Position.Top} id="in" className="!bg-border !w-4 !h-4 !border-4 !border-base-900" />
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: "20%" }} className="!bg-status-success !w-4 !h-4 !border-4 !border-base-900" />
      <Handle type="source" position={Position.Bottom} id="false" style={{ left: "80%" }} className="!bg-status-danger !w-4 !h-4 !border-4 !border-base-900" />
    </div>
  );
}

export function ActionNode({ id, data, selected }) {
  const icon = Icons[data.actionKey] || Icons.action;
  const title = data.actionKey ? data.actionKey.charAt(0).toUpperCase() + data.actionKey.slice(1) : "Action";
  
  // Checks if the config object has any keys filled out, regardless of the integration type
  const isConfigured = data.config && Object.keys(data.config).length > 0;
  
  return (
    <div className={`${base} ${borderClass(selected, data.liveStatus)}`}>
      <DeleteButton id={id} />
      {icon}
      <NodeLabel title={title} subtitle={isConfigured ? "Configured" : "Needs setup"} />
      <Handle type="target" position={Position.Top} id="in" className="!bg-border !w-4 !h-4 !border-4 !border-base-900" />
      <Handle type="source" position={Position.Bottom} id="out" className="!bg-accent !w-4 !h-4 !border-4 !border-base-900" />
    </div>
  );
}

export const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
};