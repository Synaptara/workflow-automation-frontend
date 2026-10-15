import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactFlow, {
  Background,
  BackgroundVariant,
  addEdge,
  useNodesState,
  useEdgesState,
  Panel,
  ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";

import { nodeTypes, ConfirmModal, humanizeVariable } from "../flow/nodes";
import { VaultContext } from "../flow/vaultContext";
import ConfigPanel from "../flow/ConfigPanel";
import {
  getEdgeStyling,
  autoLayout,
  stepsToGraph,
  graphToSteps,
  computeFlow,
  getUpstream,
  nextId,
} from "../flow/graph";
import {
  getWorkflow,
  saveSteps,
  getCredentials,
  getRun,
  fetchTriggerSchema,
} from "../api/workflows";
import { useRunSocket } from "../hooks/useRunSocket";
import { INTEGRATIONS } from "../config/integrations";
import { webhookFullUrl } from "../lib/config";
import {
  BlocksIcon,
  WorkflowIcon,
  SaveIcon,
  BotMessageSquareIcon,
} from "../components/icons";
import { getIntegrationIcon } from "../flow/appIcon";
import {
  Play,
  ExternalLink,
  HelpCircle,
  ZoomIn,
  Maximize,
  ZoomOut,
  X,
  RefreshCw,
  LayoutGrid,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

const TOOLS = [
  {
    type: "condition",
    title: "Router (If / Else)",
    sub: "Split into two paths",
    Icon: BlocksIcon,
  },
  {
    type: "action",
    title: "Action Step",
    sub: "Send data to an app",
    Icon: WorkflowIcon,
  },
];
const SHORTCUTS = [
  ["Save", "Ctrl + S"],
  ["Pan", "Space + Drag"],
  ["Pan", "Scroll"],
  ["Zoom", "Ctrl + Scroll"],
  ["Multi-select", "Shift + Drag"],
  ["Delete step", "Backspace"],
];
const ctrlBtn =
  "w-7 h-7 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors";
const sec =
  "text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider";
const tone = (s) =>
  s === "success"
    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    : s === "failed"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse";

const isVaultError = (data, msg) =>
  data?.code === "vault_auth_required" ||
  /vault|re-authenticate|expired|401|unauthorized|not connected/i.test(
    msg || "",
  );

export default function WorkflowBuilder() {
  const { id } = useParams();
  const [rf, setRf] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selected, setSelected] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [vaultKeys, setVaultKeys] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);

  const [triggerSchema, setTriggerSchema] = useState(null);
  const [fetchingSchema, setFetchingSchema] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [testRunId, setTestRunId] = useState(null);
  const [starting, setStarting] = useState(false);
  const [edgeToDelete, setEdgeToDelete] = useState(null);
  const [localStatus, setLocalStatus] = useState("");

  const { stepStatus, runStatus } = useRunSocket(testRunId);
  const status = String(localStatus || runStatus || "").toLowerCase();
  const isRunning =
    !!testRunId && (!status || ["running", "pending"].includes(status));
  const runBusy = starting || isRunning || fetchingSchema;

  const fitOpts = {
    padding: 0.25,
    minZoom: window.innerWidth < 768 ? 0.5 : 0.3,
    maxZoom: 1,
  };
  const closeToolsOnMobile = () =>
    window.innerWidth < 768 && setToolsOpen(false);

  const notify = useCallback((type, message, action = null) => {
    setNotice({ type, message, action });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(
      () => setNotice(null),
      action ? 7000 : 3500,
    );
  }, []);
  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  // Compute sequential step numbers (1 = Trigger, 2..N = ordered steps)
  const flow = useMemo(() => computeFlow(nodes, edges), [nodes, edges]);
  const stepNumbers = flow.numbers;
  const numberedNodes = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          stepNumber: flow.numbers[n.id],
          connected: flow.reachable.has(n.id),
        },
      })),
    [nodes, flow],
  );

  const triggerNode = useMemo(
    () => nodes.find((n) => n.type === "trigger") || null,
    [nodes],
  );
  const snapshot = useMemo(
    () => (workflow ? JSON.stringify(graphToSteps(nodes, edges)) : ""),
    [nodes, edges, workflow],
  );
  const dirty =
    !!workflow && savedSnapshot !== "" && snapshot !== savedSnapshot;
  const displayEdges = useMemo(
    () => (isRunning ? edges.map((e) => ({ ...e, animated: true })) : edges),
    [edges, isRunning],
  );
  const upstream = useMemo(
    () => (selected ? getUpstream(selected.id, edges, nodes) : []),
    [selected, edges, nodes],
  );

  useEffect(() => {
    if (!isRunning) return;
    const t = setInterval(async () => {
      try {
        const run = await getRun(testRunId);
        const s = String(run.status).toLowerCase();
        if (s === "success" || s === "failed") setLocalStatus(s);
      } catch {
        /* socket will report */
      }
    }, 3000);
    return () => clearInterval(t);
  }, [testRunId, isRunning]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  useEffect(() => {
    const onFocus = () => {
      getCredentials()
        .then(setVaultKeys)
        .catch(() => {});
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    Promise.all([getWorkflow(id), getCredentials()])
      .then(([wf, creds]) => {
        setWorkflow(wf);
        setVaultKeys(creds);
        const { nodes: n, edges: e } = stepsToGraph(wf.steps);
        if (n.length === 0) {
          setSavedSnapshot("[]");
          setNodes([
            {
              id: nextId(),
              type: "trigger",
              position: { x: 150, y: window.innerHeight / 2 - 100 },
              data: {
                stepType: "trigger",
                actionKey: "webhook",
                appEvent: "webhook_in",
                config: {},
                order: 0,
              },
            },
          ]);
          return;
        }
        setSavedSnapshot(JSON.stringify(graphToSteps(n, e)));
        setNodes(
          wf.steps.some((s) => !s.config?.ui_pos) ? autoLayout(n, e) : n,
        );
        setEdges(e);
        const t = n.find((x) => x.type === "trigger");
        const mock =
          t &&
          INTEGRATIONS[t.data.actionKey]?.triggers?.[t.data.appEvent]
            ?.schema_mock;
        if (mock) setTriggerSchema(mock);
      })
      .catch(() => notify("error", "Couldn't load this workflow."));
  }, [id, setNodes, setEdges, notify]);

  useEffect(() => {
    setNodes((ns) =>
      ns.map((n) => ({
        ...n,
        data: { ...n.data, liveStatus: stepStatus[n.id] },
      })),
    );
  }, [stepStatus, setNodes]);

  useEffect(() => {
    if (selected && !nodes.some((n) => n.id === selected.id)) setSelected(null);
  }, [nodes, selected]);

  const onConnect = useCallback(
    (p) =>
      setEdges((eds) =>
        addEdge({ ...p, ...getEdgeStyling(p.sourceHandle) }, eds),
      ),
    [setEdges],
  );

  const addNode = useCallback(
    (type, position) => {
      setNodes((nds) =>
        nds.concat({
          id: nextId(),
          type,
          position,
          data:
            type === "condition"
              ? {
                  stepType: "condition",
                  config: { field: "", operator: "contains", value: "" },
                  order: nds.length,
                }
              : {
                  stepType: type,
                  actionKey: "",
                  appEvent: "",
                  config: {},
                  order: nds.length,
                },
        }),
      );
    },
    [setNodes],
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("application/reactflow");
      if (type && rf)
        addNode(type, rf.screenToFlowPosition({ x: e.clientX, y: e.clientY }));
    },
    [rf, addNode],
  );

  const tapToAdd = (type) => {
    if (!rf) return;
    const c = rf.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    const off = (nodes.length % 8) * 24;
    addNode(type, { x: c.x + off, y: c.y + off });
    closeToolsOnMobile();
  };

  const updateSelected = (patch) => {
    setNodes((ns) =>
      ns.map((n) =>
        n.id === selected.id ? { ...n, data: { ...n.data, ...patch } } : n,
      ),
    );
    setSelected((s) => ({ ...s, data: { ...s.data, ...patch } }));
  };

  const deleteSelected = () => {
    setNodes((ns) => ns.filter((n) => n.id !== selected.id));
    setEdges((es) =>
      es.filter((e) => e.source !== selected.id && e.target !== selected.id),
    );
    setSelected(null);
  };

  const relayout = () => {
    setNodes((ns) => autoLayout(ns, edges));
    setTimeout(() => rf?.fitView({ duration: 400, ...fitOpts }), 60);
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
      const data = err.response?.data;
      const msg = data?.detail || "Failed to save workflow.";
      notify(
        "error",
        msg,
        isVaultError(data, msg)
          ? { label: "Open Vault", to: "/integrations" }
          : null,
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveRef = useRef(handleSave);
  useEffect(() => {
    saveRef.current = handleSave;
  });
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
    const t = nodes.find((n) => n.type === "trigger");
    if (!t?.data.actionKey) {
      notify("error", "Configure Step 1 (Trigger) first.");
      return null;
    }
    const { actionKey: key, appEvent, config } = t.data;
    setFetchingSchema(true);
    try {
      const schema = await fetchTriggerSchema(key, appEvent, config);
      setTriggerSchema(schema);
      return schema;
    } catch (err) {
      const data = err?.response?.data;
      const msg = data?.detail || data?.error || "";
      if (isVaultError(data, msg)) {
        notify(
          "error",
          msg || "Connection expired. Re-authenticate in the Vault.",
          {
            label: "Open Vault",
            to: "/integrations",
          },
        );
        return null;
      }
      const fallback =
        INTEGRATIONS[key]?.triggers?.[appEvent]?.schema_mock ||
        (["webhook", "schedule"].includes(key) ? {} : null);
      if (fallback) {
        setTriggerSchema(fallback);
        return fallback;
      }
      notify(
        "error",
        msg || "Couldn't load sample data. Check your connection in the Vault.",
        {
          label: "Open Vault",
          to: "/integrations",
        },
      );
      return null;
    } finally {
      setFetchingSchema(false);
    }
  };

  const handleTestRun = async () => {
    setLocalStatus("");
    setStarting(true);
    try {
      const schema = triggerSchema || (await loadSchema());
      if (!schema || !(await handleSave({ silent: true }))) return;
      const res = await fetch(webhookFullUrl(workflow.webhook_url), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schema),
      });
      if (res.status === 429) {
        notify("error", "Monthly task limit reached.", {
          label: "View Billing",
          to: "/billing",
        });
        return;
      }
      if (!res.ok) throw new Error("bad response");
      setTestRunId((await res.json()).run_id);
    } catch {
      notify("error", "Couldn't start the test run.");
    } finally {
      setStarting(false);
    }
  };

  const schemaKeys = triggerSchema
    ? Object.keys(triggerSchema).filter((k) => k !== "event_type")
    : [];
  const triggerActionKey = triggerNode?.data?.actionKey || "webhook";

  return (
    <>
      <div className="absolute inset-0 flex overflow-hidden">
        {toolsOpen && (
          <div
            className="md:hidden absolute inset-0 z-10 bg-black/50 animate-in fade-in duration-200"
            onClick={() => setToolsOpen(false)}
          />
        )}

        {/* Tools sidebar */}
        <div
          className={`absolute md:relative z-20 h-full border-r border-border bg-background flex flex-col w-[280px] md:w-[260px] shrink-0 transition-transform duration-300 ${toolsOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        >
          <div className="md:hidden flex items-center justify-between h-12 px-4 border-b border-border shrink-0">
            <span className={sec}>Add Steps</span>
            <button
              onClick={() => setToolsOpen(false)}
              aria-label="Close tools"
              className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 flex flex-col gap-5 flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col gap-2">
              <span className={`${sec} flex items-center justify-between mb-1`}>
                Add step
                <span className="px-1.5 py-0.5 rounded text-[9px] border border-border normal-case tracking-normal">
                  Tap or drag
                </span>
              </span>
              {TOOLS.map(({ type, title, sub, Icon }) => (
                <div
                  key={type}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/reactflow", type);
                    e.dataTransfer.effectAllowed = "move";
                    closeToolsOnMobile();
                  }}
                  onClick={() => tapToAdd(type)}
                  className="group flex items-center gap-2.5 w-full p-2 rounded-md border border-border bg-card hover:bg-accent hover:border-muted-foreground/40 transition-colors text-left cursor-grab active:cursor-grabbing"
                >
                  <div className="w-8 h-8 rounded-md bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-foreground">
                      {title}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {sub}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-px bg-border w-full" />

            {workflow && (
              <div className="flex flex-col gap-3">
                <span className={`${sec} flex items-center gap-1.5`}>
                  <BotMessageSquareIcon className="w-3.5 h-3.5" /> Sample Data
                  (Step 1)
                </span>
                <div className="bg-card border border-border rounded-md flex flex-col p-3 gap-3">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Load a recent item from your trigger so you can plug its
                    fields into later steps.
                  </p>
                  {triggerSchema && schemaKeys.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-medium text-emerald-500">
                        {schemaKeys.length}{" "}
                        {schemaKeys.length === 1 ? "field" : "fields"} ready to
                        use
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {schemaKeys.slice(0, 8).map((k) => (
                          <span
                            key={k}
                            className="inline-flex items-center gap-1.5 text-[11px] bg-background border border-border rounded-md px-2 py-0.5 text-foreground"
                          >
                            <span className="w-3 h-3 flex items-center justify-center shrink-0">
                              {getIntegrationIcon(triggerActionKey)}
                            </span>
                            1. {humanizeVariable(k)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={loadSchema}
                    disabled={fetchingSchema}
                    variant="outline"
                    className="w-full h-8 text-[12px] bg-background border-border"
                  >
                    <RefreshCw
                      className={`w-3 h-3 mr-2 ${fetchingSchema ? "animate-spin" : ""}`}
                    />
                    {fetchingSchema ? "Loading..." : "Load Sample Data"}
                  </Button>
                </div>

                {testRunId && (
                  <div className="p-3 bg-card border border-border rounded-md flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        Last test
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-mono uppercase tracking-wider py-0 rounded ${tone(status)}`}
                      >
                        {status || "running"}
                      </Badge>
                    </div>
                    <Link
                      to="/history"
                      className="text-muted-foreground hover:text-foreground text-[11px] font-medium transition-colors flex items-center gap-1"
                    >
                      View full run logs <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-background relative">
          {workflow && nodes.length <= 1 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-28 z-[5] flex justify-center px-4">
              <p className="text-[12px] text-muted-foreground bg-background/90 border border-border rounded-full px-3.5 py-1.5">
                Add an action or router to start building your flow
              </p>
            </div>
          )}

          <VaultContext.Provider value={vaultKeys}>
            <ReactFlow
              nodes={numberedNodes}
              edges={displayEdges}
              onInit={setRf}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_, n) => setSelected(n)}
              onPaneClick={() => setSelected(null)}
              onEdgeClick={(_, e) => setEdgeToDelete(e)}
              onDrop={onDrop}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              nodeTypes={nodeTypes}
              connectionMode={ConnectionMode.Loose}
              connectionLineStyle={{ stroke: "#71717a", strokeWidth: 1.5 }}
              defaultEdgeOptions={{
                type: "smoothstep",
                interactionWidth: 30,
                pathOptions: { borderRadius: 12 },
              }}
              snapToGrid
              snapGrid={[20, 20]}
              panOnScroll
              zoomActivationKeyCode="Control"
              panActivationKeyCode="Space"
              deleteKeyCode={["Backspace", "Delete"]}
              selectionKeyCode="Shift"
              multiSelectionKeyCode="Shift"
              minZoom={0.2}
              maxZoom={1.6}
              fitView
              fitViewOptions={fitOpts}
              proOptions={{ hideAttribution: true }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                color="rgba(255,255,255,0.09)"
                gap={20}
                size={1}
              />

              <Panel position="top-center" className="!mt-3">
                <div className="flex items-center gap-1 rounded-lg border border-border bg-background/90 backdrop-blur p-1 shadow-lg">
                  <button
                    onClick={() => setToolsOpen(true)}
                    className="md:hidden h-7 pl-2 pr-2.5 rounded-md flex items-center gap-1.5 text-[12px] font-medium text-foreground hover:bg-accent transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                  <div className="md:hidden w-px h-5 bg-border" />
                  <div className="flex items-center gap-2 px-2.5 text-[12px] text-muted-foreground select-none">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${saving ? "bg-amber-400 animate-pulse" : dirty ? "bg-amber-400" : "bg-emerald-500"}`}
                    />
                    {saving ? "Saving" : dirty ? "Unsaved" : "Saved"}
                  </div>
                  <div className="w-px h-5 bg-border" />
                  <Button
                    variant="ghost"
                    onClick={handleTestRun}
                    disabled={runBusy || saving || !workflow}
                    className="h-7 px-2.5 text-[12px] gap-1.5"
                  >
                    {runBusy ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span className="hidden sm:inline">
                      {runBusy ? "Running" : "Run test"}
                    </span>
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
                  <button
                    className={`${ctrlBtn} !w-8 !h-8 bg-background border border-border rounded-md`}
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-full left-0 mb-2 w-56 bg-background border border-border rounded-lg p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none translate-y-1 group-hover:translate-y-0">
                    <p className={`${sec} mb-2`}>Keyboard shortcuts</p>
                    <div className="flex flex-col gap-2 text-[11px] text-foreground font-medium">
                      {SHORTCUTS.map(([a, k], i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center"
                        >
                          <span>{a}</span>
                          <kbd className="bg-muted border border-border px-1 rounded font-mono text-[9px]">
                            {k}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel position="bottom-right" className="m-5">
                <div className="bg-background border border-border rounded-md p-1 flex flex-col gap-1">
                  <button
                    title="Zoom in"
                    onClick={() => rf?.zoomIn({ duration: 300 })}
                    className={ctrlBtn}
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <div className="h-px w-5 bg-border mx-auto" />
                  <button
                    title="Zoom out"
                    onClick={() => rf?.zoomOut({ duration: 300 })}
                    className={ctrlBtn}
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <div className="h-px w-5 bg-border mx-auto" />
                  <button
                    title="Fit view"
                    onClick={() => rf?.fitView({ duration: 600, ...fitOpts })}
                    className={ctrlBtn}
                  >
                    <Maximize className="w-3 h-3" />
                  </button>
                  <div className="h-px w-5 bg-border mx-auto" />
                  <button
                    title="Auto layout"
                    onClick={relayout}
                    className={ctrlBtn}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Panel>

              {notice && (
                <Panel position="bottom-center" className="!mb-5">
                  <div className="flex items-center gap-3 rounded-md border border-border bg-background px-3.5 py-2.5 shadow-lg text-[13px] text-foreground animate-in fade-in slide-in-from-bottom-2 duration-200 max-w-[92vw] sm:max-w-[540px]">
                    {notice.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                    )}
                    <span className="leading-snug">{notice.message}</span>
                    {notice.action && (
                      <Link
                        to={notice.action.to}
                        className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1 text-[11px] font-medium text-background hover:opacity-90 transition-opacity shrink-0"
                      >
                        {notice.action.label}{" "}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </Panel>
              )}
            </ReactFlow>
          </VaultContext.Provider>
        </div>

        {selected && (
          <ConfigPanel
            selected={selected}
            onUpdate={updateSelected}
            onClose={() => setSelected(null)}
            onDelete={deleteSelected}
            workflow={workflow}
            vaultKeys={vaultKeys}
            triggerNode={triggerNode}
            triggerSchema={triggerSchema}
            upstream={upstream}
            stepNumbers={stepNumbers}
            notify={notify}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={!!edgeToDelete}
        onClose={() => setEdgeToDelete(null)}
        onConfirm={() => {
          setEdges((es) => es.filter((e) => e.id !== edgeToDelete.id));
          setEdgeToDelete(null);
        }}
        title="Remove connection"
        message="Are you sure you want to remove this connection line?"
      />
    </>
  );
}
