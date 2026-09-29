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

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-canvas">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        <p className="text-zinc-400 text-sm font-medium">Loading workflows...</p>
      </div>
    </div>
  );

  return (
      <main className="flex-1 h-full overflow-y-auto px-4 sm:px-6 py-6 lg:px-10 lg:py-9 space-y-6 sm:space-y-8 bg-canvas custom-scrollbar">

        {/* Page Title & Primary Actions Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-[1400px] mx-auto">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl font-normal tracking-tight text-white">Your workflows</h2>
            <p className="text-sm text-zinc-400 mt-1.5 font-normal">Manage and monitor your automated pipelines.</p>
          </div>

          <div className="w-full sm:w-auto">
            <button
              onClick={handleCreate}
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-sm font-semibold shadow-sm transition transform active:scale-95"
              type="button"
            >
            <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <line x1="12" x2="12" y1="5" y2="19"></line>
              <line x1="5" x2="19" y1="12" y2="12"></line>
            </svg>
            <span>Create Workflow</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1b1b1e] pb-3 max-w-[1400px] mx-auto">
              <div className="flex items-center gap-6 overflow-x-auto custom-scrollbar">
                <div className="relative pb-3 -mb-3.5 border-b-2 border-white flex items-center gap-2 whitespace-nowrap">
                  <span className="text-sm font-medium text-white">All workflows</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold">{workflows.length}</span>
                </div>
              </div>

              <div className="relative w-full sm:w-80 shrink-0 mt-2 sm:mt-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
            </svg>
          </div>
          <input
            className="w-full bg-[#111114] border border-[#232327] rounded-lg pl-9 pr-12 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
            placeholder="Search workflows..."
            type="text"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="text-[10px] text-zinc-400 border border-zinc-800 rounded px-1.5 py-0.5 bg-zinc-900 font-sans">⌘K</kbd>
          </div>
        </div>
      </div>

      {/* Workflows Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 max-w-[1400px] mx-auto pb-20">

        {workflows.map((wf) => (
          <div
            key={wf.id}
            onClick={() => navigate(`/workflows/${wf.id}`)}
            className="group relative bg-[#111114] hover:bg-[#151519] border border-white/10 hover:border-zinc-700/80 rounded-xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:shadow-black/60 cursor-pointer"
          >
            <div>
              {/* Card Header: Icon & Status */}
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-[#19191d] border border-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition shadow-inner">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                    </span>
                    Active
                  </span>
                  <button className="w-7 h-7 rounded-lg border border-zinc-800 bg-[#19191d] text-zinc-400 hover:text-white hover:border-zinc-600 hover:bg-zinc-800 flex items-center justify-center transition" type="button" onClick={(e) => e.stopPropagation()}>
                    <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Workflow Title & Mini Pipeline Preview */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors tracking-tight truncate pr-4">
                    {wf.name}
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-500 whitespace-nowrap">Ready</span>
                </div>

                <div className="flex items-center gap-1.5 py-1 overflow-hidden">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono whitespace-nowrap">Trigger</span>
                  <svg className="w-3 h-3 text-zinc-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono whitespace-nowrap">Action</span>
                  {wf.steps?.length > 2 && (
                    <>
                      <svg className="w-3 h-3 text-zinc-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 font-mono whitespace-nowrap">Output</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="mt-6 pt-4 border-t border-zinc-800/50 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect height="7" rx="1" width="7" x="3" y="3"></rect>
                  <rect height="7" rx="1" width="7" x="14" y="3"></rect>
                  <rect height="7" rx="1" width="7" x="14" y="14"></rect>
                  <rect height="7" rx="1" width="7" x="3" y="14"></rect>
                </svg>
                <span>{wf.steps?.length || 0} Modules</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-12 h-3.5 text-emerald-400/80" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 48 14">
                  <path d="M0 10 L8 8 L16 11 L24 4 L32 7 L40 2 L48 5"></path>
                </svg>
              </div>
            </div>
          </div>
        ))}

        {/* Create New Pipeline Placeholder Card */}
        <div
          onClick={handleCreate}
          className="group relative border border-dashed border-zinc-800 hover:border-zinc-600 hover:bg-[#111114]/80 bg-zinc-950/40 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[220px]"
        >
          <div className="w-10 h-10 rounded-xl bg-zinc-900/90 group-hover:bg-zinc-800 border border-zinc-800/80 group-hover:border-zinc-600 flex items-center justify-center text-zinc-400 group-hover:text-white transition shadow-sm mb-3">
            <svg className="w-5 h-5 stroke-[2] transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <line x1="12" x2="12" y1="5" y2="19"></line>
              <line x1="5" x2="19" y1="12" y2="12"></line>
            </svg>
          </div>
          <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">Create new pipeline</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-[190px]">Connect models, triggers & actions in visual canvas</p>
          <span className="mt-3 text-[11px] font-medium text-emerald-400/80 group-hover:text-emerald-400 transition-colors flex items-center gap-1">
            <span>Start from scratch</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </span>
        </div>

      </section>
    </main>
  );
}
