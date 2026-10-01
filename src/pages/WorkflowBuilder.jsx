import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactFlow, { Background, addEdge, useNodesState, useEdgesState, Panel, ConnectionMode } from "reactflow";
import "reactflow/dist/style.css";

import { nodeTypes, ConfirmModal } from "../flow/nodes";
import { getWorkflow, saveSteps, getCredentials } from "../api/workflows";
import { useRunSocket } from "../hooks/useRunSocket";
import { INTEGRATIONS } from "../config/integrations";

import {
  BlocksIcon,
  WorkflowIcon,
  SaveIcon,
  BotMessageSquareIcon,
  NetworkIcon,
  DiscordIcon,
  GithubIcon,
  FileSheetIcon,
  SlackIcon,
  RobotIcon
} from "../components/icons";

// ADDED Mail ICON
import { Play, ExternalLink, HelpCircle, ZoomIn, Maximize, ZoomOut, Lock, Settings2, Mail } from "lucide-react";

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

function stepsToGraph(steps) {
  const safeSteps = steps.map(s => ({
    ...s,
    client_id: s.client_id || nextId()
  }));

  const nodes = safeSteps.map((s) => ({
    id: s.client_id,
    type: s.step_type,
    position: s.config?.ui_pos || { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
    data: { actionKey: s.action_key, appEvent: s.app_event, config: s.config, stepType: s.step_type, order: s.order },
  }));

  const edges = safeSteps
    .filter((s) => s.parent_client_id)
    .map((s) => {
      const sourceHandle = s.branch || "out";
      return {
        id: `${s.parent_client_id}-${s.client_id}`,
        source: s.parent_client_id,
        target: s.client_id,
        sourceHandle: sourceHandle,
        ...getEdgeStyling(sourceHandle)
      };
    });

  return { nodes, edges };
}

function graphToSteps(nodes, edges) {
  const steps = nodes.map((n) => {
    let safeConfig = n.data.config;

    if (typeof safeConfig === "string") {
      try {
        safeConfig = JSON.parse(safeConfig);
      } catch {
        safeConfig = {};
      }
    }

    if (safeConfig && typeof safeConfig === "object" && safeConfig["0"] !== undefined && safeConfig.field === undefined) {
      safeConfig = {};
    }

    return {
      client_id: n.id,
      step_type: n.data.stepType,
      action_key: n.data.actionKey || "",
      app_event: n.data.appEvent || "",
      config: { ...(safeConfig || {}), ui_pos: n.position },
      order: n.data.order ?? 0,
      parent_client_id: null,
      branch: "",
    };
  });

  edges.forEach((e) => {
    const child = steps.find((s) => s.client_id === e.target);
    if (!child) return;
    child.parent_client_id = e.source;
    child.branch = e.sourceHandle === "true" || e.sourceHandle === "false" ? e.sourceHandle : "";
  });

  return steps;
}

// ADDED EMAIL ICON SUPPORT
const getIntegrationIcon = (key) => {
  switch (key) {
    case 'discord': return <DiscordIcon className="w-5 h-5" />;
    case 'github': return <GithubIcon className="w-5 h-5 text-white" />;
    case 'google_sheets': return <FileSheetIcon className="w-5 h-5" />;
    case 'slack': return <SlackIcon className="w-5 h-5" />;
    case 'groq_ai': return <RobotIcon className="w-5 h-5 text-orange-500" />;
    case 'email': return <Mail className="w-5 h-5 text-blue-400" />;
    case 'notion': return (
      <div className="w-5 h-5 bg-zinc-100 text-black font-serif font-bold flex items-center justify-center rounded-[4px] text-xs">
        N
      </div>
    );
    default: return <WorkflowIcon className="w-5 h-5" />;
  }
};

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

  const [vaultKeys, setVaultKeys] = useState([]);
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
    Promise.all([getWorkflow(id), getCredentials()]).then(([wf, creds]) => {
      setWorkflow(wf);
      setVaultKeys(creds);

      const { nodes: n, edges: e } = stepsToGraph(wf.steps);
      if (n.length === 0) {
        setNodes([{ id: nextId(), type: "trigger", position: { x: 150, y: window.innerHeight / 2 - 100 }, data: { stepType: "trigger", actionKey: "webhook", appEvent: "", config: {}, order: 0 } }]);
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
            : { stepType: type, actionKey: "", appEvent: "", config: {}, order: nodes.length },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [rfInstance, nodes]
  );

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

  const renderField = (field, isAuthKey, isSecuredInVault) => {
    return (
      <div key={field.key} className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-text-primary">{field.label}</label>
          {isSecuredInVault && (
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#34d399] bg-[#141d17] border border-[#1b3a27] px-1.5 py-0.5 rounded shadow-sm">
              <Lock className="w-2.5 h-2.5" /> Vault Secured
            </span>
          )}
        </div>

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
            value={selected.data.config[field.key] || (field.options[0]?.value || "")}
            onChange={(e) => updateSelectedData({ config: { ...selected.data.config, [field.key]: e.target.value } })}
          >
            {field.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={isAuthKey ? "password" : "text"}
            autoComplete="new-password"
            className={`bg-canvas border border-border-default rounded-lg px-3 py-2.5 text-sm outline-none transition-colors shadow-inner ${isSecuredInVault && !selected.data.config[field.key] ? 'placeholder-[#34d399]/40 text-[#34d399] focus:border-[#34d399]' : 'text-text-primary focus:border-accent'}`}
            placeholder={isSecuredInVault ? "Leave blank to use Vault connection" : field.placeholder}
            value={selected.data.config[field.key] || ""}
            onChange={(e) => updateSelectedData({ config: { ...selected.data.config, [field.key]: e.target.value } })}
          />
        )}

        {!isAuthKey && (
          <div className="flex flex-col gap-2 mt-1 p-3 bg-canvas rounded-lg border border-border-subtle shadow-inner">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Insert Variables</span>
            <div className="flex flex-wrap gap-2">
              {getAvailableVariables().map((key) => (
                <button key={`trigger-${key}`} type="button"
                  onClick={() => {
                    const currentVal = selected.data.config[field.key] || "";
                    updateSelectedData({ config: { ...selected.data.config, [field.key]: currentVal + `{{trigger.${key}}}` } });
                  }}
                  className="text-[11px] font-mono bg-surface border border-border-default px-2 py-1.5 rounded hover:border-accent text-text-secondary transition-all shadow-sm hover:scale-105"
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
                    className="text-[11px] font-mono bg-surface border border-border-default px-2 py-1.5 rounded hover:border-accent text-accent transition-all shadow-sm hover:scale-105"
                  >+ {INTEGRATIONS[node.data.actionKey]?.name || node.data.actionKey}</button>
                );
              })}
              {getAvailableVariables().length === 0 && upstreamActions.length === 0 && (
                <span className="text-[11px] text-text-muted italic">No upstream variables available</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-1 w-full relative overflow-hidden h-full">

        {/* LEFT TOOLBAR */}
        <div className="w-[280px] border-r border-border-default bg-surface flex flex-col z-10 shadow-[5px_0_20px_rgba(0,0,0,0.1)]">
          <div className="p-5 flex flex-col gap-6 flex-1 overflow-y-auto">
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
                  <BlocksIcon className="w-[18px] h-[18px] stroke-[2]" />
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
                  <WorkflowIcon className="w-[18px] h-[18px] stroke-[2]" />
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
              <SaveIcon className="w-4 h-4" />
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
                  <BotMessageSquareIcon className="w-3.5 h-3.5" />
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
                  <Play className="w-3.5 h-3.5 fill-current" />
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
                    <Link to={`/history`} className="text-accent text-[11px] font-semibold hover:underline mt-1 flex items-center gap-1.5">
                      View full run logs <ExternalLink className="w-3 h-3" />
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
            onPaneClick={() => setSelected(null)}
            onEdgeClick={onEdgeClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            defaultEdgeOptions={{ type: 'smoothstep', interactionWidth: 40 }}
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

            <Panel position="bottom-left" className="m-5">
              <div className="group relative">
                <button className="w-9 h-9 rounded-lg bg-surface border border-border-default flex items-center justify-center text-text-muted hover:text-text-primary hover:border-border-focus transition-all shadow-lg hover:bg-surface-hover">
                  <HelpCircle className="w-4 h-4" />
                </button>
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
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="h-px w-6 bg-border-subtle mx-auto"></div>
                <button onClick={() => rfInstance?.fitView({ duration: 800, padding: 0.3 })} className="w-8 h-8 rounded-md flex items-center justify-center text-[#71717a] hover:text-white hover:bg-[#18181b] transition-colors">
                  <Maximize className="w-3.5 h-3.5" />
                </button>
                <div className="h-px w-6 bg-border-subtle mx-auto"></div>
                <button onClick={() => rfInstance?.zoomOut({ duration: 300 })} className="w-8 h-8 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors">
                  <ZoomOut className="w-4 h-4" />
                </button>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* RIGHT CONFIGURATION SIDEBAR */}
        {selected && (
          // CSS FIX: Added `max-w-full` so it doesn't break boundaries, and reduced horizontal padding slightly.
          <div className="w-[340px] max-w-[85vw] border-l border-border-default bg-surface px-5 py-6 z-10 shadow-[-10px_0_20px_rgba(0,0,0,0.3)] flex flex-col overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-border-subtle shrink-0">
              <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest">
                Configure Module
              </p>
              <button onClick={() => setSelected(null)} className="text-text-muted hover:text-white text-xl leading-none">&times;</button>
            </div>

            {/* ROUTER / CONDITION NODE CONFIGURATION */}
            {selected.data.stepType === "condition" && (
              <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-text-primary">Field to check</label>
                  <input
                    className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent outline-none transition-colors shadow-inner"
                    placeholder="e.g. trigger.budget"
                    value={selected.data.config.field || ""}
                    onChange={(e) => updateSelectedData({ config: { ...selected.data.config, field: e.target.value } })}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-text-primary">Condition Operator</label>
                  <select
                    className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent outline-none transition-colors shadow-inner appearance-none cursor-pointer"
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
                    className="w-full bg-canvas border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-accent outline-none transition-colors shadow-inner"
                    placeholder="e.g. 5000"
                    value={selected.data.config.value || ""}
                    onChange={(e) => updateSelectedData({ config: { ...selected.data.config, value: e.target.value } })}
                  />
                </div>
              </div>
            )}

            {/* TRIGGER OR ACTION CONFIGURATION (The Hierarchical Stepper) */}
            {(selected.data.stepType === "trigger" || selected.data.stepType === "action") && (
              <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-300 h-full">

                {/* STEP 1: SELECT APP */}
                {!selected.data.actionKey ? (
                  <div className="flex flex-col gap-6 pb-6">
                    <div>
                      <h3 className="text-sm font-bold text-text-primary mb-1">Choose an Application</h3>
                      <p className="text-xs text-text-muted">Select an integration for this {selected.data.stepType}.</p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Built-in Modules</span>
                      {selected.data.stepType === "trigger" && (
                        <>
                          <button onClick={() => updateSelectedData({ actionKey: "webhook", appEvent: "webhook_in", config: {} })} className="group flex items-center gap-3 w-full p-3 rounded-xl border border-border-default bg-canvas hover:border-accent transition-all text-left shadow-sm">
                            <div className="w-10 h-10 shrink-0 rounded-lg bg-surface border border-border-default flex items-center justify-center shadow-inner group-hover:border-accent/30"><NetworkIcon className="w-5 h-5" /></div>
                            <div className="flex flex-col truncate"><span className="text-sm font-bold text-text-primary truncate">Incoming Webhook</span><span className="text-[10px] text-text-muted truncate">Trigger via HTTP POST</span></div>
                          </button>
                          <button onClick={() => updateSelectedData({ actionKey: "schedule", appEvent: "schedule_run", config: {} })} className="group flex items-center gap-3 w-full p-3 rounded-xl border border-border-default bg-canvas hover:border-accent transition-all text-left shadow-sm">
                            <div className="w-10 h-10 shrink-0 rounded-lg bg-surface border border-border-default flex items-center justify-center shadow-inner group-hover:border-accent/30"><NetworkIcon className="w-5 h-5 text-accent" /></div>
                            <div className="flex flex-col truncate"><span className="text-sm font-bold text-text-primary truncate">Schedule (Cron)</span><span className="text-[10px] text-text-muted truncate">Run on a fixed interval</span></div>
                          </button>
                        </>
                      )}
                      {selected.data.stepType === "action" && (
                        <button onClick={() => updateSelectedData({ actionKey: "http", appEvent: "custom_request", config: {} })} className="group flex items-center gap-3 w-full p-3 rounded-xl border border-border-default bg-canvas hover:border-accent transition-all text-left shadow-sm overflow-hidden">
                          <div className="w-10 h-10 shrink-0 rounded-lg bg-surface border border-border-default flex items-center justify-center text-blue-500 shadow-inner group-hover:border-accent/30"><NetworkIcon className="w-5 h-5" /></div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-bold text-text-primary truncate block w-full">HTTP Request</span>
                            <span className="text-[10px] text-text-muted truncate block w-full">Send custom API requests</span>
                          </div>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Integrations</span>
                      <div className="grid grid-cols-1 gap-2">
                        {Object.entries(INTEGRATIONS).filter(([_, config]) =>
                          (selected.data.stepType === "trigger" ? Object.keys(config.triggers || {}).length > 0 : Object.keys(config.actions || {}).length > 0)
                        ).map(([key, config]) => (
                          <button
                            key={key}
                            onClick={() => updateSelectedData({ actionKey: key, appEvent: "", config: {} })}
                            className="group flex items-center gap-3 w-full p-3 rounded-xl border border-border-default bg-canvas hover:border-accent hover:bg-surface-elevated transition-all text-left shadow-sm overflow-hidden"
                          >
                            <div className="w-10 h-10 shrink-0 rounded-lg bg-surface border border-border-default flex items-center justify-center shadow-inner group-hover:border-accent/30 text-text-secondary">
                              {getIntegrationIcon(key)}
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors truncate block w-full">{config.name}</span>
                            </div>
                            {vaultKeys.includes(key) && (
                              <div className="shrink-0 ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-status-success/10 border border-status-success/30 text-status-success">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (

                  /* STEP 2 & 3: APP SELECTED -> CHOOSE EVENT & CONFIGURE */
                  <div className="flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200 pb-6">

                    <div className="flex items-center justify-between bg-canvas border border-border-default rounded-lg p-2 shadow-inner w-full">
                      <div className="flex items-center gap-2 px-2 overflow-hidden">
                        <WorkflowIcon className="w-4 h-4 text-accent shrink-0" />
                        <span className="text-xs font-bold text-white truncate">{INTEGRATIONS[selected.data.actionKey]?.name || selected.data.actionKey.toUpperCase()}</span>
                      </div>
                      <button onClick={() => updateSelectedData({ actionKey: "", appEvent: "", config: {} })} className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-md bg-surface hover:bg-surface-hover border border-border-default text-text-muted hover:text-white transition-colors shadow-sm">
                        Change App
                      </button>
                    </div>

                    {/* Step 2: Select Event Dropdown (Skip for built-ins) */}
                    {INTEGRATIONS[selected.data.actionKey] && (
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-text-primary">{selected.data.stepType === "trigger" ? "Trigger Event" : "Action Event"}</label>
                        <select
                          className="w-full bg-[#09090b] border border-[#222222] rounded-lg px-3 py-2.5 text-sm font-medium text-white focus:border-[#52525b] outline-none shadow-inner cursor-pointer"
                          value={selected.data.appEvent || ""}
                          onChange={(e) => updateSelectedData({ appEvent: e.target.value, config: {} })}
                        >
                          <option value="" disabled>Select an event...</option>
                          {Object.entries(selected.data.stepType === "trigger" ? INTEGRATIONS[selected.data.actionKey].triggers : INTEGRATIONS[selected.data.actionKey].actions).map(([eventKey, eventConfig]) => (
                            <option key={eventKey} value={eventKey}>{eventConfig.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Step 3: Vault Connection Check & Configuration Mapping */}
                    {selected.data.appEvent && (
                      <div className="animate-in slide-in-from-bottom-2 mt-2 pt-5 border-t border-border-subtle">
                        <div className="flex items-center gap-2 mb-4">
                          <Settings2 className="w-4 h-4 text-text-muted" />
                          <h4 className="text-sm font-bold text-white">Setup</h4>
                        </div>

                        {selected.data.actionKey !== "http" && selected.data.actionKey !== "webhook" && selected.data.actionKey !== "schedule" && selected.data.actionKey !== "email" && !vaultKeys.includes(selected.data.actionKey) ? (
                          <div className="flex flex-col items-center justify-center text-center p-6 border border-dashed border-border-focus rounded-xl bg-canvas mt-2 shadow-sm w-full">
                            <div className="w-10 h-10 rounded-full bg-status-danger/10 text-status-danger flex items-center justify-center mb-3 shadow-inner"><Lock className="w-5 h-5" /></div>
                            <h4 className="text-sm font-bold text-white mb-2">Connection Required</h4>
                            <p className="text-xs text-text-muted mb-4 leading-relaxed">Please authenticate with {INTEGRATIONS[selected.data.actionKey]?.name} to map these fields.</p>
                            <Link to="/integrations" target="_blank" className="w-full bg-white text-black hover:bg-gray-200 text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md">
                              Go to Vault <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-6">
                            {/* Special case renders for built-in triggers */}
                            {selected.data.actionKey === "webhook" && (
                              <div className="flex flex-col gap-4">
                                <p className="text-[#a1a1aa] text-xs leading-relaxed">Send a POST request to this URL to trigger this workflow.</p>
                                <div className="bg-[#09090b] border border-[#222222] rounded-lg p-4 flex flex-col gap-4 shadow-inner">
                                  <code className="text-xs text-white break-all font-mono">{import.meta.env.VITE_API_URL}{workflow?.webhook_url}</code>
                                  <button onClick={() => navigator.clipboard.writeText(`${import.meta.env.VITE_API_URL}${workflow?.webhook_url}`)} className="w-full bg-[#111111] border border-[#222222] text-white px-3 py-2 rounded-md text-xs font-semibold">Copy Webhook URL</button>
                                </div>
                              </div>
                            )}

                            {selected.data.actionKey === "schedule" && (
                              <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-white">Interval (Minutes)</label>
                                <input type="number" className="w-full bg-[#111111] border border-[#222222] rounded-lg px-3 py-2 text-sm text-white outline-none" placeholder="15" value={selected.data.config.interval || ""} onChange={(e) => updateSelectedData({ config: { ...selected.data.config, interval: e.target.value } })} />
                              </div>
                            )}

                            {/* Standard dynamic field rendering from config */}
                            {INTEGRATIONS[selected.data.actionKey]?.[selected.data.stepType === "trigger" ? "triggers" : "actions"]?.[selected.data.appEvent]?.fields?.map((field) => {
                              const isAuthKey = field.key === "webhook_url" || field.key === "api_key";
                              const isSecuredInVault = isAuthKey && vaultKeys.includes(selected.data.actionKey);
                              return renderField(field, isAuthKey, isSecuredInVault);
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal isOpen={!!edgeToDelete} onClose={() => setEdgeToDelete(null)} onConfirm={confirmEdgeDelete} title="Remove Connection" message="Are you sure you want to remove this connection line?" />
    </>
  );
}
