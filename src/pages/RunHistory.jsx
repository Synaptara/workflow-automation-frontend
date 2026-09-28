import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { listRuns } from "../api/workflows";

const statusClass = {
  success: "bg-status-success/10 text-status-success border-status-success/20",
  failed: "bg-status-danger/10 text-status-danger border-status-danger/20",
  running: "bg-accent/10 text-accent border-accent/20",
  pending: "bg-surface-elevated text-text-muted border-border-default",
};

export default function RunHistory() {
  const { id } = useParams();
  const [runs, setRuns] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    listRuns(id).then(setRuns);
  }, [id]);

  return (
    <div className="h-full overflow-y-auto px-8 py-10">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <Link to={`/workflows/${id}`} className="text-accent text-sm font-medium hover:underline flex items-center gap-1 w-fit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to builder
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Run History</h1>
          <p className="text-sm text-text-secondary mt-1">Review webhook triggers and step-by-step execution logs.</p>
        </div>

        <div className="border border-border-default rounded-xl bg-surface shadow-sm overflow-hidden mt-2">
          <table className="w-full text-sm">
            <thead className="bg-surface-hover border-b border-border-default text-text-muted text-left">
              <tr>
                <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Started</th>
                <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Finished</th>
                <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Steps</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <>
                  <tr
                    key={r.id}
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    className="border-b border-border-subtle cursor-pointer hover:bg-surface-hover/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${statusClass[r.status] || statusClass.pending}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-primary font-medium">{new Date(r.started_at).toLocaleString()}</td>
                    <td className="px-6 py-4 text-text-muted">
                      {r.finished_at ? new Date(r.finished_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-text-muted flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center font-bold text-xs border border-border-default">{r.step_runs.length}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${expanded === r.id ? "rotate-180 text-accent" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
                    </td>
                  </tr>

                  {expanded === r.id && (
                    <tr key={`${r.id}-detail`} className="bg-canvas">
                      <td colSpan="4" className="p-0 border-b border-border-default shadow-inner">
                        <div className="p-8 flex flex-col gap-8">

                          {/* 1. The Incoming Trigger Data */}
                          <div className="flex flex-col gap-2">
                            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                              Incoming Trigger Payload
                            </h3>
                            <div className="bg-surface border border-border-default rounded-lg p-4 shadow-sm">
                              <pre className="text-xs font-mono text-text-secondary overflow-x-auto">
                                {JSON.stringify(r.trigger_payload, null, 2)}
                              </pre>
                            </div>
                          </div>

                          {/* 2. The Step-by-Step Execution Logs */}
                          <div className="flex flex-col gap-3">
                            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                              Module Executions
                            </h3>

                            {r.step_runs?.length > 0 ? (
                              <div className="flex flex-col gap-4 pl-2 border-l-2 border-border-default ml-2">
                                {r.step_runs.map((step, idx) => (
                                  <div key={step.id} className="bg-surface border border-border-default rounded-xl p-5 shadow-sm relative ml-4">
                                    {/* Timeline dot */}
                                    <div className="absolute top-6 -left-[27px] w-3 h-3 rounded-full bg-border-focus border-4 border-canvas"></div>

                                    <div className="flex items-center justify-between mb-4">
                                      <span className="text-sm font-bold text-text-primary capitalize flex items-center gap-3">
                                        <span className="bg-surface-elevated text-text-muted px-2.5 py-1 rounded-md text-xs border border-border-subtle shadow-inner">Step {idx + 1}</span>
                                        {step.action_key || step.step_type}
                                      </span>
                                      <span className={`text-[10px] px-2.5 py-1.5 rounded-full font-bold uppercase tracking-wider border ${
                                        step.status === 'success' ? 'bg-status-success/10 text-status-success border-status-success/20' : 'bg-status-danger/10 text-status-danger border-status-danger/20'
                                      }`}>
                                        {step.status}
                                      </span>
                                    </div>

                                    {/* Show the JSON response from the API */}
                                    {step.output && Object.keys(step.output).length > 0 && (
                                      <div className="mt-2 bg-canvas border border-border-subtle rounded-lg p-3">
                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Response Output</p>
                                        <pre className="text-[11px] font-mono text-accent overflow-x-auto">
                                          {JSON.stringify(step.output, null, 2)}
                                        </pre>
                                      </div>
                                    )}

                                    {/* Show the Python Traceback if it failed */}
                                    {step.error && (
                                      <div className="mt-2 bg-[#1a0f14] border border-status-danger/30 rounded-lg p-3">
                                        <p className="text-[10px] font-bold text-status-danger uppercase tracking-wider mb-2">Error Trace</p>
                                        <pre className="text-[11px] font-mono text-status-danger overflow-x-auto whitespace-pre-wrap">
                                          {step.error}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-text-muted italic bg-surface-elevated p-4 rounded-xl border border-border-default ml-2">
                                No steps executed for this trigger.
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {runs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-text-muted font-medium bg-surface/50">
                    No runs recorded for this workflow yet.
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
