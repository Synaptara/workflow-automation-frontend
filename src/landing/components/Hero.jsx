export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "var(--l-gradient)" }}
      />

      <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="grid md:grid-cols-[1.4fr_1fr] gap-8 items-end">
          <h1 className="text-[42px] leading-[1.08] md:text-[64px] md:leading-[1.05] font-medium tracking-tight">
            When something happens,
            <br />
            Flowly handles what's{" "}
            <span className="font-display italic">next</span>.
          </h1>

          <p className="text-[15px] md:text-base leading-relaxed pb-1" style={{ color: "var(--l-text-muted)" }}>
            Watch a webhook, check a condition, and let Flowly notify Slack,
            send an email, or call any API — automatically, every time it happens.
          </p>
        </div>

        <div className="flex items-center gap-4 mt-10">
          <a
            href="/register"
            className="text-sm font-semibold px-5 py-2.5 rounded-full"
            style={{ backgroundColor: "var(--l-btn-primary-bg)", color: "var(--l-btn-primary-text)" }}
          >
            Sign up
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-medium px-5 py-2.5 rounded-full border"
            style={{ borderColor: "var(--l-border)", color: "var(--l-text)" }}
          >
            See how it works
          </a>
        </div>

        <MiniCanvas />
      </div>
    </section>
  );
}

function MiniCanvas() {
  return (
    <div
      className="mt-16 md:mt-20 rounded-2xl border overflow-hidden"
      style={{ borderColor: "var(--l-border)", backgroundColor: "var(--l-surface)" }}
    >
      <div
        className="flex items-center gap-1.5 px-4 h-10 border-b"
        style={{ borderColor: "var(--l-border)" }}
      >
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--l-node-line)" }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--l-node-line)" }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--l-node-line)" }} />
      </div>

      <svg viewBox="0 0 800 220" className="w-full h-[220px] md:h-[260px]" role="img" aria-label="Trigger, condition, and action nodes connected in a flow">
        <line x1="140" y1="110" x2="380" y2="110" stroke="var(--l-node-line)" strokeWidth="2" className="canvas-line" style={{ animationDelay: "0.1s" }} />
        <line x1="440" y1="90" x2="620" y2="60" stroke="var(--l-node-line)" strokeWidth="2" className="canvas-line" style={{ animationDelay: "0.5s" }} />
        <line x1="440" y1="130" x2="620" y2="165" stroke="var(--l-node-line)" strokeWidth="2" className="canvas-line" style={{ animationDelay: "0.5s" }} />

        <g className="canvas-node" style={{ animationDelay: "0s" }}>
          <circle cx="90" cy="110" r="42" fill="var(--l-surface-2)" stroke="var(--l-text)" strokeWidth="1.5" />
          <path d="M78 100h24v8h-24z M78 118h24v6h-24z" fill="var(--l-text)" opacity="0.7" />
          <text x="90" y="172" textAnchor="middle" fontSize="12" fill="var(--l-text-muted)" fontFamily="Figtree, sans-serif">Webhook</text>
        </g>

        <g className="canvas-node" style={{ animationDelay: "0.35s" }}>
          <rect x="365" y="75" width="70" height="70" rx="16" fill="var(--l-surface-2)" stroke="var(--l-text)" strokeWidth="1.5" transform="rotate(45 400 110)" />
          <text x="400" y="115" textAnchor="middle" fontSize="11" fill="var(--l-text)" fontFamily="Figtree, sans-serif">if</text>
          <text x="400" y="172" textAnchor="middle" fontSize="12" fill="var(--l-text-muted)" fontFamily="Figtree, sans-serif">Condition</text>
        </g>

        <g className="canvas-node" style={{ animationDelay: "0.7s" }}>
          <circle cx="660" cy="60" r="36" fill="var(--l-surface-2)" stroke="var(--l-text)" strokeWidth="1.5" />
          <text x="660" y="65" textAnchor="middle" fontSize="11" fill="var(--l-text)" fontFamily="Figtree, sans-serif">Slack</text>
        </g>

        <g className="canvas-node" style={{ animationDelay: "0.85s" }}>
          <circle cx="660" cy="165" r="36" fill="var(--l-surface-2)" stroke="var(--l-text)" strokeWidth="1.5" />
          <text x="660" y="170" textAnchor="middle" fontSize="11" fill="var(--l-text)" fontFamily="Figtree, sans-serif">Email</text>
        </g>
      </svg>

      <style>{`
        .canvas-node, .canvas-line {
          opacity: 0;
          animation: canvasIn 0.5s ease forwards;
        }
        @keyframes canvasIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
