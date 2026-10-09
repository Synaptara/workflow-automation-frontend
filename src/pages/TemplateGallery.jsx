import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTemplates, useTemplate } from "../api/workflows";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Activity, LayoutTemplate, ArrowRight, Zap } from "lucide-react";

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
      // Route the user directly into their new pre-built workflow
      navigate(`/workflows/${newWorkflow.id}`);
    } catch (error) {
      alert("Failed to clone template");
      setCloning(null);
    }
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-background">
      <Activity className="w-5 h-5 text-muted-foreground animate-spin" />
    </div>
  );

  return (
    <div className="h-full overflow-y-auto px-4 py-6 sm:px-6 md:px-8 bg-background custom-scrollbar">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8 pb-20">

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Template Gallery</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Start automating in seconds with pre-built workflow templates.</p>
          </div>
        </div>

        {/* Dynamic State: Show Empty Placeholder OR Grid of Templates */}
        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border border-border rounded-xl bg-accent/10 border-dashed mt-4">
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-5 shadow-sm border border-border/50">
              <LayoutTemplate className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-[16px] font-semibold text-foreground tracking-tight mb-2">No templates found</h3>
            <p className="text-[13px] text-muted-foreground max-w-md text-center leading-relaxed">
              We are actively working on building a library of high-quality templates to help you orchestrate your integrations faster. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {templates.map((tpl) => (
              <Card key={tpl.id} className="group bg-background border border-border rounded-xl p-5 flex flex-col hover:border-foreground/30 transition-colors shadow-sm min-h-[220px]">

                <div className="flex items-center gap-4 border-b border-border pb-4 mb-4">
                  <div
                    className="w-10 h-10 rounded-md flex items-center justify-center shadow-sm shrink-0 border border-border/50"
                    style={{ backgroundColor: tpl.color || 'var(--accent)' }}
                  >
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-[14px] font-semibold text-foreground tracking-tight line-clamp-2">
                    {tpl.name}
                  </h3>
                </div>

                <p className="text-[12px] text-muted-foreground leading-relaxed flex-1 line-clamp-3 mb-4">
                  {tpl.description}
                </p>

                <Button
                  onClick={() => handleUseTemplate(tpl)}
                  disabled={cloning === tpl.id}
                  className="w-full h-9 font-medium text-[13px] gap-2 mt-auto"
                >
                  {cloning === tpl.id ? (
                    <><Activity className="w-4 h-4 animate-spin" /> Creating...</>
                  ) : (
                    <>Use Template <ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>
              </Card>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
