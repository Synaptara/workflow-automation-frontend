import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactFlow, { Background, Controls, addEdge, useNodesState, useEdgesState } from "reactflow";
import "reactflow/dist/style.css";

import { nodeTypes, ConfirmModal } from "../flow/nodes";
import { getWorkflow, saveSteps } from "../api/workflows";
import { useRunSocket } from "../hooks/useRunSocket";
import { INTEGRATIONS } from "../config/integrations";

let idCounter = 0;
const nextId = () => `n${Date.now()}_${idCounter++}`;

function stepsToGraph(steps) {
  const nodes = steps.map((s, i) => ({
    id: s.id,
    type: s.step_type,
    position: { x: 300 * (i % 3), y: 200 * Math.floor(i / 3) },
    data: { actionKey: s.action_key, config: s.config, stepType: s.step_type, order: s.order },
  }));

  const edges = steps
    .filter((s) => s.parent)
    .map((s) => ({
      id: `${s.parent}-${s.id}`,
      source: s.parent,
      target: s.id,
      sourceHandle: s.branch || "out",
    }));

  return { nodes, edges };
}

function graphToSteps(nodes, edges) {
  const steps = nodes.map((n) => ({
    client_id: n.id,
    step_type: n.data.stepType,
    action_key: n.data.actionKey || "",
    config: n.data.config || {},
    order: n.data.order ?? 0,
    parent_client_id: null,
    branch: "",
  }));

  edges.forEach((e) => {
    const child = steps.find((s) => s.client_id === e.target);
    if (!child) return;
    child.parent_client_id = e.source;
    child.branch = e.sourceHandle === "true" || e.sourceHandle === "false" ? e.sourceHandle : "";
  });

  return steps;
}

export default function WorkflowBuilder() {
  const { id } = useParams();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selected, setSelected] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testPayload, setTestPayload] = useState('{"budget": 6000}');
  const [testRunId, setTestRunId] = useState(null);
  const [testError, setTestError] = useState("");
  
  // State for edge deletion modal
  const [edgeToDelete, setEdgeToDelete] = useState(null);

  const { stepStatus, runStatus } = useRunSocket(testRunId);

  // Extract dynamic variables from the Test Trigger JSON
  const getAvailableVariables = () => {
    try {
      const parsed = JSON.parse(testPayload);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return Object.keys(parsed);
      }
    } catch (e) {
      // If JSON is invalid or empty, return an empty array
      return [];
    }
    return [];
  };

  useEffect(() => {
    getWorkflow(id).then((wf) => {
      setWorkflow(wf);
      const { nodes: n, edges: e } = stepsToGraph(wf.steps);
      if (n.length === 0) {
        setNodes([
          {
            id: nextId(),
            type: "trigger",
            position: { x: 300, y: 50 },
            data: { stepType: "trigger", actionKey: "", config: {}, order: 0 },
          },
        ]);
      } else {
        setNodes(n);
        setEdges(e);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    setNodes((ns) =>
      ns.map((n) => ({ ...n, data: { ...n.data, liveStatus: stepStatus[n.id] } }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepStatus]);

  // Close the right sidebar if the currently selected node is deleted
  useEffect(() => {
    if (selected && !nodes.some(n => n.id === selected.id)) {
      setSelected(null);
    }
  }, [nodes, selected]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // Handle clicking an edge connection line
  const onEdgeClick = useCallback((_, edge) => {
    setEdgeToDelete(edge);
  }, []);

  const confirmEdgeDelete = () => {
    if (edgeToDelete) {
      setEdges((eds) => eds.filter((e) => e.id !== edgeToDelete.id));
      setEdgeToDelete(null);
    }
  };

  const addNode = (type) => {
    setNodes((ns) => [
      ...ns,
      {
        id: nextId(),
        type,
        position: { x: 300 + ns.length * 30, y: 200 + ns.length * 40 },
        data:
          type === "condition"
            ? { stepType: "condition", config: { field: "", operator: "==", value: "" }, order: ns.length }
            : { stepType: "action", actionKey: "slack", config: {}, order: ns.length },
      },
    ]);
  };

  const updateSelectedData = (patch) => {
    setNodes((ns) => ns.map((n) => (n.id === selected.id ? { ...n, data: { ...n.data, ...patch } } : n)));
    setSelected((s) => ({ ...s, data: { ...s.data, ...patch } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSteps(id, graphToSteps(nodes, edges));
    } finally {
      setSaving(false);
    }
  };

  const handleTestRun = async () => {
    setTestError("");
    let payload;
    try {
      payload = JSON.parse(testPayload);
    } catch {
      setTestError("Payload must be valid JSON");
      return;
    }
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_BASE}${workflow.webhook_url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setTestRunId(data.run_id);
    } catch {
      setTestError("Could not reach the webhook endpoint");
    }
  };

  return (
    <>
      <div className="flex h-[calc(100vh-3.5rem)]">
        <div className="w-64 border-r border-border bg-base-900 p-4 flex flex-col gap-2 overflow-y-auto z-10">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Add node</p>
          <button
            onClick={() => addNode("condition")}
            className="text-sm text-left px-3 py-2 rounded-lg bg-base-800 border border-border hover:border-accent text-text-primary transition-colors"
          >
            + Router (Condition)
          </button>
          <button
            onClick={() => addNode("action")}
            className="text-sm text-left px-3 py-2 rounded-lg bg-base-800 border border-border hover:border-accent text-text-primary transition-colors"
          >
            + Module (Action)
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 mt-2 shadow-lg"
          >
            {saving ? "Saving..." : "Save workflow"}
          </button>

          {workflow && (
            <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
              <p className="text-text-muted text-xs uppercase tracking-wide">Test trigger</p>
              <textarea
                className="bg-base-800 border border-border rounded px-2 py-1.5 text-xs text-text-primary font-mono h-20 outline-none focus:border-accent transition-colors"
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
              />
              <button
                onClick={handleTestRun}
                className="text-sm px-3 py-2 rounded-lg bg-base-800 border border-border hover:border-accent text-text-primary transition-colors"
              >
                Send test payload
              </button>
              {testError && <p className="text-status-danger text-xs">{testError}</p>}
              {testRunId && (
                <p className="text-xs text-text-muted">
                  Run status:{" "}
                  <span
                    className={
                      runStatus === "success"
                        ? "text-status-success font-medium"
                        : runStatus === "failed"
                        ? "text-status-danger font-medium"
                        : "text-accent animate-pulse font-medium"
                    }
                  >
                    {runStatus || "running"}
                  </span>
                </p>
              )}

              <Link to={`/workflows/${id}/runs`} className="text-accent text-xs hover:underline mt-1">
                View run history →
              </Link>
            </div>
          )}
        </div>

        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelected(node)}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{ 
              type: 'bezier', 
              style: { strokeWidth: 3.5, stroke: '#3f3f5a' },
              interactionWidth: 40 // Expanded clickable area makes touching lines much easier
            }}
            fitView
          >
            <Background color="#16161f" gap={24} size={2} />
            <Controls />
          </ReactFlow>
        </div>

        {selected && (
          <div className="w-72 border-l border-border bg-base-900 p-4 z-10 shadow-[-10px_0_15px_rgba(0,0,0,0.2)] flex flex-col overflow-y-auto">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Configure {selected.data.stepType}</p>

            {selected.data.stepType === "condition" && (
              <div className="flex flex-col gap-2">
                <input
                  className="bg-base-800 border border-border rounded px-2 py-1.5 text-sm text-text-primary outline-none focus:border-accent"
                  placeholder="field, e.g. budget"
                  value={selected.data.config.field || ""}
                  onChange={(e) => updateSelectedData({ config: { ...selected.data.config, field: e.target.value } })}
                />
                <select
                  className="bg-base-800 border border-border rounded px-2 py-1.5 text-sm text-text-primary outline-none focus:border-accent"
                  value={selected.data.config.operator || "=="}
                  onChange={(e) => updateSelectedData({ config: { ...selected.data.config, operator: e.target.value } })}
                >
                  {["==", "!=", ">", "<", ">=", "<=", "contains"].map((op) => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
                <input
                  className="bg-base-800 border border-border rounded px-2 py-1.5 text-sm text-text-primary outline-none focus:border-accent"
                  placeholder="value"
                  value={selected.data.config.value || ""}
                  onChange={(e) => updateSelectedData({ config: { ...selected.data.config, value: e.target.value } })}
                />
              </div>
            )}

            {selected.data.stepType === "action" && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <select
                className="bg-base-800 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent outline-none transition-all"
                value={selected.data.actionKey}
                onChange={(e) => updateSelectedData({ actionKey: e.target.value, config: {} })}
              >
                {Object.entries(INTEGRATIONS).map(([key, config]) => (
                  <option key={key} value={key}>{config.name}</option>
                ))}
              </select>

              <div className="flex flex-col gap-4 mt-2">
                {INTEGRATIONS[selected.data.actionKey]?.fields.map((field) => (
                  <div key={field.key} className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-text-muted">{field.label}</label>
                    
                    {field.type === "textarea" ? (
                      <textarea
                        className="bg-base-900 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent outline-none transition-colors h-24 resize-none"
                        placeholder={field.placeholder}
                        value={selected.data.config[field.key] || ""}
                        onChange={(e) => updateSelectedData({ 
                          config: { ...selected.data.config, [field.key]: e.target.value } 
                        })}
                      />
                    ) : (
                      <input
                        type="text"
                        className="bg-base-900 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent outline-none transition-colors"
                        placeholder={field.placeholder}
                        value={selected.data.config[field.key] || ""}
                        onChange={(e) => updateSelectedData({ 
                          config: { ...selected.data.config, [field.key]: e.target.value } 
                        })}
                      />
                    )}

                    {/* Dynamic Insert Variables */}
                    <div className="flex flex-wrap gap-2 mt-0.5 items-center">
                      <span className="text-[10px] text-text-muted">Insert:</span>
                      {getAvailableVariables().length > 0 ? (
                        getAvailableVariables().map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              const currentVal = selected.data.config[field.key] || "";
                              updateSelectedData({
                                config: { ...selected.data.config, [field.key]: currentVal + `{{trigger.${key}}}` },
                              });
                            }}
                            className="text-[10px] bg-base-800 border border-border px-2 py-1 rounded-md hover:border-accent text-text-primary transition-colors cursor-pointer"
                          >
                            + {`{{trigger.${key}}}`}
                          </button>
                        ))
                      ) : (
                        <span className="text-[10px] text-text-muted italic">Add valid JSON to Test Trigger</span>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

            {selected.data.stepType === "trigger" && (
              <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <p className="text-text-muted text-sm">
                  To trigger this workflow from an external app, send a POST request to this URL with your JSON payload.
                </p>
                <div className="bg-base-800 border border-border rounded-lg p-2 flex flex-col gap-2 shadow-inner">
                  <code className="text-xs text-text-primary break-all font-mono">
                    {import.meta.env.VITE_API_URL}{workflow?.webhook_url}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${import.meta.env.VITE_API_URL}${workflow?.webhook_url}`);
                    }}
                    className="bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded text-xs font-medium transition-colors shadow-md text-center cursor-pointer"
                  >
                    Copy Webhook URL
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Render the confirmation modal for Edge deletions */}
      <ConfirmModal 
        isOpen={!!edgeToDelete} 
        onClose={() => setEdgeToDelete(null)} 
        onConfirm={confirmEdgeDelete}
        title="Remove Connection"
        message="Are you sure you want to remove this connection line? The modules will remain, but data will no longer flow between them."
      />
    </>
  );
}