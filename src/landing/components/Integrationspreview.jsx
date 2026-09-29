import { useState } from "react";
import { INTEGRATIONS } from "../data/integrations";

export default function IntegrationsPreview() {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? INTEGRATIONS : INTEGRATIONS.slice(0, 4);
  const hasMore = INTEGRATIONS.length > 4;

  return (
    <section id="integrations" className="max-w-6xl mx-auto px-6 py-20 md:py-28">
      <div className="max-w-xl mb-12">
        <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-3">
          Connects to the tools you already use
        </h2>
        <p style={{ color: "var(--l-text-muted)" }}>
          Every integration is a small, focused module. New ones ship regularly —
          and HTTP Request means you're never blocked on us building one.
        </p>
      </div>

      <div className="relative">
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 transition-[max-height] duration-500 ease-in-out overflow-hidden"
          style={{ maxHeight: expanded ? 1000 : 200 }}
        >
          {visible.map((item) => (
            <div
              key={item.key}
              className="rounded-xl border p-5 flex flex-col gap-3"
              style={{ borderColor: "var(--l-border)", backgroundColor: "var(--l-surface)" }}
            >
              <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--l-surface-2)" }}>
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-[13px] leading-snug mt-1" style={{ color: "var(--l-text-muted)" }}>
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {!expanded && hasMore && (
          <div
            className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, transparent, var(--l-bg))" }}
          />
        )}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-6 text-sm font-medium px-4 py-2 rounded-full border"
          style={{ borderColor: "var(--l-border)", color: "var(--l-text)" }}
        >
          {expanded ? "Show less" : `View all ${INTEGRATIONS.length} integrations`}
        </button>
      )}
    </section>
  );
}
