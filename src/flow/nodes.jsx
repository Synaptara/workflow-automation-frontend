import { Handle, Position } from "reactflow";

const base = "rounded-xl border px-4 py-3 text-sm min-w-[180px] shadow-sm transition-colors";

function borderClass(selected, liveStatus) {
  if (liveStatus === "success") return "border-status-success";
  if (liveStatus === "failed") return "border-status-danger";
  if (liveStatus === "running") return "border-accent animate-pulse";
  if (selected) return "border-accent";
  return "border-border";
}

export function TriggerNode({ data, selected }) {
  return (
    <div className={`${base} bg-base-900 ${borderClass(selected, data.liveStatus)}`}>
      <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Trigger</p>
      <p className="text-text-primary font-medium">Incoming webhook</p>
      <Handle type="source" position={Position.Bottom} id="out" className="!bg-accent" />
    </div>
  );
}

export function ConditionNode({ data, selected }) {
  return (
    <div className={`${base} bg-base-900 ${borderClass(selected, data.liveStatus)}`}>
      <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Condition</p>
      <p className="text-text-primary font-medium">
        {data.config?.field ? `${data.config.field} ${data.config.operator} ${data.config.value}` : "Not configured"}
      </p>
      <div className="flex justify-between text-xs text-text-muted mt-2">
        <span>Yes</span>
        <span>No</span>
      </div>
      <Handle type="target" position={Position.Top} id="in" className="!bg-border" />
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: "30%" }} className="!bg-status-success" />
      <Handle type="source" position={Position.Bottom} id="false" style={{ left: "70%" }} className="!bg-status-danger" />
    </div>
  );
}

export function ActionNode({ data, selected }) {
  return (
    <div className={`${base} bg-base-900 ${borderClass(selected, data.liveStatus)}`}>
      <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Action</p>
      <p className="text-text-primary font-medium capitalize">{data.actionKey || "Not set"}</p>
      <Handle type="target" position={Position.Top} id="in" className="!bg-border" />
      <Handle type="source" position={Position.Bottom} id="out" className="!bg-accent" />
    </div>
  );
}

export const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
};
