// Pass real values once you have an actual quote — these props exist so you're
// not editing JSX to swap it out. Deliberately not shipping a made-up name/quote
// as if it were a real customer.
export default function Testimonial({
  quote = "Add a real quote from an early user here.",
  name = "Your name",
  role = "Role, Company",
}) {
  return (
    <section className="border-t" style={{ borderColor: "var(--l-border)" }}>
      <div className="max-w-3xl mx-auto px-6 py-20 md:py-28 text-center">
        <p className="font-display text-2xl md:text-3xl leading-snug">
          "{quote}"
        </p>
        <p className="mt-8 text-sm font-semibold">{name}</p>
        <p className="text-sm" style={{ color: "var(--l-text-muted)" }}>{role}</p>
      </div>
    </section>
  );
}
