import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTemplates, useTemplate } from "../api/workflows";

export default function TemplateGallery() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getTemplates()
      .then(setTemplates)
      .finally(() => setLoading(false));
  }, []);

  const handleUseTemplate = async (template) => {
    setCloning(template.id);
    try {
      const newWorkflow = await useTemplate({
        name: template.name,
        steps: template.steps,
      });
      // Route the user directly into their new pre-built workflow!
      navigate(`/workflows/${newWorkflow.id}`);
    } catch (error) {
      alert("Failed to clone template");
      setCloning(null);
    }
  };

  if (loading) return <div className="p-10 text-center text-[#71717a]">Loading templates...</div>;

  return (
    <div className="h-full overflow-y-auto px-4 sm:px-10 py-6 sm:py-7 bg-canvas custom-scrollbar">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-serif text-white tracking-tight">Template Gallery</h1>
          <p className="text-sm text-[#a1a1aa] mt-2">Start automating in seconds with pre-built workflow templates.</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <div key={tpl.id} className="group bg-[#08090e] border border-[#222222] rounded-2xl p-6 flex flex-col gap-4 hover:border-[#404040] transition-all shadow-sm">
              <div className="flex items-center gap-4 border-b border-[#1f1f1f] pb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner"
                  style={{ backgroundColor: tpl.color || '#333' }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </div>
                <h3 className="text-base font-bold text-white leading-tight">{tpl.name}</h3>
              </div>

              <p className="text-xs text-[#a1a1aa] leading-relaxed flex-1">
                {tpl.description}
              </p>

              <button
                onClick={() => handleUseTemplate(tpl)}
                disabled={cloning === tpl.id}
                className="w-full mt-2 bg-white hover:bg-[#e4e4e7] text-black text-sm font-bold py-2.5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cloning === tpl.id ? "Creating Workflow..." : "Use Template"}
                {!cloning && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
