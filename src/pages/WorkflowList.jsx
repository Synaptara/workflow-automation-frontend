import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listWorkflows, createWorkflow } from "../api/workflows";

export default function WorkflowList() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    listWorkflows().then((data) => {
      setWorkflows(data);
      setLoading(false);
    });
  }, []);

  const handleCreate = async () => {
    const name = window.prompt("Workflow name");
    if (!name) return;
    const wf = await createWorkflow(name);
    navigate(`/workflows/${wf.id}`);
  };

  if (loading) return <p className="text-text-muted px-6 py-8">Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Workflows</h1>
        <button
          onClick={handleCreate}
          className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          New workflow
        </button>
      </div>

      {workflows.length === 0 ? (
        <div className="border border-border rounded-xl bg-base-900 py-16 flex flex-col items-center gap-3">
          <p className="text-text-primary font-medium">No workflows yet</p>
          <p className="text-text-muted text-sm">Create one to get a webhook URL and start automating.</p>
          <button
            onClick={handleCreate}
            className="mt-2 bg-base-800 border border-border text-text-primary text-sm px-4 py-2 rounded-lg hover:border-accent transition-colors"
          >
            Start building
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((wf) => (
            <button
              key={wf.id}
              onClick={() => navigate(`/workflows/${wf.id}`)}
              className="text-left bg-base-900 border border-border rounded-xl p-5 hover:border-accent transition-colors"
            >
              <p className="text-text-primary font-medium mb-1">{wf.name}</p>
              <p className="text-text-muted text-xs">{wf.steps?.length || 0} steps</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
