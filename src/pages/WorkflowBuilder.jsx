import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactFlow, { Background, BackgroundVariant, MarkerType, addEdge, useNodesState, useEdgesState, Panel, ConnectionMode } from "reactflow";
import "reactflow/dist/style.css";

import RichInput from "../components/RichInput";
import { nodeTypes, ConfirmModal } from "../flow/nodes";
import { getWorkflow, saveSteps, getCredentials, getGlobalHistory, fetchTriggerSchema } from "../api/workflows";
import { useRunSocket } from "../hooks/useRunSocket";
import { INTEGRATIONS } from "../config/integrations";

import {
  BlocksIcon,
  WorkflowIcon,
  SaveIcon,
  BotMessageSquareIcon,
  NetworkIcon,
  RotateCcwClockIcon,
  DiscordIcon,
  GithubIcon,
  FileSheetIcon,
  SlackIcon,
  RobotIcon
} from "../components/icons";

import { Play, ExternalLink, HelpCircle, ZoomIn, Maximize, ZoomOut, Lock, Mail, X, RefreshCw, ShieldCheck, LayoutGrid, Plus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";

let idCounter = 0;
const nextId = () => `n${Date.now()}_${idCounter++}`;

// Keep EDGE.bg equal to your page background (label chips sit on it).
const EDGE = {
  default: "#52525b",
  success: "#10b981",
  destructive: "#ef4444",
  bg: "#121212",
};

const arrow = (color) => ({ type: MarkerType.ArrowClosed, color, width: 14, height: 14 });

const getEdgeStyling = (sourceHandle) => {
  if (sourceHandle === "true") {
    return {
      label: "True",
      labelStyle: { fill: EDGE.success, fontWeight: 600, fontSize: 10, fontFamily: "monospace" },
      labelBgStyle: { fill: EDGE.bg, stroke: EDGE.success, strokeWidth: 1, rx: 4, ry: 4 },
      labelBgPadding: [6, 3],
      markerEnd: arrow(EDGE.success),
      style: { strokeWidth: 1.5, stroke: EDGE.success }
    };
  }
  if (sourceHandle === "false") {
    return {
      label: "False",
      labelStyle: { fill: EDGE.destructive, fontWeight: 600, fontSize: 10, fontFamily: "monospace" },
      labelBgStyle: { fill: EDGE.bg, stroke: EDGE.destructive, strokeWidth: 1, rx: 4, ry: 4 },
      labelBgPadding: [6, 3],
      markerEnd: arrow(EDGE.destructive),
      style: { strokeWidth: 1.5, stroke: EDGE.destructive }
    };
  }
  return { markerEnd: arrow(EDGE.default), style: { strokeWidth: 1.5, stroke: EDGE.default } };
};

const COL_W = 330;
const ROW_H = 170;

function autoLayout(nodes, edges) {
  const kids = {}, parents = {}, deg = {};
  nodes.forEach((n) => { kids[n.id] = []; parents[n.id] = []; deg[n.id] = 0; });
  edges.forEach((e) => {
    if (!kids[e.source] || !parents[e.target]) return;
    kids[e.source].push(e);
    parents[e.target].push(e.source);
    deg[e.target]++;
  });

  const level = {};
  const queue = nodes.filter((n) => deg[n.id] === 0).map((n) => n.id);
  queue.forEach((id) => (level[id] = 0));
  const d = { ...deg };
  while (queue.length) {
    const id = queue.shift();
    kids[id].forEach((e) => {
      level[e.target] = Math.max(level[e.target] ?? 0, level[id] + 1);
      if (--d[e.target] === 0) queue.push(e.target);
    });
  }

  const cols = {};
  nodes.forEach((n) => {
    const l = level[n.id] ?? 0;
    (cols[l] = cols[l] || []).push(n.id);
  });

  const row = {};
  const pos = {};
  Object.keys(cols).map(Number).sort((a, b) => a - b).forEach((l) => {
    const ids = cols[l];
    const rank = (id) => {
      const ps = parents[id];
      if (!ps.length) return 0;
      const pr = Math.min(...ps.map((p) => row[p] ?? 0));
      const edge = edges.find((e) => e.target === id);
      return pr * 10 + (edge?.sourceHandle === "false" ? 1 : 0);
    };
    ids.sort((a, b) => rank(a) - rank(b));
    ids.forEach((id, i) => { row[id] = i; });
    const offset = ((ids.length - 1) * ROW_H) / 2;
    ids.forEach((id, i) => { pos[id] = { x: l * COL_W, y: i * ROW_H - offset }; });
  });

  return nodes.map((n) => ({ ...n, position: pos[n.id] || n.position }));
}

function stepsToGraph(steps) {
  const safeSteps = steps.map(s => ({
    ...s,
    client_id: s.client_id || nextId()
  }));

  const nodes = safeSteps.map((s) => ({
    id: s.client_id,
    type: s.step_type,
    position: s.config?.ui_pos || { x: 0, y: 0 },
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
      try { safeConfig = JSON.parse(safeConfig); } catch { safeConfig = {}; }
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

const getIntegrationIcon = (key) => {
  switch (key) {
    case 'discord': return <DiscordIcon className="w-4 h-4 text-[#5865F2]" />;
    case 'github': return <GithubIcon className="w-4 h-4 text-foreground" />;
    case 'google_sheets': return <FileSheetIcon className="w-4 h-4 text-[#0F9D58]" />;
    case 'slack': return <SlackIcon className="w-4 h-4" />;
    case 'groq_ai': return <RobotIcon className="w-4 h-4 text-orange-500" />;
    case 'email': return <Mail className="w-4 h-4 text-blue-400" />;
    case 'notion': return <div className="w-4 h-4 bg-foreground text-background font-serif font-bold flex items-center justify-center rounded-[3px] text-[10px]">N</div>;
    case 'webhook': return <NetworkIcon className="w-4 h-4 text-foreground" />;
    case 'http': return <NetworkIcon className="w-4 h-4 text-blue-500" />;
    case 'schedule': return <RotateCcwClockIcon className="w-4 h-4 text-foreground" />;
    default: return <WorkflowIcon className="w-4 h-4" />;
  }
};

const BUILTIN_NAMES = { webhook: "Incoming Webhook", schedule: "Schedule", http: "HTTP Request" };

const ctrlBtn = "w-7 h-7 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors";
const sectionLabel = "text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider";
const addCard = "group flex items-center gap-2.5 w-full p-2 rounded-md border border-border bg-card hover:bg-accent hover:border-muted-foreground/40 transition-colors text-left cursor-grab active:cursor-grabbing";

export default function WorkflowBuilder() {
  const { id } = useParams();
  const [rfInstance, setRfInstance] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selected, setSelected] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);

  const [triggerSchema, setTriggerSchema] = useState(null);
  const [isFetchingSchema, setIsFetchingSchema] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [testRunId, setTestRunId] = useState(null);
  const [starting, setStarting] = useState(false);
  const [edgeToDelete, setEdgeToDelete] = useState(null);
  const [vaultKeys, setVaultKeys] = useState([]);

  const { stepStatus, runStatus: socketRunStatus } = useRunSocket(testRunId);
  const [localRunStatus, setLocalRunStatus] = useState("");
  const displayRunStatus = localRunStatus || socketRunStatus;

  const isRunning = !!testRunId && (!displayRunStatus || ["running", "pending"].includes(displayRunStatus.toLowerCase()));
  const runBusy = starting || isRunning || isFetchingSchema;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const fitOpts = { padding: 0.25, minZoom: isMobile ? 0.5 : 0.3, maxZoom: 1 };

  const notify = useCallback((type, message) => {
    setNotice({ type, message });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3500);
  }, []);
  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const currentSnapshot = useMemo(
    () => (workflow ? JSON.stringify(graphToSteps(nodes, edges)) : ""),
    [nodes, edges, workflow]
  );
  const dirty = !!workflow && savedSnapshot !== "" && currentSnapshot !== savedSnapshot;

  const displayEdges = useMemo(
    () => (isRunning ? edges.map((e) => ({ ...e, animated: true })) : edges),
    [edges, isRunning]
  );

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(async () => {
        try {
          const history = await getGlobalHistory();
          const currentRun = history.find(r => r.id === testRunId);
          if (currentRun && (currentRun.status.toLowerCase() === "success" || currentRun.status.toLowerCase() === "failed")) {
            setLocalRunStatus(currentRun.status.toLowerCase());
          }
        } catch (e) { console.error("Polling fallback failed", e); }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [testRunId, isRunning]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const getAvailableVariables = () => {
    if (!triggerSchema) return [];
    return Object.keys(triggerSchema);
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
        setSavedSnapshot("[]");
        setNodes([{ id: nextId(), type: "trigger", position: { x: 150, y: window.innerHeight / 2 - 100 }, data: { stepType: "trigger", actionKey: "webhook", appEvent: "", config: {}, order: 0 } }]);
      } else {
        setSavedSnapshot(JSON.stringify(graphToSteps(n, e)));
        const needsLayout = wf.steps.some((s) => !s.config?.ui_pos);
        setNodes(needsLayout ? autoLayout(n, e) : n);
        setEdges(e);

        const rootTrigger = n.find(node => node.type === 'trigger');
        if (rootTrigger && rootTrigger.data.actionKey) {
            const schemaDef = INTEGRATIONS[rootTrigger.data.actionKey]?.triggers?.[rootTrigger.data.appEvent]?.schema_mock;
            if(schemaDef) setTriggerSchema(schemaDef);
        }
      }
    });
  }, [id, setNodes, setEdges]);

  useEffect(() => {
    setNodes((ns) => ns.map((n) => ({ ...n, data: { ...n.data, liveStatus: stepStatus[n.id] } })));
  }, [stepStatus, setNodes]);

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

  const handleAutoLayout = () => {
    setNodes((ns) => autoLayout(ns, edges));
    setTimeout(() => rfInstance?.fitView({ duration: 400, ...fitOpts }), 60);
  };

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
    if(window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const addNodeToCanvas = (type, position) => {
      const newNode = {
        id: nextId(),
        type,
        position,
        data: type === "condition"
            ? { stepType: "condition", config: { field: "", operator: "==", value: "" }, order: nodes.length }
            : { stepType: type, actionKey: "", appEvent: "", config: {}, order: nodes.length },
      };
      setNodes((nds) => nds.concat(newNode));
  };

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !rfInstance) return;

      const position = rfInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      addNodeToCanvas(type, position);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rfInstance, nodes, setNodes]
  );

  const handleTapToAdd = (type) => {
      if (!rfInstance) return;
      const center = rfInstance.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      const offset = (nodes.length % 8) * 24;
      addNodeToCanvas(type, { x: center.x + offset, y: center.y + offset });
      if(window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const updateSelectedData = (patch) => {
    setNodes((ns) => ns.map((n) => (n.id === selected.id ? { ...n, data: { ...n.data, ...patch } } : n)));
    setSelected((s) => ({ ...s, data: { ...s.data, ...patch } }));
  };

  const handleSave = async ({ silent = false } = {}) => {
    setSaving(true);
    try {
      const steps = graphToSteps(nodes, edges);
      await saveSteps(id, steps);
      setSavedSnapshot(JSON.stringify(steps));
      if (!silent) notify("success", "Workflow saved");
      return true;
    } catch (err) {
      notify("error", err.response?.data?.detail || "Failed to save workflow.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveRef = useRef(handleSave);
  saveRef.current = handleSave;
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const loadSchema = async () => {
    const triggerNode = nodes.find(n => n.type === 'trigger');
    if (!triggerNode || !triggerNode.data.actionKey) {
      notify("error", "Configure a trigger first.");
      return null;
    }
    const key = triggerNode.data.actionKey;
    setIsFetchingSchema(true);
    try {
      const schema = await fetchTriggerSchema(key, triggerNode.data.appEvent, triggerNode.data.config);
      setTriggerSchema(schema);
      return schema;
    } catch {
      const fallback = INTEGRATIONS[key]?.triggers?.[triggerNode.data.appEvent]?.schema_mock;
      if (fallback) {
        setTriggerSchema(fallback);
        return fallback;
      }
      if (key === "webhook" || key === "schedule") {
        setTriggerSchema({});
        return {};
      }
      notify("error", "Couldn't fetch a recent event. Is your app connected?");
      return null;
    } finally {
      setIsFetchingSchema(false);
    }
  };

  const handleTestRun = async () => {
    setLocalRunStatus("");
    setStarting(true);
    try {
      const schema = triggerSchema || (await loadSchema());
      if (!schema) return;
      const ok = await handleSave({ silent: true });
      if (!ok) return;

      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_BASE}${workflow.webhook_url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schema),
      });
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      setTestRunId(data.run_id);
    } catch {
      notify("error", "Couldn't start the test run.");
    } finally {
      setStarting(false);
    }
  };

  const renderField = (field, isAuthKey, isSecuredInVault) => {
      return (
        <div key={field.key} className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-[12px] font-medium text-foreground">{field.label}</label>
            {isSecuredInVault && (
              <span className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                <Lock className="w-2.5 h-2.5" /> Vault Secured
              </span>
            )}
          </div>

          {field.type === "select" ? (
            <select
              className="bg-background border border-border rounded-md px-3 py-2 text-[13px] text-foreground focus:border-foreground outline-none transition-colors appearance-none cursor-pointer"
              value={selected.data.config[field.key] || (field.options[0]?.value || "")}
              onChange={(e) => updateSelectedData({ config: { ...selected.data.config, [field.key]: e.target.value } })}
            >
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : isAuthKey ? (
            <input
              type="password"
              autoComplete="new-password"
              className={`bg-background border border-border rounded-md px-3 py-2 text-[13px] outline-none transition-colors w-full ${isSecuredInVault && !selected.data.config[field.key] ? 'placeholder-emerald-500/40 text-emerald-500 focus:border-emerald-500' : 'text-foreground focus:border-foreground'}`}
              placeholder={isSecuredInVault ? "Leave blank to use Vault connection" : field.placeholder}
              value={selected.data.config[field.key] || ""}
              onChange={(e) => updateSelectedData({ config: { ...selected.data.config, [field.key]: e.target.value } })}
            />
          ) : (
            <RichInput
               value={selected.data.config[field.key] || ""}
               onChange={(newVal) => updateSelectedData({ config: { ...selected.data.config, [field.key]: newVal } })}
               placeholder={field.placeholder}
               isTextArea={field.type === "textarea"}
            />
          )}

          {!isAuthKey && (
            <div className="flex flex-col gap-2 mt-1 p-3 bg-muted/40 rounded-md border border-border">
              <span className={sectionLabel}>Insert Variables</span>
              <div className="flex flex-wrap gap-1.5">
                {getAvailableVariables().map((key) => (
                  <button key={`trigger-${key}`} type="button"
                    onClick={() => {
                      const currentVal = selected.data.config[field.key] || "";
                      updateSelectedData({ config: { ...selected.data.config, [field.key]: currentVal + `{{trigger.${key}}}` } });
                    }}
                    className="text-[10px] font-mono bg-background border border-border px-1.5 py-1 rounded hover:border-foreground text-muted-foreground transition-colors"
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
                      className="text-[10px] font-mono bg-background border border-border px-1.5 py-1 rounded hover:border-foreground text-foreground transition-colors"
                    >+ {INTEGRATIONS[node.data.actionKey]?.name || node.data.actionKey}</button>
                  );
                })}
                {getAvailableVariables().length === 0 && upstreamActions.length === 0 && (
                  <span className="text-[11px] text-muted-foreground italic">Click 'Fetch Recent Event' to load variables</span>
                )}
              </div>
            </div>
          )}
        </div>
      );
    };

  const schemaKeys = triggerSchema ? Object.keys(triggerSchema) : [];

  const panelKind = selected?.data.stepType;
  const panelTitle =
    panelKind === "condition" ? "Router"
    : selected?.data.actionKey ? (INTEGRATIONS[selected.data.actionKey]?.name || BUILTIN_NAMES[selected.data.actionKey] || selected.data.actionKey)
    : "Choose an app";
  const panelIcon =
    panelKind === "condition" ? <BlocksIcon className="w-4 h-4 text-foreground" />
    : selected?.data.actionKey ? getIntegrationIcon(selected.data.actionKey)
    : <WorkflowIcon className="w-4 h-4 text-muted-foreground" />;

  return (
    <>
      <div className="flex flex-1 w-full relative overflow-hidden h-full">

        {/* Mobile backdrop */}
        {isSidebarOpen && (
          <div className="md:hidden absolute inset-0 z-10 bg-black/50 animate-in fade-in duration-200" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* Builder Tool Sidebar */}
        <div className={`absolute md:relative z-20 h-full border-r border-border bg-background flex flex-col w-[280px] md:w-[260px] shrink-0 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

          <div className="md:hidden flex items-center justify-between h-12 px-4 border-b border-border shrink-0">
            <span className={sectionLabel}>Tools</span>
            <button onClick={() => setIsSidebarOpen(false)} aria-label="Close tools" className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 flex flex-col gap-5 flex-1 overflow-y-auto custom-scrollbar">

            <div className="flex flex-col gap-2">
              <span className={`${sectionLabel} flex items-center justify-between mb-1`}>
                Add Node
                <span className="px-1.5 py-0.5 rounded text-[9px] border border-border normal-case tracking-normal">Tap or drag</span>
              </span>

              <div
                draggable
                onDragStart={(e) => onDragStart(e, 'condition')}
                onClick={() => handleTapToAdd('condition')}
                className={addCard}
              >
                <div className="w-8 h-8 rounded-md bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                  <BlocksIcon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium text-foreground">Router</span>
                  <span className="text-[11px] text-muted-foreground">Split via condition</span>
                </div>
              </div>

              <div
                draggable
                onDragStart={(e) => onDragStart(e, 'action')}
                onClick={() => handleTapToAdd('action')}
                className={addCard}
              >
                <div className="w-8 h-8 rounded-md bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                  <WorkflowIcon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium text-foreground">Action</span>
                  <span className="text-[11px] text-muted-foreground">Execute external task</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-border w-full" />

            {workflow && (
              <div className="flex flex-col gap-3">
                <span className={`${sectionLabel} flex items-center gap-1.5`}>
                  <BotMessageSquareIcon className="w-3.5 h-3.5" /> Test data
                </span>

                <div className="bg-card border border-border rounded-md flex flex-col p-3 gap-3">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Pull a recent event from your trigger to map variables and run a test.
                  </p>

                  {triggerSchema && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] text-emerald-500">
                        {schemaKeys.length} {schemaKeys.length === 1 ? "variable" : "variables"} loaded
                      </span>
                      {schemaKeys.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {schemaKeys.slice(0, 8).map((k) => (
                            <span key={k} className="font-mono text-[10px] bg-background border border-border rounded px-1.5 py-0.5 text-muted-foreground">{k}</span>
                          ))}
                          {schemaKeys.length > 8 && (
                            <span className="font-mono text-[10px] text-muted-foreground px-1 py-0.5">+{schemaKeys.length - 8}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={loadSchema}
                    disabled={isFetchingSchema}
                    variant="outline"
                    className="w-full h-8 text-[12px] bg-background border-border"
                  >
                    <RefreshCw className={`w-3 h-3 mr-2 ${isFetchingSchema ? 'animate-spin' : ''}`} />
                    {isFetchingSchema ? "Fetching..." : "Fetch Recent Event"}
                  </Button>
                </div>

                {testRunId && (
                  <div className="p-3 bg-card border border-border rounded-md flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">Last test</span>
                      <Badge variant="outline" className={`text-[9px] font-mono uppercase tracking-wider py-0 rounded ${
                        displayRunStatus?.toLowerCase() === "success" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                        displayRunStatus?.toLowerCase() === "failed" ? "bg-destructive/10 text-destructive border-destructive/20" :
                        "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse"
                      }`}>
                        {displayRunStatus ? displayRunStatus : "RUNNING"}
                      </Badge>
                    </div>
                    <Link to={`/history`} className="text-muted-foreground hover:text-foreground text-[11px] font-medium transition-colors flex items-center gap-1">
                      View full run logs <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 bg-background relative">
          {workflow && nodes.length <= 1 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-28 z-[5] flex justify-center px-4">
              <p className="text-[12px] text-muted-foreground bg-background/90 border border-border rounded-full px-3.5 py-1.5">
                Add an action or router to start building your flow
              </p>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={displayEdges}
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
            connectionLineStyle={{ stroke: "#71717a", strokeWidth: 1.5 }}
            defaultEdgeOptions={{ type: 'smoothstep', interactionWidth: 30, pathOptions: { borderRadius: 12 } }}
            snapToGrid
            snapGrid={[20, 20]}
            panOnScroll={true}
            zoomActivationKeyCode="Control"
            panActivationKeyCode="Space"
            deleteKeyCode={['Backspace', 'Delete']}
            selectionKeyCode="Shift"
            multiSelectionKeyCode="Shift"
            minZoom={0.2}
            maxZoom={1.6}
            fitView
            fitViewOptions={fitOpts}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} color="rgba(255,255,255,0.09)" gap={20} size={1} />

            {/* Floating action bar */}
            <Panel position="top-center" className="!mt-3">
              <div className="flex items-center gap-1 rounded-lg border border-border bg-background/90 backdrop-blur p-1 shadow-lg">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="md:hidden h-7 pl-2 pr-2.5 rounded-md flex items-center gap-1.5 text-[12px] font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
                <div className="md:hidden w-px h-5 bg-border" />

                <div className="flex items-center gap-2 px-2.5 text-[12px] text-muted-foreground select-none">
                  <span className={`w-1.5 h-1.5 rounded-full ${saving ? "bg-amber-400 animate-pulse" : dirty ? "bg-amber-400" : "bg-emerald-500"}`} />
                  {saving ? "Saving" : dirty ? "Unsaved" : "Saved"}
                </div>
                <div className="w-px h-5 bg-border" />

                <Button
                  variant="ghost"
                  onClick={handleTestRun}
                  disabled={runBusy || saving || !workflow}
                  className="h-7 px-2.5 text-[12px] gap-1.5"
                >
                  {runBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span className="hidden sm:inline">{runBusy ? "Running" : "Run test"}</span>
                </Button>
                <Button
                  onClick={() => handleSave()}
                  disabled={saving || !dirty}
                  className="h-7 px-2.5 text-[12px] gap-1.5"
                >
                  <SaveIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
              </div>
            </Panel>

            <Panel position="bottom-left" className="m-5 hidden md:block">
              <div className="group relative">
                <button className={`${ctrlBtn} !w-8 !h-8 bg-background border border-border rounded-md`}>
                  <HelpCircle className="w-4 h-4" />
                </button>
                <div className="absolute bottom-full left-0 mb-2 w-56 bg-background border border-border rounded-lg p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none translate-y-1 group-hover:translate-y-0">
                  <p className={`${sectionLabel} mb-2`}>Keyboard Shortcuts</p>
                  <div className="flex flex-col gap-2 text-[11px] text-foreground font-medium">
                    <div className="flex justify-between items-center"><span>Save</span><kbd className="bg-muted border border-border px-1 rounded font-mono text-[9px]">Ctrl + S</kbd></div>
                    <div className="flex justify-between items-center"><span>Pan Canvas</span><kbd className="bg-muted border border-border px-1 rounded font-mono text-[9px]">Space + Drag</kbd></div>
                    <div className="flex justify-between items-center"><span>Pan Canvas</span><kbd className="bg-muted border border-border px-1 rounded font-mono text-[9px]">Scroll</kbd></div>
                    <div className="flex justify-between items-center"><span>Zoom In/Out</span><kbd className="bg-muted border border-border px-1 rounded font-mono text-[9px]">Ctrl + Scroll</kbd></div>
                    <div className="flex justify-between items-center"><span>Multi-select</span><kbd className="bg-muted border border-border px-1 rounded font-mono text-[9px]">Shift + Drag</kbd></div>
                    <div className="flex justify-between items-center"><span>Delete Node</span><kbd className="bg-muted border border-border px-1 rounded font-mono text-[9px]">Backspace</kbd></div>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel position="bottom-right" className="m-5">
              <div className="bg-background border border-border rounded-md p-1 flex flex-col gap-1">
                <button title="Zoom in" onClick={() => rfInstance?.zoomIn({ duration: 300 })} className={ctrlBtn}>
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <div className="h-px w-5 bg-border mx-auto" />
                <button title="Zoom out" onClick={() => rfInstance?.zoomOut({ duration: 300 })} className={ctrlBtn}>
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <div className="h-px w-5 bg-border mx-auto" />
                <button title="Fit view" onClick={() => rfInstance?.fitView({ duration: 600, ...fitOpts })} className={ctrlBtn}>
                  <Maximize className="w-3 h-3" />
                </button>
                <div className="h-px w-5 bg-border mx-auto" />
                <button title="Auto layout" onClick={handleAutoLayout} className={ctrlBtn}>
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </Panel>

            {notice && (
              <Panel position="bottom-center" className="!mb-5">
                <div className="flex items-center gap-2.5 rounded-md border border-border bg-background px-3.5 py-2.5 shadow-lg text-[13px] text-foreground animate-in fade-in slide-in-from-bottom-2 duration-200">
                  {notice.type === "success"
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    : <AlertCircle className="w-4 h-4 text-destructive shrink-0" />}
                  {notice.message}
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Selected Node Configuration Panel (Right Side) */}
        {selected && (
          <div className="absolute right-0 top-0 h-full z-30 w-full max-w-[340px] border-l border-border bg-background px-5 py-5 shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">

            <div className="flex items-center justify-between mb-5 pb-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-md border border-border bg-card flex items-center justify-center shrink-0">
                  {panelIcon}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-medium text-foreground truncate">{panelTitle}</span>
                  <span className="text-[11px] font-mono text-muted-foreground">{panelKind}</span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close" className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              {/* CONDITION NODE */}
              {selected.data.stepType === "condition" && (
                <div className="flex flex-col gap-5 animate-in fade-in duration-300">
                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-medium text-foreground">Field to check</label>
                    <Input
                      className="bg-background border-border text-[13px] h-9"
                      placeholder="e.g. trigger.budget"
                      value={selected.data.config.field || ""}
                      onChange={(e) => updateSelectedData({ config: { ...selected.data.config, field: e.target.value } })}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-medium text-foreground">Operator</label>
                    <select
                      className="bg-background border border-border rounded-md px-3 py-2 text-[13px] text-foreground focus:border-foreground outline-none transition-colors appearance-none cursor-pointer"
                      value={selected.data.config.operator || "=="}
                      onChange={(e) => updateSelectedData({ config: { ...selected.data.config, operator: e.target.value } })}
                    >
                      {["==", "!=", ">", "<", ">=", "<=", "contains"].map((op) => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-medium text-foreground">Target Value</label>
                    <Input
                      className="bg-background border-border text-[13px] h-9"
                      placeholder="e.g. 5000"
                      value={selected.data.config.value || ""}
                      onChange={(e) => updateSelectedData({ config: { ...selected.data.config, value: e.target.value } })}
                    />
                  </div>
                </div>
              )}

              {/* INTEGRATION NODES */}
              {(selected.data.stepType === "trigger" || selected.data.stepType === "action") && (
                <div className="flex flex-col animate-in fade-in duration-300 min-h-full pb-10">

                  {/* APP SELECTION */}
                  {!selected.data.actionKey ? (
                    <div className="flex flex-col gap-5">
                      <div>
                        <h3 className="text-[14px] font-semibold text-foreground mb-1">Select an App</h3>
                        <p className="text-[11px] text-muted-foreground">Choose what application will handle this step.</p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className={sectionLabel}>Built-in Utility</span>
                        {selected.data.stepType === "trigger" && (
                          <>
                            <button onClick={() => updateSelectedData({ actionKey: "webhook", appEvent: "webhook_in", config: {} })} className="group flex items-center gap-3 w-full p-2.5 rounded-md border border-border bg-card hover:bg-accent transition-colors text-left">
                              <div className="w-8 h-8 shrink-0 rounded-md bg-background border border-border flex items-center justify-center group-hover:border-foreground/30"><NetworkIcon className="w-4 h-4 text-foreground" /></div>
                              <div className="flex flex-col truncate"><span className="text-[13px] font-medium text-foreground">Incoming Webhook</span><span className="text-[11px] text-muted-foreground">Trigger via HTTP POST</span></div>
                            </button>
                            <button onClick={() => updateSelectedData({ actionKey: "schedule", appEvent: "schedule_run", config: {} })} className="group flex items-center gap-3 w-full p-2.5 rounded-md border border-border bg-card hover:bg-accent transition-colors text-left">
                              <div className="w-8 h-8 shrink-0 rounded-md bg-background border border-border flex items-center justify-center group-hover:border-foreground/30"><RotateCcwClockIcon className="w-4 h-4 text-foreground" /></div>
                              <div className="flex flex-col truncate"><span className="text-[13px] font-medium text-foreground">Schedule (Cron)</span><span className="text-[11px] text-muted-foreground">Run on a fixed interval</span></div>
                            </button>
                          </>
                        )}
                        {selected.data.stepType === "action" && (
                          <button onClick={() => updateSelectedData({ actionKey: "http", appEvent: "custom_request", config: {} })} className="group flex items-center gap-3 w-full p-2.5 rounded-md border border-border bg-card hover:bg-accent transition-colors text-left">
                            <div className="w-8 h-8 shrink-0 rounded-md bg-background border border-border flex items-center justify-center group-hover:border-foreground/30"><NetworkIcon className="w-4 h-4 text-blue-500" /></div>
                            <div className="flex flex-col truncate"><span className="text-[13px] font-medium text-foreground">HTTP Request</span><span className="text-[11px] text-muted-foreground">Send custom API requests</span></div>
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className={`${sectionLabel} mt-2`}>Marketplace</span>
                        <div className="flex flex-col gap-2">
                          {Object.entries(INTEGRATIONS).filter(([_, config]) =>
                            (selected.data.stepType === "trigger" ? Object.keys(config.triggers || {}).length > 0 : Object.keys(config.actions || {}).length > 0)
                          ).map(([key, config]) => (
                            <button
                              key={key}
                              onClick={() => updateSelectedData({ actionKey: key, appEvent: "", config: {} })}
                              className="group flex items-center gap-3 w-full p-2.5 rounded-md border border-border bg-card hover:bg-accent transition-colors text-left"
                            >
                              <div className="w-8 h-8 shrink-0 rounded-md bg-background border border-border flex items-center justify-center group-hover:border-foreground/30">
                                {getIntegrationIcon(key)}
                              </div>
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-[13px] font-medium text-foreground truncate">{config.name}</span>
                              </div>
                              {vaultKeys.includes(key) && (
                                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5 w-full">
                      {/* SELECTED APP HEADER */}
                      <div className="flex items-center justify-between bg-card border border-border rounded-md p-2 w-full">
                        <div className="flex items-center gap-2 px-1 overflow-hidden">
                          {getIntegrationIcon(selected.data.actionKey)}
                          <span className="text-[13px] font-medium text-foreground truncate">{INTEGRATIONS[selected.data.actionKey]?.name || BUILTIN_NAMES[selected.data.actionKey] || selected.data.actionKey.toUpperCase()}</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => updateSelectedData({ actionKey: "", appEvent: "", config: {} })} className="h-7 text-[10px] font-mono uppercase tracking-wider">
                          Change
                        </Button>
                      </div>

                      {/* EVENT SELECTION */}
                      {INTEGRATIONS[selected.data.actionKey] && (
                        <div className="flex flex-col gap-2 w-full">
                          <label className="text-[12px] font-medium text-foreground">{selected.data.stepType === "trigger" ? "Trigger Event" : "Action Event"}</label>
                          <select
                            className="bg-background border border-border rounded-md px-3 py-2 text-[13px] font-medium text-foreground focus:border-foreground outline-none cursor-pointer appearance-none"
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

                      {/* FIELD CONFIGURATION */}
                      {selected.data.appEvent && (
                        <div className="animate-in slide-in-from-bottom-2 mt-2 pt-5 border-t border-border w-full flex flex-col gap-5">

                          {selected.data.actionKey !== "http" && selected.data.actionKey !== "webhook" && selected.data.actionKey !== "schedule" && selected.data.actionKey !== "email" && !vaultKeys.includes(selected.data.actionKey) ? (
                            <div className="flex flex-col items-center justify-center text-center p-5 border border-dashed border-border rounded-md bg-card mt-2">
                              <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3"><Lock className="w-5 h-5" /></div>
                              <h4 className="text-[13px] font-semibold text-foreground mb-1">Vault Connection Required</h4>
                              <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">Authenticate with {INTEGRATIONS[selected.data.actionKey]?.name} to map fields.</p>
                              <Button asChild variant="outline" className="w-full text-xs font-medium h-9">
                                <Link to="/integrations" target="_blank">
                                  Open Vault <ExternalLink className="w-3.5 h-3.5 ml-2" />
                                </Link>
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-5 w-full">
                              {/* SPECIAL WEBHOOK UI */}
                              {selected.data.actionKey === "webhook" && (
                                <div className="flex flex-col gap-3">
                                  <p className="text-muted-foreground text-[11px] leading-relaxed">Send a POST request to this URL to trigger this workflow.</p>
                                  <div className="bg-card border border-border rounded-md p-3 flex flex-col gap-3">
                                    <code className="text-[11px] text-foreground break-all font-mono">{import.meta.env.VITE_API_URL}{workflow?.webhook_url}</code>
                                    <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(`${import.meta.env.VITE_API_URL}${workflow?.webhook_url}`); notify("success", "Webhook URL copied"); }} className="w-full h-8 text-[11px] font-medium">Copy Webhook URL</Button>
                                  </div>
                                </div>
                              )}

                              {/* SPECIAL SCHEDULE UI */}
                              {selected.data.actionKey === "schedule" && (
                                <div className="flex flex-col gap-2">
                                  <label className="text-[12px] font-medium text-foreground">Interval (Minutes)</label>
                                  <Input type="number" className="h-9 text-[13px]" placeholder="15" value={selected.data.config.interval || ""} onChange={(e) => updateSelectedData({ config: { ...selected.data.config, interval: e.target.value } })} />
                                </div>
                              )}

                              {/* STANDARD INTEGRATION FIELDS */}
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
          </div>
        )}
      </div>

      <ConfirmModal isOpen={!!edgeToDelete} onClose={() => setEdgeToDelete(null)} onConfirm={confirmEdgeDelete} title="Remove Connection" message="Are you sure you want to remove this connection line?" />
    </>
  );
}
