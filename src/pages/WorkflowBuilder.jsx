import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactFlow, { Background, Controls, addEdge, useNodesState, useEdgesState } from "reactflow";
import "reactflow/dist/style.css";

import { nodeTypes } from "../flow/nodes";
import { getWorkflow, saveSteps } from "../api/workflows";
import { useRunSocket } from "../hooks/useRunSocket";
import { INTEGRATIONS } from "../config/integrations";

let idCounter = 0;
const nextId = () => `n${Date.now()}_${idCounter++}`;

function stepsToGraph(steps) {
  const nodes = steps.map((s, i) => ({
    id: s.id,
    type: s.step_type,
    position: { x: 250 * (i % 3), y: 150 * Math.floor(i / 3) },
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

  const { stepStatus, runStatus } = useRunSocket(testRunId);

  useEffect(() => {
    getWorkflow(id).then((wf) => {
      setWorkflow(wf);
      const { nodes: n, edges: e } = stepsToGraph(wf.steps);
      if (n.length === 0) {
        setNodes([
          {
            id: nextId(),
            type: "trigger",
            position: { x: 250, y: 20 },
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

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const addNode = (type) => {
    setNodes((ns) => [
      ...ns,
      {
        id: nextId(),
        type,
        position: { x: 250 + ns.length * 30, y: 200 + ns.length * 40 },
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
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="w-64 border-r border-border bg-base-900 p-4 flex flex-col gap-2 overflow-y-auto">
        <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Add node</p>
        <button
          onClick={() => addNode("condition")}
          className="text-sm text-left px-3 py-2 rounded-lg bg-base-800 border border-border hover:border-accent text-text-primary"
        >
          + Condition
        </button>
        <button
          onClick={() => addNode("action")}
          className="text-sm text-left px-3 py-2 rounded-lg bg-base-800 border border-border hover:border-accent text-text-primary"
        >
          + Action
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 mt-2"
        >
          {saving ? "Saving..." : "Save workflow"}
        </button>

        {workflow && (
          <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
            <p className="text-text-muted text-xs uppercase tracking-wide">Test trigger</p>
            <textarea
              className="bg-base-800 border border-border rounded px-2 py-1.5 text-xs text-text-primary font-mono h-20"
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
            />
            <button
              onClick={handleTestRun}
              className="text-sm px-3 py-2 rounded-lg bg-base-800 border border-border hover:border-accent text-text-primary"
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
                      ? "text-status-success"
                      : runStatus === "failed"
                      ? "text-status-danger"
                      : "text-accent"
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
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#24242f" gap={20} />
          <Controls />
        </ReactFlow>
      </div>

      {selected && (
        <div className="w-72 border-l border-border bg-base-900 p-4">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Configure {selected.data.stepType}</p>

          {selected.data.stepType === "condition" && (
            <div className="flex flex-col gap-2">
              <input
                className="bg-base-800 border border-border rounded px-2 py-1.5 text-sm text-text-primary"
                placeholder="field, e.g. budget"
                value={selected.data.config.field || ""}
                onChange={(e) => updateSelectedData({ config: { ...selected.data.config, field: e.target.value } })}
              />
              <select
                className="bg-base-800 border border-border rounded px-2 py-1.5 text-sm text-text-primary"
                value={selected.data.config.operator || "=="}
                onChange={(e) => updateSelectedData({ config: { ...selected.data.config, operator: e.target.value } })}
              >
                {["==", "!=", ">", "<", ">=", "<=", "contains"].map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
              <input
                className="bg-base-800 border border-border rounded px-2 py-1.5 text-sm text-text-primary"
                placeholder="value"
                value={selected.data.config.value || ""}
                onChange={(e) => updateSelectedData({ config: { ...selected.data.config, value: e.target.value } })}
              />
            </div>
          )}

          {selected.data.stepType === "action" && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <select
                className="bg-base-800 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
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
                      <div className="flex flex-col gap-1">
                        <textarea
                          className="bg-base-900 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent outline-none transition-colors h-24 resize-none"
                          placeholder={field.placeholder}
                          value={selected.data.config[field.key] || ""}
                          onChange={(e) => updateSelectedData({ 
                            config: { ...selected.data.config, [field.key]: e.target.value } 
                          })}
                        />
                        {/* Dynamic Variable Pill for textareas */}
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-[10px] text-text-muted flex items-center">Insert variable:</span>
                          <button
                            onClick={() => {
                              const currentText = selected.data.config[field.key] || "";
                              updateSelectedData({
                                config: { ...selected.data.config, [field.key]: currentText + "{{trigger.budget}}" },
                              });
                            }}
                            className="text-[10px] bg-base-800 border border-border px-2 py-1 rounded-md hover:border-accent text-text-primary transition-colors"
                          >
                            + {"{{trigger.budget}}"}
                          </button>
                        </div>
                      </div>
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {selected.data.stepType === "trigger" && (
            <p className="text-text-muted text-sm">No config needed — POST any JSON to the webhook URL.</p>
          )}
        </div>
      )}
    </div>
  );
}