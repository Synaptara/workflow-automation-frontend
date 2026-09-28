import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactFlow, { Background, addEdge, useNodesState, useEdgesState, Panel } from "reactflow";
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
      labelStyle: { fill: "var(--color-status-success)", fontWeight: 700, fontSize: 11, fontFamily: "var(--font-mono)" },
      labelBgStyle: { fill: "var(--color-surface-hover)", stroke: "var(--color-status-success)", strokeWidth: 1, rx: 6, ry: 6 },
      labelBgPadding: [6, 4],
      style: { strokeWidth: 2, stroke: "var(--color-status-success)", strokeDasharray: "5 5" }
    };
  }
  if (sourceHandle === "false") {
    return {
      label: "False",
      labelStyle: { fill: "var(--color-status-danger)", fontWeight: 700, fontSize: 11, fontFamily: "var(--font-mono)" },
      labelBgStyle: { fill: "var(--color-surface-hover)", stroke: "var(--color-status-danger)", strokeWidth: 1, rx: 6, ry: 6 },
      labelBgPadding: [6, 4],
      style: { strokeWidth: 2, stroke: "var(--color-status-danger)", strokeDasharray: "5 5" }
    };
  }
  return { style: { strokeWidth: 2, stroke: "var(--color-border-focus)", strokeDasharray: "5 5" } };
};

// Converts backend steps to UI nodes, restoring their saved X/Y coordinates
function stepsToGraph(steps) {
  const nodes = steps.map((s) => ({
    id: s.id,
    type: s.step_type,
    // Restore the position invisibly saved inside the config JSON!
    position: s.config?.ui_pos || { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
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

  return { nodes, edges };
}

// Converts UI nodes to backend steps, invisibly saving X/Y coordinates into the config JSON
function graphToSteps(nodes, edges) {
  const steps = nodes.map((n) => ({
    client_id: n.id,
    step_type: n.data.stepType,
    action_key: n.data.actionKey || "",
    // Embed the exact UI coordinates into the backend config so they persist on refresh
    config: { ...n.data.config, ui_pos: n.position },
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
  const [rfInstance, setRfInstance] = useState(null);
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
        setNodes([{ id: nextId(), type: "trigger", position: { x: 150, y: window.innerHeight / 2 - 100 }, data: { stepType: "trigger", actionKey: "webhook", config: {}, order: 0 } }]);
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

  // --- DRAG AND DROP HANDLERS ---
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !rfInstance) return;

      // Calculate the exact drop position based on the current zoom/pan state
      const position = rfInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: nextId(),
        type,
        position,
        data: type === "condition"
            ? { stepType: "condition", config: { field: "", operator: "==", value: "" }, order: nodes.length }
            : { stepType: "action", actionKey: "slack", config: {}, order: nodes.length },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [rfInstance, nodes]
  );
  // ------------------------------

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
      <div className="flex h-full w-full">

        {/* LEFT TOOLBAR */}
        <div className="w-[280px] border-r border-border-default bg-surface flex flex-col z-10 shadow-[5px_0_20px_rgba(0,0,0,0.1)]">
          <div className="p-5 flex flex-col gap-6 flex-1 overflow-y-auto">

            {/* Add Module Cards (Now Draggable!) */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center justify-between">
                Add Module
                <span className="bg-canvas border border-border-default px-1.5 py-0.5 rounded text-[8px] tracking-normal">Drag & Drop</span>
              </span>

              <div
                draggable
                onDragStart={(e) => onDragStart(e, 'condition')}
                className="group flex items-center gap-3 w-full p-2.5 rounded-lg border border-border-default bg-canvas hover:border-accent hover:bg-surface-elevated transition-all text-left shadow-sm cursor-grab active:cursor-grabbing"
              >
                <div className="w-9 h-9 rounded-md bg-surface border border-border-default flex items-center justify-center text-text-secondary group-hover:text-accent group-hover:border-accent/30 transition-colors shadow-inner">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3v18M18 9V3M18 21v-6M12 15V9"/></svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text-primary">Router</span>
                  <span className="text-[10px] text-text-muted font-medium">Split via condition</span>
                </div>
              </div>

              <div
                draggable
                onDragStart={(e) => onDragStart(e, 'action')}
                className="group flex items-center gap-3 w-full p-2.5 rounded-lg border border-border-default bg-canvas hover:border-accent hover:bg-surface-elevated transition-all text-left shadow-sm cursor-grab active:cursor-grabbing"
              >
                <div className="w-9 h-9 rounded-md bg-surface border border-border-default flex items-center justify-center text-text-secondary group-hover:text-accent group-hover:border-accent/30 transition-colors shadow-inner">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text-primary">Action</span>
                  <span className="text-[10px] text-text-muted font-medium">Execute external task</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-border-subtle w-full my-1"></div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-accent hover:bg-accent-hover text-black text-sm font-bold py-2.5 rounded-lg transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(124,92,255,0.3)] flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              {saving ? "Saving..." : "Save Workflow"}
            </button>

            {saveError && (
              <p className="text-status-danger text-xs font-medium bg-status-danger/10 p-2 rounded border border-status-danger/30">
                {saveError}
              </p>
            )}

            {workflow && (
              <div className="mt-2 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  Test Trigger Payload
                </span>

                <div className="bg-canvas border border-border-default rounded-lg overflow-hidden flex flex-col shadow-inner">
                  <div className="bg-surface-elevated border-b border-border-default px-3 py-1.5 flex items-center">
                    <span className="text-[10px] font-mono text-text-muted">payload.json</span>
                  </div>
                  <textarea
                    className="w-full bg-transparent p-3 text-xs text-text-secondary font-mono h-32 outline-none focus:text-text-primary transition-colors resize-none"
                    value={testPayload}
                    onChange={(e) => setTestPayload(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleTestRun}
                  className="w-full text-sm font-bold py-2.5 rounded-lg bg-surface-elevated border border-border-default hover:border-text-primary hover:bg-surface-hover text-text-primary transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Fire Payload
                </button>

                {testError && <p className="text-status-danger text-xs mt-1">{testError}</p>}

                {testRunId && (
                  <div className="mt-2 p-3 bg-surface border border-border-default rounded-lg flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary">Execution Status</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider border ${
                        runStatus === "success" ? "bg-status-success/10 text-status-success border-status-success/20" :
                        runStatus === "failed" ? "bg-status-danger/10 text-status-danger border-status-danger/20" :
                        "bg-accent/10 text-accent border-accent/20 animate-pulse"
                      }`}>
                        {runStatus ? runStatus : "RUNNING"}
                      </span>
                    </div>
                    <Link to={`/workflows/${id}/runs`} className="text-accent text-[11px] font-semibold hover:underline mt-1 flex items-center gap-1">
                      View full run logs <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* WORKFLOW CANVAS */}
        <div className="flex-1 bg-canvas relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onInit={setRfInstance}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelected(node)}
            onEdgeClick={onEdgeClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{ type: 'smoothstep', interactionWidth: 40 }}

            /* Enhanced Key Bindings & Behaviors */
            panOnScroll={true}
            zoomActivationKeyCode="Control"
            panActivationKeyCode="Space"
            deleteKeyCode={['Backspace', 'Delete']}
            selectionKeyCode="Shift"
            multiSelectionKeyCode="Shift"
            fitView
            fitViewOptions={{ padding: 0.3 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="var(--color-border-subtle)" gap={24} size={2} />

            {/* CUSTOM UI PANELS */}
            <Panel position="bottom-left" className="m-5">
              <div className="group relative">
                <button className="w-9 h-9 rounded-lg bg-surface border border-border-default flex items-center justify-center text-text-muted hover:text-text-primary hover:border-border-focus transition-all shadow-lg hover:bg-surface-hover">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </button>
                {/* Shortcuts Tooltip */}
                <div className="absolute bottom-full left-0 mb-3 w-56 bg-surface border border-border-default rounded-xl p-4 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none translate-y-2 group-hover:translate-y-0">
                  <p className="text-[10px] font-bold text-text-muted mb-3 uppercase tracking-widest">Keyboard Shortcuts</p>
                  <div className="flex flex-col gap-2.5 text-xs text-text-secondary font-medium">
                    <div className="flex justify-between items-center"><span>Pan Canvas</span><kbd className="bg-canvas border border-border-default px-1.5 py-0.5 rounded text-text-primary font-mono text-[10px]">Space + Drag</kbd></div>
                    <div className="flex justify-between items-center"><span>Pan Canvas</span><kbd className="bg-canvas border border-border-default px-1.5 py-0.5 rounded text-text-primary font-mono text-[10px]">Scroll</kbd></div>
                    <div className="flex justify-between items-center"><span>Zoom In/Out</span><kbd className="bg-canvas border border-border-default px-1.5 py-0.5 rounded text-text-primary font-mono text-[10px]">Ctrl + Scroll</kbd></div>
                    <div className="flex justify-between items-center"><span>Multi-select</span><kbd className="bg-canvas border border-border-default px-1.5 py-0.5 rounded text-text-primary font-mono text-[10px]">Shift + Drag</kbd></div>
                    <div className="flex justify-between items-center"><span>Delete Node</span><kbd className="bg-canvas border border-border-default px-1.5 py-0.5 rounded text-text-primary font-mono text-[10px]">Backspace</kbd></div>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel position="bottom-right" className="m-5 flex flex-col gap-2">
              <div className="bg-surface border border-border-default rounded-lg p-1 shadow-lg flex flex-col gap-1">
                <button onClick={() => rfInstance?.zoomIn({ duration: 300 })} className="w-8 h-8 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <div className="h-px w-6 bg-border-subtle mx-auto"></div>
                <button onClick={() => rfInstance?.fitView({ duration: 800, padding: 0.3 })} className="w-8 h-8 rounded-md flex items-center justify-center text-[#71717a] hover:text-white hover:bg-[#18181b] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                </button>
                <div className="h-px w-6 bg-border-subtle mx-auto"></div>
                <button onClick={() => rfInstance?.zoomOut({ duration: 300 })} className="w-8 h-8 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </div>
            </Panel>

          </ReactFlow>
        </div>

        {/* RIGHT CONFIGURATION SIDEBAR */}
        {selected && (
          <div className="w-[340px] border-l border-border-default bg-surface p-6 z-10 shadow-[-10px_0_20px_rgba(0,0,0,0.3)] flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-border-subtle">
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest">
                Configure Module
              </p>
              <button onClick={() => setSelected(null)} className="text-text-muted hover:text-white text-xl leading-none">&times;</button>
            </div>

            {selected.data.stepType === "trigger" && (
              <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-text-primary">Trigger Type</label>
                  <select
                    className="bg-canvas border border-border-default rounded-lg px-3 py-2.5 text-sm font-medium text-text-primary focus:border-accent outline-none shadow-inner cursor-pointer"
                    value={selected.data.actionKey || "webhook"}
                    onChange={(e) => updateSelectedData({ actionKey: e.target.value, config: {} })}
                  >
                    <option value="webhook">Incoming Webhook</option>
                    <option value="schedule">Scheduled Interval (Cron)</option>
                  </select>
                </div>

                {selected.data.actionKey === "schedule" ? (
                  <div className="flex flex-col gap-4 mt-2 bg-canvas p-4 rounded-lg border border-border-default shadow-inner">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-text-primary">Interval (Minutes)</label>
                      <input
                        type="number"
                        className="bg-surface border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus:border-accent outline-none"
                        placeholder="15"
                        value={selected.data.config.interval || ""}
                        onChange={(e) => updateSelectedData({ config: { ...selected.data.config, interval: e.target.value } })}
                      />
                    </div>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      This workflow will run autonomously every <strong className="text-accent">{selected.data.config.interval || 15} minutes</strong> based on the Celery Beat scheduler.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 mt-2">
                    <p className="text-text-muted text-xs leading-relaxed">
                      Send a POST request to this URL with your JSON payload to trigger the automation.
                    </p>
                    <div className="bg-canvas border border-border-default rounded-lg p-4 flex flex-col gap-4 shadow-inner">
                      <code className="text-xs text-accent break-all font-mono">
                        {import.meta.env.VITE_API_URL}{workflow?.webhook_url}
                      </code>
                      <button onClick={() => navigator.clipboard.writeText(`${import.meta.env.VITE_API_URL}${workflow?.webhook_url}`)}
                        className="bg-surface-elevated hover:bg-surface-hover border border-border-default text-text-primary px-3 py-2 rounded-md text-xs font-semibold transition-all shadow-md"
                      >
                        Copy Webhook URL
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selected.data.stepType === "condition" && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-text-primary">Field to check</label>
                  <input
                    className="bg-canvas border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent outline-none transition-colors shadow-inner"
                    placeholder="e.g. trigger.budget"
                    value={selected.data.config.field || ""}
                    onChange={(e) => updateSelectedData({ config: { ...selected.data.config, field: e.target.value } })}
                  />
                  <div className="flex flex-col gap-2 mt-2 p-3 bg-canvas rounded-lg border border-border-subtle">
                    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Insert Path</span>
                    <div className="flex flex-wrap gap-2">
                      {getAvailableVariables().map((key) => (
                        <button key={key} onClick={() => updateSelectedData({ config: { ...selected.data.config, field: `trigger.${key}` } })}
                          className="text-[11px] font-mono bg-surface border border-border-default px-2 py-1.5 rounded hover:border-accent text-text-secondary transition-all shadow-sm"
                        >+ trigger.{key}</button>
                      ))}
                      {upstreamActions.map((node) => {
                        const defaultPath = node.data.actionKey === "groq_ai" ? ".reply" : "";
                        return (
                          <button key={node.id} onClick={() => updateSelectedData({ config: { ...selected.data.config, field: `${node.id}${defaultPath}` } })}
                            className="text-[11px] font-mono bg-surface border border-border-default px-2 py-1.5 rounded hover:border-accent text-accent transition-all shadow-sm"
                          >+ {INTEGRATIONS[node.data.actionKey]?.name || node.data.actionKey}</button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-text-primary">Condition Operator</label>
                  <select
                    className="bg-canvas border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent outline-none transition-colors shadow-inner appearance-none cursor-pointer"
                    value={selected.data.config.operator || "=="}
                    onChange={(e) => updateSelectedData({ config: { ...selected.data.config, operator: e.target.value } })}
                  >
                    {["==", "!=", ">", "<", ">=", "<=", "contains"].map((op) => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-text-primary">Target Value</label>
                  <input
                    className="bg-canvas border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent outline-none transition-colors shadow-inner"
                    placeholder="e.g. 5000"
                    value={selected.data.config.value || ""}
                    onChange={(e) => updateSelectedData({ config: { ...selected.data.config, value: e.target.value } })}
                  />
                </div>
              </div>
            )}

            {selected.data.stepType === "action" && (
            <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <select
                className="bg-canvas border border-border-default rounded-lg px-3 py-2.5 text-sm font-medium text-text-primary focus:border-accent outline-none transition-all shadow-inner appearance-none cursor-pointer"
                value={selected.data.actionKey}
                onChange={(e) => updateSelectedData({ actionKey: e.target.value, config: {} })}
              >
                {Object.entries(INTEGRATIONS).map(([key, config]) => (
                  <option key={key} value={key}>{config.name}</option>
                ))}
              </select>

              <div className="flex flex-col gap-6 mt-2">
                {INTEGRATIONS[selected.data.actionKey]?.fields.map((field) => (
                  <div key={field.key} className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-text-primary">{field.label}</label>

                    {field.type === "textarea" ? (
                      <textarea
                        className="bg-canvas border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent outline-none transition-colors h-24 resize-none shadow-inner"
                        placeholder={field.placeholder}
                        value={selected.data.config[field.key] || ""}
                        onChange={(e) => updateSelectedData({ config: { ...selected.data.config, [field.key]: e.target.value } })}
                      />
                    ) : field.type === "select" ? (
                      <select
                        className="bg-canvas border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent outline-none transition-colors shadow-inner appearance-none cursor-pointer"
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
                        className="bg-canvas border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent outline-none transition-colors shadow-inner"
                        placeholder={field.placeholder}
                        value={selected.data.config[field.key] || ""}
                        onChange={(e) => updateSelectedData({ config: { ...selected.data.config, [field.key]: e.target.value } })}
                      />
                    )}

                    <div className="flex flex-col gap-2 mt-1 p-3 bg-canvas rounded-lg border border-border-subtle shadow-inner">
                      <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Insert Variables</span>
                      <div className="flex flex-wrap gap-2">
                        {getAvailableVariables().map((key) => (
                          <button key={`trigger-${key}`} type="button"
                            onClick={() => {
                              const currentVal = selected.data.config[field.key] || "";
                              updateSelectedData({ config: { ...selected.data.config, [field.key]: currentVal + `{{trigger.${key}}}` } });
                            }}
                            className="text-[11px] font-mono bg-surface border border-border-default px-2 py-1.5 rounded hover:border-accent text-text-secondary transition-all shadow-sm"
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
                              className="text-[11px] font-mono bg-surface border border-border-default px-2 py-1.5 rounded hover:border-accent text-accent transition-all shadow-sm"
                            >+ {INTEGRATIONS[node.data.actionKey]?.name || node.data.actionKey}</button>
                          );
                        })}
                        {getAvailableVariables().length === 0 && upstreamActions.length === 0 && (
                          <span className="text-[11px] text-text-muted italic">No variables available</span>
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
