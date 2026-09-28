import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactFlow, { Background, Controls, addEdge, useNodesState, useEdgesState } from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";

import { nodeTypes, ConfirmModal } from "../flow/nodes";
import { getWorkflow, saveSteps } from "../api/workflows";
import { useRunSocket } from "../hooks/useRunSocket";
import { INTEGRATIONS } from "../config/integrations";

let idCounter = 0;
const nextId = () => `n${Date.now()}_${idCounter++}`;

const getEdgeStyling = (sourceHandle) => {
  if (sourceHandle === "true") {
    return {
      label: "True",
      labelStyle: { fill: "#3fb950", fontWeight: 700, fontSize: 11, fontFamily: "monospace" },
      labelBgStyle: { fill: "#16161f", stroke: "#3fb950", strokeWidth: 1, rx: 6, ry: 6 },
      labelBgPadding: [6, 4],
      style: { strokeWidth: 2, stroke: "#3fb950", strokeDasharray: "5 5" }
    };
  }
  if (sourceHandle === "false") {
    return {
      label: "False",
      labelStyle: { fill: "#f85149", fontWeight: 700, fontSize: 11, fontFamily: "monospace" },
      labelBgStyle: { fill: "#16161f", stroke: "#f85149", strokeWidth: 1, rx: 6, ry: 6 },
      labelBgPadding: [6, 4],
      style: { strokeWidth: 2, stroke: "#f85149", strokeDasharray: "5 5" }
    };
  }
  return { style: { strokeWidth: 2, stroke: "#4b4b6b", strokeDasharray: "5 5" } };
};

const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Expanded spacing to accommodate the new 280px wide rectangular cards
  dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 350 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 280, height: 100 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 140, // Half of 280
        y: nodeWithPosition.y - 50,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

function stepsToGraph(steps) {
  const nodes = steps.map((s) => ({
    id: s.id,
    type: s.step_type,
    position: { x: 0, y: 0 },
    data: { actionKey: s.action_key, config: s.config, stepType: s.step_type, order: s.order },
  }));

  const edges = steps
    .filter((s) => s.parent)
    .map((s) => {
      const sourceHandle = s.branch || "out";
      return {
        id: `${s.parent}-${s.id}`,
        source: s.parent,
        target: s.id,
        sourceHandle: sourceHandle,
        ...getEdgeStyling(sourceHandle)
      };
    });

  return getLayoutedElements(nodes, edges);
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
  const [saveError, setSaveError] = useState("");
  const [testPayload, setTestPayload] = useState('{\n  "budget": 6000\n}');
  const [testRunId, setTestRunId] = useState(null);
  const [testError, setTestError] = useState("");

  const [edgeToDelete, setEdgeToDelete] = useState(null);
  const { stepStatus, runStatus } = useRunSocket(testRunId);

  const getAvailableVariables = () => {
    try {
      const parsed = JSON.parse(testPayload);
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return Object.keys(parsed);
      }
    } catch (e) {
      return [];
    }
    return [];
  };

  const getUpstreamNodes = useCallback((targetId, currentEdges, currentNodes, visited = new Set()) => {
    let result = [];
    const incoming = currentEdges.filter(e => e.target === targetId);

    incoming.forEach(edge => {
      if (!visited.has(edge.source)) {
        visited.add(edge.source);
        const sourceNode = currentNodes.find(n => n.id === edge.source);
        if (sourceNode && sourceNode.type === 'action') {
          result.push(sourceNode);
        }
        result.push(...getUpstreamNodes(edge.source, currentEdges, currentNodes, visited));
      }
    });

    return Array.from(new Map(result.map(item => [item.id, item])).values());
  }, []);

  const upstreamActions = selected ? getUpstreamNodes(selected.id, edges, nodes) : [];

  useEffect(() => {
    getWorkflow(id).then((wf) => {
      setWorkflow(wf);
      const { nodes: n, edges: e } = stepsToGraph(wf.steps);
      if (n.length === 0) {
        setNodes([{ id: nextId(), type: "trigger", position: { x: 100, y: 300 }, data: { stepType: "trigger", actionKey: "webhook", config: {}, order: 0 } }]);
      } else {
        setNodes(n);
        setEdges(e);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    setNodes((ns) => ns.map((n) => ({ ...n, data: { ...n.data, liveStatus: stepStatus[n.id] } })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepStatus]);

  useEffect(() => {
    if (selected && !nodes.some(n => n.id === selected.id)) setSelected(null);
  }, [nodes, selected]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({ ...params, ...getEdgeStyling(params.sourceHandle) }, eds)), [setEdges]);
  const onEdgeClick = useCallback((_, edge) => setEdgeToDelete(edge), []);

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
        position: { x: ns.length > 0 ? ns[ns.length - 1].position.x + 350 : 300, y: window.innerHeight / 2 - 100 },
        data: type === "condition"
            ? { stepType: "condition", config: { field: "", operator: "==", value: "" }, order: ns.length }
            : { stepType: "action", actionKey: "slack", config: {}, order: ns.length },
      },
    ]);
  };

  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [nodes, edges, setNodes, setEdges]);

  const updateSelectedData = (patch) => {
    setNodes((ns) => ns.map((n) => (n.id === selected.id ? { ...n, data: { ...n.data, ...patch } } : n)));
    setSelected((s) => ({ ...s, data: { ...s.data, ...patch } }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await saveSteps(id, graphToSteps(nodes, edges));
    } catch (err) {
      setSaveError(err.response?.data?.detail || "Failed to save workflow.");
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
    await handleSave();
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
        <div className="w-64 border-r border-border bg-base-900 p-5 flex flex-col gap-3 overflow-y-auto z-10 shadow-[5px_0_15px_rgba(0,0,0,0.1)]">
          <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Canvas Tools</p>

          <button onClick={onLayout} className="text-sm font-medium text-left px-3 py-2 rounded-lg bg-base-800 border border-border hover:border-accent text-text-primary transition-all flex items-center justify-between">
            <span>✨ Auto Layout</span>
          </button>

          <div className="h-px bg-border my-2 w-full"></div>

          <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">Add Module</p>
          <button onClick={() => addNode("condition")} className="text-sm font-medium text-left px-3 py-2 rounded-lg bg-base-800 border border-border hover:border-accent text-text-primary transition-all">
            + Router (Condition)
          </button>
          <button onClick={() => addNode("action")} className="text-sm font-medium text-left px-3 py-2 rounded-lg bg-base-800 border border-border hover:border-accent text-text-primary transition-all">
            + Module (Action)
          </button>

          <button onClick={handleSave} disabled={saving} className="bg-accent hover:bg-accent-hover text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 mt-4 shadow-[0_0_15px_rgba(124,92,255,0.3)]">
            {saving ? "Saving..." : "Save Workflow"}
          </button>

          {saveError && (
            <p className="text-status-danger text-xs font-medium bg-status-danger/10 p-2 rounded border border-status-danger/30 mt-1">
              {saveError}
            </p>
          )}

          {workflow && (
            <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest">Test Trigger</p>
              <textarea
                className="bg-base-950 border border-border/50 rounded-lg px-3 py-2 text-xs text-text-primary font-mono h-24 outline-none focus:border-accent transition-colors shadow-inner resize-none"
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
              />
              <button onClick={handleTestRun} className="text-sm font-medium px-3 py-2 rounded-lg bg-base-800 border border-border hover:border-accent text-text-primary transition-colors">
                ▶ Send Test Payload
              </button>
              {testError && <p className="text-status-danger text-xs">{testError}</p>}
              {testRunId && (
                <p className="text-xs text-text-muted bg-base-950 p-2 rounded-md border border-border/30 flex items-center justify-between">
                  Status:
                  <span className={`font-bold ${runStatus === "success" ? "text-status-success" : runStatus === "failed" ? "text-status-danger" : "text-accent animate-pulse"}`}>
                    {runStatus ? runStatus.toUpperCase() : "RUNNING..."}
                  </span>
                </p>
              )}
              <Link to={`/workflows/${id}/runs`} className="text-accent text-xs font-medium hover:underline mt-1 block text-center">
                View Run History &rarr;
              </Link>
            </div>
          )}
        </div>

        <div className="flex-1 bg-[#0b0b12]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelected(node)}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{ type: 'smoothstep', interactionWidth: 40 }}
            fitView
          >
            <Background color="#16161f" gap={24} size={2} />
            <Controls className="!bg-base-900 !border-border !fill-text-primary shadow-2xl" />
          </ReactFlow>
        </div>

        {selected && (
          <div className="w-80 border-l border-border bg-base-900 p-5 z-10 shadow-[-10px_0_20px_rgba(0,0,0,0.3)] flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/50">
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest">
                Configure Module
              </p>
              <button onClick={() => setSelected(null)} className="text-text-muted hover:text-white text-lg leading-none">&times;</button>
            </div>

            {selected.data.stepType === "trigger" && (
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-primary">Trigger Type</label>
                  <select
                    className="bg-base-950 border border-border/50 rounded-lg px-3 py-2.5 text-sm font-medium text-text-primary focus:border-accent outline-none shadow-inner cursor-pointer"
                    value={selected.data.actionKey || "webhook"}
                    onChange={(e) => updateSelectedData({ actionKey: e.target.value, config: {} })}
                  >
                    <option value="webhook">Incoming Webhook</option>
                    <option value="schedule">Scheduled Interval (Cron)</option>
                  </select>
                </div>

                {selected.data.actionKey === "schedule" ? (
                  <div className="flex flex-col gap-3 mt-2 bg-base-950/30 p-3 rounded-lg border border-border/30">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-text-primary">Interval (Minutes)</label>
                      <input
                        type="number"
                        className="bg-base-950 border border-border/50 rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent outline-none shadow-inner"
                        placeholder="15"
                        value={selected.data.config.interval || ""}
                        onChange={(e) => updateSelectedData({ config: { ...selected.data.config, interval: e.target.value } })}
                      />
                    </div>
                    <p className="text-[10px] text-text-muted leading-relaxed">
                      This workflow will run autonomously every <strong className="text-accent">{selected.data.config.interval || 15} minutes</strong> based on the Celery Beat scheduler.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 mt-2">
                    <p className="text-text-muted text-xs leading-relaxed">
                      Send a POST request to this URL with your JSON payload to trigger the automation.
                    </p>
                    <div className="bg-base-950 border border-border/50 rounded-lg p-3 flex flex-col gap-3 shadow-inner">
                      <code className="text-[11px] text-accent break-all font-mono">
                        {import.meta.env.VITE_API_URL}{workflow?.webhook_url}
                      </code>
                      <button onClick={() => navigator.clipboard.writeText(`${import.meta.env.VITE_API_URL}${workflow?.webhook_url}`)}
                        className="bg-base-800 hover:bg-base-700 border border-border text-white px-3 py-2 rounded-md text-xs font-semibold transition-all shadow-md"
                      >
                        Copy Webhook URL
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selected.data.stepType === "condition" && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-primary">Field to check</label>
                  <input
                    className="bg-base-950 border border-border/50 rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent outline-none transition-colors shadow-inner"
                    placeholder="e.g. trigger.budget"
                    value={selected.data.config.field || ""}
                    onChange={(e) => updateSelectedData({ config: { ...selected.data.config, field: e.target.value } })}
                  />
                  <div className="flex flex-col gap-1.5 mt-2 p-2.5 bg-base-950/50 rounded-lg border border-border/30">
                    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Insert Path</span>
                    <div className="flex flex-wrap gap-1.5">
                      {getAvailableVariables().map((key) => (
                        <button key={key} onClick={() => updateSelectedData({ config: { ...selected.data.config, field: `trigger.${key}` } })}
                          className="text-[10px] font-mono bg-[#1E293B] border border-[#334155] px-2 py-1 rounded-md hover:border-[#60A5FA] text-[#93C5FD] transition-all"
                        >+ trigger.{key}</button>
                      ))}
                      {upstreamActions.map((node) => {
                        const defaultPath = node.data.actionKey === "groq_ai" ? ".reply" : "";
                        return (
                          <button key={node.id} onClick={() => updateSelectedData({ config: { ...selected.data.config, field: `${node.id}${defaultPath}` } })}
                            className="text-[10px] font-mono bg-[#3B2844] border border-[#5B3E68] px-2 py-1 rounded-md hover:border-[#D8B4E2] text-[#E9D5FF] transition-all"
                          >+ {INTEGRATIONS[node.data.actionKey]?.name || node.data.actionKey}</button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-primary">Condition Operator</label>
                  <select
                    className="bg-base-950 border border-border/50 rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent outline-none transition-colors shadow-inner appearance-none cursor-pointer"
                    value={selected.data.config.operator || "=="}
                    onChange={(e) => updateSelectedData({ config: { ...selected.data.config, operator: e.target.value } })}
                  >
                    {["==", "!=", ">", "<", ">=", "<=", "contains"].map((op) => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-text-primary">Target Value</label>
                  <input
                    className="bg-base-950 border border-border/50 rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent outline-none transition-colors shadow-inner"
                    placeholder="e.g. 5000"
                    value={selected.data.config.value || ""}
                    onChange={(e) => updateSelectedData({ config: { ...selected.data.config, value: e.target.value } })}
                  />
                </div>
              </div>
            )}

            {selected.data.stepType === "action" && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <select
                className="bg-base-950 border border-border/50 rounded-lg px-3 py-2.5 text-sm font-medium text-text-primary focus:border-accent outline-none transition-all shadow-inner appearance-none cursor-pointer"
                value={selected.data.actionKey}
                onChange={(e) => updateSelectedData({ actionKey: e.target.value, config: {} })}
              >
                {Object.entries(INTEGRATIONS).map(([key, config]) => (
                  <option key={key} value={key}>{config.name}</option>
                ))}
              </select>

              <div className="flex flex-col gap-5 mt-2">
                {INTEGRATIONS[selected.data.actionKey]?.fields.map((field) => (
                  <div key={field.key} className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-text-primary">{field.label}</label>

                    {field.type === "textarea" ? (
                      <textarea
                        className="bg-base-950 border border-border/50 rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent outline-none transition-colors h-20 resize-none shadow-inner"
                        placeholder={field.placeholder}
                        value={selected.data.config[field.key] || ""}
                        onChange={(e) => updateSelectedData({ config: { ...selected.data.config, [field.key]: e.target.value } })}
                      />
                    ) : field.type === "select" ? (
                      <select
                        className="bg-base-950 border border-border/50 rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent outline-none transition-colors shadow-inner appearance-none cursor-pointer"
                        value={selected.data.config[field.key] || field.options[0].value}
                        onChange={(e) => updateSelectedData({ config: { ...selected.data.config, [field.key]: e.target.value } })}
                      >
                        {field.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="bg-base-950 border border-border/50 rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent outline-none transition-colors shadow-inner"
                        placeholder={field.placeholder}
                        value={selected.data.config[field.key] || ""}
                        onChange={(e) => updateSelectedData({ config: { ...selected.data.config, [field.key]: e.target.value } })}
                      />
                    )}

                    <div className="flex flex-col gap-1.5 mt-1 p-2 bg-base-950/30 rounded-lg border border-border/30">
                      <span className="text-[9px] font-semibold text-text-muted uppercase tracking-wider">Insert Variables</span>
                      <div className="flex flex-wrap gap-1.5">
                        {getAvailableVariables().map((key) => (
                          <button key={`trigger-${key}`} type="button"
                            onClick={() => {
                              const currentVal = selected.data.config[field.key] || "";
                              updateSelectedData({ config: { ...selected.data.config, [field.key]: currentVal + `{{trigger.${key}}}` } });
                            }}
                            className="text-[10px] font-mono bg-[#1E293B] border border-[#334155] px-2 py-1 rounded-md hover:border-[#60A5FA] hover:bg-[#1E3A8A]/30 text-[#93C5FD] transition-all shadow-sm"
                          >+ trigger.{key}</button>
                        ))}
                        {upstreamActions.map((node) => {
                          const defaultPath = node.data.actionKey === "groq_ai" ? ".reply" : "";
                          return (
                            <button key={`upstream-${node.id}`} type="button"
                              onClick={() => {
                                const currentVal = selected.data.config[field.key] || "";
                                updateSelectedData({ config: { ...selected.data.config, [field.key]: currentVal + `{{${node.id}${defaultPath}}}` } });
                              }}
                              className="text-[10px] font-mono bg-[#3B2844] border border-[#5B3E68] px-2 py-1 rounded-md hover:border-[#D8B4E2] hover:bg-[#58296B]/30 text-[#E9D5FF] transition-all shadow-sm"
                            >+ {INTEGRATIONS[node.data.actionKey]?.name || node.data.actionKey}</button>
                          );
                        })}
                        {getAvailableVariables().length === 0 && upstreamActions.length === 0 && (
                          <span className="text-[10px] text-text-muted italic">No variables available</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!edgeToDelete}
        onClose={() => setEdgeToDelete(null)}
        onConfirm={confirmEdgeDelete}
        title="Remove Connection"
        message="Are you sure you want to remove this connection line?"
      />
    </>
  );
}
