import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listWorkflows, createWorkflow, updateWorkflow, deleteWorkflow } from "../api/workflows";

export default function WorkflowList() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);

  // Custom Modal State Management
  const [modalState, setModalState] = useState({ type: null, id: null, name: "" });
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    listWorkflows().then((data) => {
      setWorkflows(data);
      setLoading(false);
    });
  }, []);

  // Modal Triggers
  const openCreateModal = () => {
    setModalError("");
    setInputValue("");
    setModalState({ type: "create", id: null, name: "" });
  };

  const openRenameModal = (e, id, currentName) => {
    e.stopPropagation();
    setActiveMenu(null);
    setModalError("");
    setInputValue(currentName);
    setModalState({ type: "rename", id, name: currentName });
  };

  const openDeleteModal = (e, id, currentName) => {
    e.stopPropagation();
    setActiveMenu(null);
    setModalError("");
    setModalState({ type: "delete", id, name: currentName });
  };

  const closeModal = () => {
    setModalState({ type: null, id: null, name: "" });
    setInputValue("");
    setModalError("");
  };

  // Unified Submission Handler for all 3 Custom Modals
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError("");
    setIsSubmitting(true);

    try {
      if (modalState.type === "create") {
        const wf = await createWorkflow(inputValue.trim());
        navigate(`/workflows/${wf.id}`);
      }
      else if (modalState.type === "rename") {
        if (inputValue.trim() !== "" && inputValue !== modalState.name) {
          await updateWorkflow(modalState.id, { name: inputValue.trim() });
          setWorkflows((prev) =>
            prev.map((w) => (w.id === modalState.id ? { ...w, name: inputValue.trim() } : w))
          );
        }
        closeModal();
      }
      else if (modalState.type === "delete") {
        await deleteWorkflow(modalState.id);
        setWorkflows((prev) => prev.filter((w) => w.id !== modalState.id));
        closeModal();
      }
    } catch (err) {
      if (modalState.type === "create" && err.response?.status === 403) {
        setModalError("Free plan limit reached (max 2 workflows). Upgrade your plan to create more pipelines.");
      } else {
        setModalError("An error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-[#060607]">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        <p className="text-zinc-400 text-sm font-medium">Loading workflows...</p>
      </div>
    </div>
  );

  return (
    <main className="flex-1 h-full overflow-y-auto px-4 sm:px-6 py-6 lg:px-10 lg:py-9 space-y-6 sm:space-y-8 bg-[#060607] custom-scrollbar relative">

      {/* Page Title & Primary Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-[1400px] mx-auto">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-normal tracking-tight text-zinc-100">Your workflows</h1>
          <p className="text-sm text-zinc-400 mt-1.5 font-medium">Manage and monitor your automated pipelines.</p>
        </div>

        <div className="w-full sm:w-auto">
          <button
            onClick={openCreateModal}
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-900 text-sm font-bold shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all transform active:scale-95"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-3 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-6 overflow-x-auto custom-scrollbar">
          <div className="relative pb-3 -mb-3.5 border-b-2 border-zinc-100 flex items-center gap-2 whitespace-nowrap">
            <span className="text-sm font-semibold text-zinc-100">All workflows</span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-bold">{workflows.length}</span>
          </div>
        </div>

        <div className="relative w-full sm:w-80 shrink-0 mt-2 sm:mt-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
            </svg>
          </div>
          <input
            className="w-full bg-[#09090b] border border-zinc-800 hover:border-zinc-700 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 rounded-md pl-9 pr-12 py-2 text-xs font-medium text-zinc-200 placeholder-zinc-500 outline-none transition-all shadow-sm"
            placeholder="Search workflows..."
            type="text"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="text-[10px] text-zinc-400 border border-zinc-800 rounded px-1.5 py-0.5 bg-zinc-900 font-sans font-bold">⌘K</kbd>
          </div>
        </div>
      </div>

      {/* Workflows Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 max-w-[1400px] mx-auto pb-20">

        {workflows.map((wf) => (
          <div
            key={wf.id}
            onClick={() => navigate(`/workflows/${wf.id}`)}
            className="group relative bg-[#09090b] hover:bg-[#0c0c0e] border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-5 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-lg cursor-pointer"
          >
            <div>
              {/* Card Header: Icon & Status & Menu */}
              <div className="flex items-center justify-between relative">

                <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 group-hover:bg-zinc-800/50 group-hover:text-emerald-400 transition shadow-inner">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                  </svg>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                    </span>
                    Active
                  </span>

                  {/* 3-Dot Menu */}
                  <div className="relative">
                    <button
                      className="w-7 h-7 rounded-md border border-transparent hover:border-zinc-700 bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-colors"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(activeMenu === wf.id ? null : wf.id);
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <circle cx="12" cy="5" r="1.5"></circle>
                        <circle cx="12" cy="12" r="1.5"></circle>
                        <circle cx="12" cy="19" r="1.5"></circle>
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {activeMenu === wf.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setActiveMenu(null); }} />
                        <div className="absolute right-0 top-full mt-1 w-36 bg-[#0c0c0e] border border-zinc-800 rounded-lg shadow-2xl z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          <button
                            onClick={(e) => openRenameModal(e, wf.id, wf.name)}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800/80 hover:text-white transition-colors flex items-center gap-2"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                            </svg>
                            Rename
                          </button>
                          <div className="h-px bg-zinc-800/50 my-1" />
                          <button
                            onClick={(e) => openDeleteModal(e, wf.id, wf.name)}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors flex items-center gap-2"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Workflow Title & Mini Pipeline Preview */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors tracking-tight truncate pr-4">
                    {wf.name}
                  </h3>
                  <span className="text-[11px] font-mono font-medium text-zinc-500 whitespace-nowrap">Ready</span>
                </div>

                <div className="flex items-center gap-1.5 py-1 overflow-hidden">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono whitespace-nowrap">Trigger</span>
                  <svg className="w-3 h-3 text-zinc-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono whitespace-nowrap">Action</span>
                  {wf.steps?.length > 2 && (
                    <>
                      <svg className="w-3 h-3 text-zinc-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono whitespace-nowrap">Output</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="mt-6 pt-4 border-t border-zinc-800/50 flex items-center justify-between text-xs text-zinc-400 font-medium">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <rect height="7" rx="1" width="7" x="3" y="3"></rect>
                  <rect height="7" rx="1" width="7" x="14" y="3"></rect>
                  <rect height="7" rx="1" width="7" x="14" y="14"></rect>
                  <rect height="7" rx="1" width="7" x="3" y="14"></rect>
                </svg>
                <span>{wf.steps?.length || 0} Modules</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-12 h-3.5 text-emerald-400/60 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 48 14">
                  <path d="M0 10 L8 8 L16 11 L24 4 L32 7 L40 2 L48 5"></path>
                </svg>
              </div>
            </div>
          </div>
        ))}

        {/* Create New Pipeline Placeholder Card */}
        <div
          onClick={openCreateModal}
          className="group relative border border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-900/20 hover:bg-zinc-900/40 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[220px]"
        >
          <div className="w-10 h-10 rounded-xl bg-zinc-900 group-hover:bg-zinc-800 border border-zinc-800 group-hover:border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:text-zinc-100 transition shadow-sm mb-3">
            <svg className="w-5 h-5 stroke-[2] transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <line x1="12" x2="12" y1="5" y2="19"></line>
              <line x1="5" x2="19" y1="12" y2="12"></line>
            </svg>
          </div>
          <p className="text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors">Create new pipeline</p>
          <p className="text-xs font-medium text-zinc-500 mt-1 max-w-[190px]">Connect models, triggers & actions in visual canvas</p>
          <span className="mt-3 text-[11px] font-bold text-emerald-500/80 group-hover:text-emerald-400 transition-colors flex items-center gap-1">
            <span>Start from scratch</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
          </span>
        </div>

      </section>

      {/* ------------------------------------------------------------- */}
      {/* CUSTOM MODALS FOR CREATE, RENAME, AND DELETE */}
      {/* ------------------------------------------------------------- */}
      {modalState.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className="bg-[#09090b] border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-zinc-100 tracking-tight">
                {modalState.type === "create" && "Create new pipeline"}
                {modalState.type === "rename" && "Rename pipeline"}
                {modalState.type === "delete" && "Delete pipeline"}
              </h3>
              <button
                onClick={closeModal}
                className="text-zinc-500 hover:text-zinc-300 transition-colors rounded-md p-1 hover:bg-zinc-800"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Error Message */}
            {modalError && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                {modalError}
              </div>
            )}

            {/* Modal Body form */}
            <form onSubmit={handleModalSubmit} className="flex flex-col gap-5">

              {/* Delete View */}
              {modalState.type === "delete" ? (
                <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                  Are you sure you want to delete <span className="text-zinc-200 font-bold">"{modalState.name}"</span>? All modules, run history, and configurations will be permanently erased. This action cannot be undone.
                </p>
              ) : (
                /* Create & Rename View */
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-300">Workflow Name</label>
                  <input
                    type="text"
                    autoFocus
                    className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 rounded-md px-3 py-2.5 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-600 shadow-inner"
                    placeholder="e.g., Lead sync to Notion"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-md bg-transparent text-zinc-400 hover:text-zinc-100 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (modalState.type !== "delete" && !inputValue.trim())}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
                    ${modalState.type === "delete"
                      ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                      : "bg-zinc-100 hover:bg-white text-zinc-900"
                    }
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    modalState.type === "delete" ? "Delete Pipeline" : (modalState.type === "create" ? "Create Pipeline" : "Save Changes")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
