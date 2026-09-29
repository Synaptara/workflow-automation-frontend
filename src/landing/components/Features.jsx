const FEATURES = [
  {
    title: "Branching logic",
    body: "Route to different actions depending on what the incoming data actually says — not just one fixed path.",
  },
  {
    title: "Live run status",
    body: "Watch each step light up as it runs, over a real-time connection, instead of refreshing a log.",
  },
  {
    title: "Full run history",
    body: "Every run is recorded — status, timing, and exactly what each step received and returned, errors included.",
  },
  {
    title: "Built to extend",
    body: "Every integration is a small, isolated module. Adding a new one never means touching the execution engine.",
  },
];

export default function Features() {
  return (
    <section id="features" className="max-w-6xl mx-auto px-6 py-20 md:py-28 border-t" style={{ borderColor: "var(--l-border)" }}>
      <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-14 max-w-xl">
        What you get once it's wired up
      </h2>

      <div className="grid sm:grid-cols-2 gap-x-10 gap-y-12">
        {FEATURES.map((f) => (
          <div key={f.title}>
            <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--l-text-muted)" }}>
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
