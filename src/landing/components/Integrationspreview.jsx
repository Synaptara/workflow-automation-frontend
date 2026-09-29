import { useState } from "react";
import { INTEGRATIONS } from "../data/integrations";

export default function IntegrationsPreview() {
  const [expanded, setExpanded] = useState(false);

  // Always render all items if expanded, or just the first 4 if collapsed
  const visible = expanded ? INTEGRATIONS : INTEGRATIONS.slice(0, 4);
  const hasMore = INTEGRATIONS.length > 4;

  return (
    <section id="integrations" className="relative w-full overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-10">

        {/* Header Section (Matches Hero Split Layout) */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 md:gap-12 mb-16">

          {/* Left Title */}
          <h2 className="text-4xl sm:text-5xl md:text-[48px] font-display font-normal tracking-tight leading-[1.05] shrink-0" style={{ color: "var(--l-text)" }}>
            Connects to the tools <br className="hidden md:block" />
            you already <i className="italic pr-2">use.</i>
          </h2>

          {/* Right Column: Paragraph */}
          <div className="flex flex-col items-start md:items-end md:text-right mt-2 md:mt-3">
            <p className="text-base md:text-lg leading-relaxed max-w-[420px]" style={{ color: "var(--l-text-muted)" }}>
              Every integration is a small, focused module. New ones ship regularly —
              and <i className="font-serif text-white">HTTP Request</i> means you're never blocked on us building one.
            </p>
          </div>
        </div>

        {/* Grid Section */}
        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visible.map((item) => (
              <div
                key={item.key}
                className="group relative rounded-[20px] border p-6 flex flex-col gap-4 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                style={{ borderColor: "var(--l-border)", backgroundColor: "var(--l-surface)" }}
              >
                {/* Icon Container */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center border transition-colors group-hover:border-white/20"
                  style={{ backgroundColor: "var(--l-surface-2)", borderColor: "var(--l-border)" }}
                >
                  {item.icon}
                </div>

                {/* Text Content */}
                <div>
                  <h3 className="text-base font-semibold tracking-tight" style={{ color: "var(--l-text)" }}>
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed mt-1.5" style={{ color: "var(--l-text-muted)" }}>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Gradient Fade for Collapsed State */}
          {!expanded && hasMore && (
            <div
              className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
              style={{ background: "linear-gradient(to bottom, transparent, var(--l-bg) 95%)" }}
            />
          )}
        </div>

        {/* Action Button (Matches Hero Buttons) */}
        {hasMore && (
          <div className="flex justify-center mt-12 relative z-20">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-sm font-medium px-8 py-3.5 rounded-full border hover:bg-white/5 transition-colors"
              style={{ borderColor: "var(--l-border)", color: "var(--l-text)" }}
            >
              {expanded ? "Show less" : `View all ${INTEGRATIONS.length} integrations`}
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
