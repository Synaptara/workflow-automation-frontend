import { MarkerType } from "reactflow";

let idCounter = 0;
export const nextId = () => `n${Date.now()}_${idCounter++}`;

// Keep bg equal to your page background (label chips sit on it).
const EDGE = {
  default: "#52525b",
  success: "#10b981",
  destructive: "#ef4444",
  bg: "#121212",
};
const arrow = (color) => ({
  type: MarkerType.ArrowClosed,
  color,
  width: 14,
  height: 14,
});

const branchStyle = (label, color) => ({
  label,
  labelStyle: {
    fill: color,
    fontWeight: 600,
    fontSize: 10,
    fontFamily: "monospace",
  },
  labelBgStyle: { fill: EDGE.bg, stroke: color, strokeWidth: 1, rx: 4, ry: 4 },
  labelBgPadding: [6, 3],
  markerEnd: arrow(color),
  style: { strokeWidth: 1.5, stroke: color },
});

export const getEdgeStyling = (handle) =>
  handle === "true"
    ? branchStyle("True", EDGE.success)
    : handle === "false"
      ? branchStyle("False", EDGE.destructive)
      : {
          markerEnd: arrow(EDGE.default),
          style: { strokeWidth: 1.5, stroke: EDGE.default },
        };

const COL_W = 380;
const ROW_H = 210;

export function autoLayout(nodes, edges) {
  const kids = {},
    parents = {},
    deg = {};
  nodes.forEach((n) => {
    kids[n.id] = [];
    parents[n.id] = [];
    deg[n.id] = 0;
  });
  edges.forEach((e) => {
    if (!kids[e.source] || !parents[e.target]) return;
    kids[e.source].push(e);
    parents[e.target].push(e.source);
    deg[e.target]++;
  });

  const level = {};
  const queue = nodes.filter((n) => deg[n.id] === 0).map((n) => n.id);
  queue.forEach((id) => (level[id] = 0));
  const left = { ...deg };
  while (queue.length) {
    const id = queue.shift();
    kids[id].forEach((e) => {
      level[e.target] = Math.max(level[e.target] ?? 0, level[id] + 1);
      if (--left[e.target] === 0) queue.push(e.target);
    });
  }

  const cols = {};
  nodes.forEach((n) => {
    (cols[level[n.id] ?? 0] = cols[level[n.id] ?? 0] || []).push(n.id);
  });

  const row = {},
    pos = {};
  Object.keys(cols)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach((l) => {
      const ids = cols[l];
      const rank = (id) => {
        const ps = parents[id];
        if (!ps.length) return 0;
        const edge = edges.find((e) => e.target === id);
        return (
          Math.min(...ps.map((p) => row[p] ?? 0)) * 10 +
          (edge?.sourceHandle === "false" ? 1 : 0)
        );
      };
      ids.sort((a, b) => rank(a) - rank(b));
      ids.forEach((id, i) => {
        row[id] = i;
      });
      const offset = ((ids.length - 1) * ROW_H) / 2;
      ids.forEach((id, i) => {
        pos[id] = { x: l * COL_W, y: i * ROW_H - offset };
      });
    });

  return nodes.map((n) => ({ ...n, position: pos[n.id] || n.position }));
}

export function stepsToGraph(steps) {
  const safe = steps.map((s) => ({ ...s, client_id: s.client_id || nextId() }));
  const nodes = safe.map((s) => ({
    id: s.client_id,
    type: s.step_type,
    position: s.config?.ui_pos || { x: 0, y: 0 },
    data: {
      actionKey: s.action_key,
      appEvent: s.app_event,
      config: s.config,
      stepType: s.step_type,
      order: s.order,
    },
  }));
  const edges = safe
    .filter((s) => s.parent_client_id)
    .map((s) => {
      const sourceHandle = s.branch || "out";
      return {
        id: `${s.parent_client_id}-${s.client_id}`,
        source: s.parent_client_id,
        target: s.client_id,
        sourceHandle,
        ...getEdgeStyling(sourceHandle),
      };
    });
  return { nodes, edges };
}

export function graphToSteps(nodes, edges) {
  const steps = nodes.map((n) => {
    let cfg = n.data.config;
    if (typeof cfg === "string") {
      try {
        cfg = JSON.parse(cfg);
      } catch {
        cfg = {};
      }
    }
    if (
      cfg &&
      typeof cfg === "object" &&
      cfg["0"] !== undefined &&
      cfg.field === undefined
    )
      cfg = {};
    return {
      client_id: n.id,
      step_type: n.data.stepType,
      action_key: n.data.actionKey || "",
      app_event: n.data.appEvent || "",
      config: { ...(cfg || {}), ui_pos: n.position },
      order: n.data.order ?? 0,
      parent_client_id: null,
      branch: "",
    };
  });
  edges.forEach((e) => {
    const child = steps.find((s) => s.client_id === e.target);
    if (!child) return;
    child.parent_client_id = e.source;
    child.branch =
      e.sourceHandle === "true" || e.sourceHandle === "false"
        ? e.sourceHandle
        : "";
  });
  return steps;
}

// Action nodes that run before `targetId`, for the "Insert variables" chips.
export function getUpstream(targetId, edges, nodes) {
  const seen = new Set(),
    out = [];
  const walk = (id) =>
    edges
      .filter((e) => e.target === id)
      .forEach((e) => {
        if (seen.has(e.source)) return;
        seen.add(e.source);
        const n = nodes.find((x) => x.id === e.source);
        if (n?.type === "action") out.push(n);
        walk(e.source);
      });
  walk(targetId);
  return out;
}

export function computeFlow(nodes, edges) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const rank = (h) => (h === "true" ? 0 : h === "false" ? 1 : 2);
  const out = {};
  edges.forEach((e) => {
    (out[e.source] = out[e.source] || []).push(e);
  });
  Object.values(out).forEach((list) =>
    list.sort(
      (a, b) =>
        rank(a.sourceHandle) - rank(b.sourceHandle) ||
        (byId[a.target]?.data?.order ?? 0) -
          (byId[b.target]?.data?.order ?? 0) ||
        (byId[a.target]?.position?.y ?? 0) - (byId[b.target]?.position?.y ?? 0),
    ),
  );
  const numbers = {};
  const reachable = new Set();
  let count = 0;
  const visit = (id) => {
    if (reachable.has(id) || !byId[id]) return;
    reachable.add(id);
    numbers[id] = ++count;
    (out[id] || []).forEach((e) => visit(e.target));
  };
  nodes.filter((n) => n.type === "trigger").forEach((t) => visit(t.id));
  return { numbers, reachable };
}
