const STEPS = [
  {
    n: "01",
    title: "Get a webhook URL",
    body: "Create a workflow and Flowly gives you a unique URL. Point any service that can send a POST request at it.",
  },
  {
    n: "02",
    title: "Add a condition",
    body: "Check a field from the incoming data — a budget, a status, anything — before deciding what happens next.",
  },
  {
    n: "03",
    title: "Choose what happens next",
    body: "Branch into Slack, email, an API call, or any of the built-in integrations, based on what the condition found.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20 md:py-28 border-t" style={{ borderColor: "var(--l-border)" }}>
      <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-14 max-w-xl">
        Three steps from a raw request to a finished action
      </h2>

      <div className="grid md:grid-cols-3 gap-10 md:gap-8">
        {STEPS.map((step) => (
          <div key={step.n}>
            <span className="text-sm" style={{ color: "var(--l-text-muted)" }}>{step.n}</span>
            <h3 className="text-lg font-semibold mt-3 mb-2">{step.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--l-text-muted)" }}>
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
