const FEATURES = [
  {
    title: "Branching logic",
    subtitle: "Dynamic routing",
    body: "Route to different actions depending on what the incoming data actually says — not just one fixed path.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3v18M18 9V3M18 21v-6M12 15V9" />
      </svg>
    )
  },
  {
    title: "Live run status",
    subtitle: "Real-time WebSocket",
    body: "Watch each step light up as it runs, over a real-time connection, instead of refreshing a log.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
    )
  },
  {
    title: "Full run history",
    subtitle: "AES-256 Encrypted",
    body: "Every run is recorded — status, timing, and exactly what each step received and returned, errors included.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </svg>
    )
  },
  {
    title: "Built to extend",
    subtitle: "Plugin Architecture",
    body: "Every integration is a small, isolated module. Adding a new one never means touching the execution engine.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    )
  },
];

export default function Features() {
  return (
    <section id="features" className="max-w-6xl mx-auto px-6 py-6 md:py-20">

      {/* Top Label & Divider */}
      <div className="mb-8">
        <p className="text-[13px] font-medium text-[#71717a] mb-4">Architecture</p>
        <div className="w-full h-px bg-[#1f1f24]"></div>
      </div>

      {/* Large Two-Toned Intro Paragraph */}
      <div className="mb-24 max-w-[60rem]">
        <h2 className="text-xl md:text-2xl leading-[1.4] text-[#71717a]">
          <span className="text-white font-medium "><i>We have always over-engineered</i> <span className="font-serif">Orkflo</span>. </span>
          <i>We believe that building things the right way is the best way to build durable products.
          Every run is recorded, every step lights up in real-time, and you have complete control over
          branching logic without ever touching the core execution engine.</i>
        </h2>
      </div>

      {/* 4-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex flex-col group">

            {/* Dark Icon Box */}
            <div className="w-14 h-14 rounded-2xl bg-[#09090b] border border-[#1f1f24] flex items-center justify-center mb-6 shadow-sm group-hover:border-[#404040] transition-colors">
              {f.icon}
            </div>

            {/* Title & Subtitle */}
            <h3 className="text-[17px] font-serif font-semibold text-white mb-0.5 tracking-tight">{f.title}</h3>
            <p className="text-[13px] text-[#71717a] font-medium mb-3">{f.subtitle}</p>

            {/* Body */}
            <p className="text-[13px] leading-relaxed text-[#71717a] mb-4 flex-1">
              {f.body}
            </p>



          </div>
        ))}
      </div>

    </section>
  );
}
