import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getGlobalHistory } from "../api/workflows";
import { RefreshCw } from "lucide-react";

const statusClass = {
  success: "bg-status-success/10 text-status-success border-status-success/20",
  failed: "bg-status-danger/10 text-status-danger border-status-danger/20",
  running: "bg-accent/10 text-accent border-accent/20 animate-pulse",
  pending: "bg-surface-elevated text-text-muted border-border-default",
};

export default function RunHistory() {
  const [runs, setRuns] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    setRefreshing(true);
    try {
      const data = await getGlobalHistory();
      setRuns(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const calculateExecutionTime = (start, end) => {
    if (!end) return "Running...";
    const diff = new Date(end) - new Date(start);
    if (diff < 1000) return `${diff}ms`;
    return `${(diff / 1000).toFixed(2)}s`;
  };

  if (loading) return <div className="p-8 text-center text-text-muted">Loading logs...</div>;

  return (
    <div className="h-full overflow-y-auto px-4 md:px-8 py-6 md:py-10 custom-scrollbar">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-normal text-white tracking-tight">Global Run History</h1>
            <p className="text-sm text-[#a1a1aa] mt-1">Review execution logs, token usage, and payload data across all workflows.</p>
          </div>
          <button
            onClick={fetchHistory}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 bg-surface-elevated border border-border-default hover:bg-surface-hover text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all w-full md:w-auto"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-accent" : ""}`} />
            Refresh Logs
          </button>
        </div>

        {/* Added overflow-x-auto for mobile responsiveness */}
        <div className="border border-[#1f1f1f] rounded-xl bg-[#0c0c0e] shadow-sm overflow-x-auto mt-2">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-[#111111] border-b border-[#1f1f1f] text-[#71717a] text-left whitespace-nowrap">
              <tr>
                <th className="px-6 py-4 font-semibold text-[10px] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold text-[10px] uppercase tracking-wider">Workflow</th>
                <th className="px-6 py-4 font-semibold text-[10px] uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 font-semibold text-[10px] uppercase tracking-wider">Exec Time</th>
                <th className="px-6 py-4 font-semibold text-[10px] uppercase tracking-wider text-right">Tokens Used</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => {
                const actionCount = r.step_runs?.filter(s => s.step.step_type === "action").length || 0;
                const currentStatus = r.status?.toLowerCase() || "pending";

                return (
                <div key={r.id} className="contents">
                  <tr
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    className="border-b border-[#1f1f1f] cursor-pointer hover:bg-[#141414] transition-colors whitespace-nowrap"
                  >
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusClass[currentStatus] || statusClass.pending}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{r.workflow ? `Workflow ${r.workflow}` : "Unknown"}</span>
                        <Link to={`/workflows/${r.workflow}`} className="text-[#a1a1aa] hover:text-accent p-1" onClick={(e) => e.stopPropagation()}>
                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#a1a1aa] text-xs font-mono">{new Date(r.started_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-[#a1a1aa] text-xs font-mono">
                      {calculateExecutionTime(r.started_at, r.finished_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center justify-center bg-[#111111] border border-[#222222] text-white px-2 py-1 rounded text-xs font-bold font-mono shadow-sm">
                        {actionCount}
                      </span>
                    </td>
                  </tr>

                  {expanded === r.id && (
                    <tr className="bg-[#09090b]">
                      <td colSpan="5" className="p-0 border-b border-[#1f1f1f] shadow-inner">
                        <div className="p-4 md:p-8 flex flex-col gap-8">
                          {/* 1. Incoming Trigger */}
                          <div className="flex flex-col gap-2">
                            <h3 className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                              Incoming Webhook Payload
                            </h3>
                            <div className="bg-[#111111] border border-[#222222] rounded-lg p-4 shadow-sm w-full overflow-x-auto">
                              <pre className="text-xs font-mono text-[#a1a1aa]">
                                {JSON.stringify(r.trigger_payload, null, 2)}
                              </pre>
                            </div>
                          </div>

                          {/* 2. Step-by-Step logs */}
                          <div className="flex flex-col gap-3">
                            <h3 className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                              Execution Trace
                            </h3>
                            {r.step_runs?.length > 0 ? (
                              <div className="flex flex-col gap-4 pl-2 border-l-2 border-[#1f1f1f] ml-2">
                                {r.step_runs.map((step, idx) => (
                                  <div key={step.id} className="bg-[#111111] border border-[#222222] rounded-xl p-4 md:p-5 shadow-sm relative ml-4">
                                    <div className="absolute top-6 -left-[27px] md:-left-[29px] w-3 h-3 rounded-full bg-[#3f3f46] border-4 border-[#09090b]"></div>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                                      <span className="text-sm font-bold text-white capitalize flex items-center gap-3">
                                        <span className="bg-[#0c0c0e] text-[#a1a1aa] px-2.5 py-1 rounded-md text-xs border border-[#1f1f1f]">Step {idx + 1}</span>
                                        {step.action_key || step.step_type}
                                      </span>
                                      <span className={`w-max text-[9px] px-2.5 py-1.5 rounded-full font-bold uppercase tracking-wider border ${
                                        step.status === 'success' ? 'bg-status-success/10 text-status-success border-status-success/20' : 'bg-status-danger/10 text-status-danger border-status-danger/20'
                                      }`}>
                                        {step.status}
                                      </span>
                                    </div>
                                    {step.output && Object.keys(step.output).length > 0 && (
                                      <div className="mt-2 bg-[#09090b] border border-[#1f1f1f] rounded-lg p-3 w-full overflow-x-auto">
                                        <p className="text-[9px] font-bold text-[#71717a] uppercase tracking-wider mb-2">Response Output</p>
                                        <pre className="text-[11px] font-mono text-accent">
                                          {JSON.stringify(step.output, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                    {step.error && (
                                      <div className="mt-2 bg-[#1a0f14] border border-[#f85149]/30 rounded-lg p-3 w-full overflow-x-auto">
                                        <p className="text-[9px] font-bold text-[#f85149] uppercase tracking-wider mb-2">Error Trace</p>
                                        <pre className="text-[11px] font-mono text-[#f85149] whitespace-pre-wrap">{step.error}</pre>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-[#71717a] italic bg-[#111111] p-4 rounded-xl border border-[#222222] ml-2">
                                No internal steps executed.
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </div>
              )})}

              {runs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[#71717a] font-medium bg-[#111111]/50">
                    No runs recorded yet. Check back after a workflow has triggered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
