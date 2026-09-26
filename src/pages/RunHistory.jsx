import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { listRuns } from "../api/workflows";

const statusClass = {
  success: "bg-status-success/20 text-status-success",
  failed: "bg-status-danger/20 text-status-danger",
  running: "bg-accent/20 text-accent",
  pending: "bg-base-800 text-text-muted",
};

export default function RunHistory() {
  const { id } = useParams();
  const [runs, setRuns] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    listRuns(id).then(setRuns);
  }, [id]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Link to={`/workflows/${id}`} className="text-accent text-sm hover:underline">
        ← Back to builder
      </Link>
      <h1 className="text-xl font-semibold text-text-primary mt-2 mb-6">Run history</h1>

      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-base-900 text-text-muted text-left">
            <tr>
              <th className="px-4 py-2 font-normal">Status</th>
              <th className="px-4 py-2 font-normal">Started</th>
              <th className="px-4 py-2 font-normal">Finished</th>
              <th className="px-4 py-2 font-normal">Steps</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <>
                <tr
                  key={r.id}
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  className="border-t border-border cursor-pointer hover:bg-base-900"
                >
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${statusClass[r.status] || statusClass.pending}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-text-muted">{new Date(r.started_at).toLocaleString()}</td>
                  <td className="px-4 py-2 text-text-muted">
                    {r.finished_at ? new Date(r.finished_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-2 text-text-muted">
                    {r.step_runs.length} {expanded === r.id ? "▲" : "▼"}
                  </td>
                </tr>
                
                {/* Expanded Row Content */}
                {expanded === r.id && (
                  <tr key={`${r.id}-detail`} className="bg-base-950">
                    <td colSpan="4" className="p-0 border-b border-border">
                      <div className="bg-base-900/50 p-6 flex flex-col gap-6 shadow-inner">
                        
                        {/* 1. The Incoming Trigger Data */}
                        <div>
                          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Incoming Trigger Payload</p>
                          <pre className="bg-base-800 border border-border p-3 rounded-lg text-xs font-mono text-text-primary overflow-x-auto">
                            {JSON.stringify(r.trigger_payload, null, 2)}
                          </pre>
                        </div>

                        {/* 2. The Step-by-Step Execution Logs */}
                        <div>
                          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Module Executions</p>
                          {r.step_runs?.length > 0 ? (
                            <div className="flex flex-col gap-3">
                              {r.step_runs.map((step, idx) => (
                                <div key={step.id} className="bg-base-800 border border-border rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-text-primary capitalize flex items-center gap-2">
                                      <span className="bg-base-900 text-text-muted px-2 py-0.5 rounded text-xs">{idx + 1}</span>
                                      {step.action_key || step.step_type}
                                    </span>
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                      step.status === 'success' ? 'bg-status-success/10 text-status-success' : 'bg-status-danger/10 text-status-danger'
                                    }`}>
                                      {step.status}
                                    </span>
                                  </div>

                                  {/* Show the JSON response from the API (e.g., HTTPbin or Resend) */}
                                  {step.output && Object.keys(step.output).length > 0 && (
                                    <div className="mt-3">
                                      <p className="text-[10px] text-text-muted uppercase mb-1">Response Output</p>
                                      <pre className="bg-base-900 border border-border p-3 rounded text-xs font-mono text-accent overflow-x-auto">
                                        {JSON.stringify(step.output, null, 2)}
                                      </pre>
                                    </div>
                                  )}

                                  {/* Show the Python Traceback if it failed */}
                                  {step.error && (
                                    <div className="mt-3">
                                      <p className="text-[10px] text-text-muted uppercase mb-1">Error Trace</p>
                                      <pre className="bg-base-900 border border-status-danger/30 p-3 rounded text-xs font-mono text-status-danger overflow-x-auto whitespace-pre-wrap">
                                        {step.error}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-text-muted italic bg-base-800 p-3 rounded-lg border border-border">
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
                <td colSpan={4} className="px-4 py-6 text-center text-text-muted">
                  No runs yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}