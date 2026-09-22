import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { listRuns } from "../api/workflows";

const statusClass = {
  success: "bg-status-success/20 text-status-success",
  failed: "bg-status-danger/20 text-status-danger",
  running: "bg-accent/20 text-accent",
  pending: "bg-base-800 text-text-muted",
};

function StepRunRow({ step }) {
  return (
    <div className="flex items-start gap-3 py-2 border-t border-border first:border-t-0">
      <span className={`px-2 py-0.5 rounded text-xs shrink-0 ${statusClass[step.status] || statusClass.pending}`}>
        {step.status}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-text-primary text-xs capitalize">
          {step.step_type}
          {step.action_key ? ` · ${step.action_key}` : ""}
        </p>
        {step.status === "failed" && step.error && (
          <p className="text-status-danger text-xs mt-1 break-words">{step.error}</p>
        )}
        {step.status === "success" && Object.keys(step.output || {}).length > 0 && (
          <pre className="text-text-muted text-xs mt-1 whitespace-pre-wrap break-words">
            {JSON.stringify(step.output, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

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
                {expanded === r.id && (
                  <tr key={`${r.id}-detail`} className="bg-base-950">
                    <td colSpan={4} className="px-4 py-3">
                      <p className="text-text-muted text-xs uppercase tracking-wide mb-2">
                        Trigger payload
                      </p>
                      <pre className="text-text-muted text-xs mb-3 whitespace-pre-wrap break-words">
                        {JSON.stringify(r.trigger_payload, null, 2)}
                      </pre>
                      {r.step_runs.length === 0 ? (
                        <p className="text-text-muted text-xs">No steps ran.</p>
                      ) : (
                        r.step_runs.map((s) => <StepRunRow key={s.id} step={s} />)
                      )}
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
