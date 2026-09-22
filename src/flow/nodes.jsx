import { Handle, Position } from "reactflow";

const base = "rounded-xl border px-4 py-3 text-sm min-w-[200px] shadow-sm transition-all duration-200 bg-base-900";

function borderClass(selected, liveStatus) {
  if (liveStatus === "success") return "border-status-success shadow-[0_0_10px_rgba(34,197,94,0.1)]";
  if (liveStatus === "failed") return "border-status-danger shadow-[0_0_10px_rgba(239,68,68,0.2)]";
  if (liveStatus === "running") return "border-accent animate-pulse";
  if (selected) return "border-accent shadow-[0_0_10px_rgba(124,92,255,0.1)]";
  return "border-border hover:border-gray-600";
}

// Minimalist inline SVGs for the nodes
const Icons = {
  webhook: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
  split: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3v18M18 9V3M18 21v-6M12 15V9"/></svg>,
  action: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  alert: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
};

export function TriggerNode({ data, selected }) {
  return (
    <div className={`${base} ${borderClass(selected, data.liveStatus)}`}>
      <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wide mb-1.5">
        {Icons.webhook}
        <span>Trigger</span>
      </div>
      <p className="text-text-primary font-medium">Incoming webhook</p>
      <Handle type="source" position={Position.Bottom} id="out" className="!bg-accent !w-3 !h-3 !border-2 !border-base-900" />
    </div>
  );
}

export function ConditionNode({ data, selected }) {
  return (
    <div className={`${base} ${borderClass(selected, data.liveStatus)}`}>
      <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wide mb-1.5">
        {Icons.split}
        <span>Condition</span>
      </div>
      <p className="text-text-primary font-medium bg-base-800 inline-block px-2 py-1 rounded-md mt-1">
        {data.config?.field ? `${data.config.field} ${data.config.operator} ${data.config.value}` : "Not configured"}
      </p>
      <div className="flex justify-between text-[10px] text-text-muted mt-3 px-2 font-medium">
        <span className="text-status-success">YES</span>
        <span className="text-status-danger">NO</span>
      </div>
      <Handle type="target" position={Position.Top} id="in" className="!bg-border !w-3 !h-3 !border-2 !border-base-900" />
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: "25%" }} className="!bg-status-success !w-3 !h-3 !border-2 !border-base-900" />
      <Handle type="source" position={Position.Bottom} id="false" style={{ left: "75%" }} className="!bg-status-danger !w-3 !h-3 !border-2 !border-base-900" />
    </div>
  );
}

export function ActionNode({ data, selected }) {
  return (
    <div className={`${base} ${borderClass(selected, data.liveStatus)}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wide">
          {Icons.action}
          <span>Action</span>
        </div>
        {data.liveStatus === "failed" && <div title="Step failed" className="animate-bounce">{Icons.alert}</div>}
      </div>
      <p className="text-text-primary font-medium capitalize">{data.actionKey || "Not configured"}</p>
      
      {/* Show configuration preview on the node itself */}
      {data.actionKey === "slack" && data.config?.webhook_url && (
        <p className="text-[10px] text-text-muted mt-1 truncate">
          Webhook configured
        </p>
      )}

      <Handle type="target" position={Position.Top} id="in" className="!bg-border !w-3 !h-3 !border-2 !border-base-900" />
      <Handle type="source" position={Position.Bottom} id="out" className="!bg-accent !w-3 !h-3 !border-2 !border-base-900" />
    </div>
  );
}

export const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
};