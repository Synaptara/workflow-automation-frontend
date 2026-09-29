import Mockup from "../../assets/dashboard-mockup.png"

export default function Hero() {
  return (
    <section className="relative overflow-hidden w-full">
      {/* Background Gradient */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ background: "var(--l-gradient)" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-12 md:pt-32 md:pb-24">

        {/* Top Text Section */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-2 md:gap-8">

          {/* Left Title */}
          <h1 className="text-4xl sm:text-5xl md:text-[60px] font-display font-normal tracking-tight leading-[1.05] shrink-0" style={{ color: "var(--l-text)" }}>
            When something <br className="hidden md:block" /> happens,
            <i className="font-extralight">Orkflo</i> handles <br className="hidden md:block" /> what's{" "}
            <i className="italic pr-2">next.</i>
          </h1>

          {/* Right Column: Paragraph + Buttons */}
          <div className="flex flex-col items-start md:items-end md:text-right mt-2 md:mt-3">
            <p className="text-base md:text-lg leading-relaxed max-w-[420px] mb-4" style={{ color: "var(--l-text-muted)" }}>
              Watch a webhook, check a condition, and let <br/>Orkflo notify <i className="font-serif text-white">Slack</i>,
              send an <i className="font-serif text-white">email</i>, or call any  <i className="font-serif text-white">API automatically</i>, every time it happens.
            </p>

            {/* Call to Action Buttons Aligned Right */}
            <div className="flex flex-wrap items-center justify-start md:justify-end gap-4">
              <a
                href="/register"
                className="text-sm font-bold px-7 py-3.5 rounded-full hover:opacity-90 transition-opacity"
                style={{ backgroundColor: "var(--l-btn-primary-bg)", color: "var(--l-btn-primary-text)" }}
              >
                Sign up
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-medium px-7 py-3.5 rounded-full border hover:bg-white/5 transition-colors"
                style={{ borderColor: "var(--l-border)", color: "var(--l-text)" }}
              >
                See how it works
              </a>
            </div>
          </div>

        </div>

        {/* Dashboard Mockup with Glass Glow */}
        <div className="relative mt-20 md:mt-16 w-full flex justify-end">

          {/* Multi-color Glowing Aura Background */}
          <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible flex justify-center items-center">
            <div className="absolute w-[40%] h-[80%] bg-[#ff5a00] rounded-full mix-blend-screen filter blur-[100px] md:blur-[150px] opacity-30 translate-x-[-20%]"></div>
            <div className="absolute w-[40%] h-[80%] bg-[#7b2cbf] rounded-full mix-blend-screen filter blur-[100px] md:blur-[150px] opacity-40 translate-x-[20%]"></div>
            <div className="absolute w-[30%] h-[60%] bg-[#00b4d8] rounded-full mix-blend-screen filter blur-[100px] md:blur-[140px] opacity-20 translate-y-[20%]"></div>
          </div>

          {/* Glass Container - Fitted perfectly with backdrop blur and bottom fade */}
          <div
            className="relative z-10 w-full md:w-[105%] scale-[1.1] rounded-[20px] md:rounded-[28px] border border-white/10 bg-[#08090d]/40 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] p-3 md:p-5 flex items-center justify-center"
            style={{
              WebkitMaskImage: "linear-gradient(to bottom, black 65%, transparent 100%)",
              maskImage: "linear-gradient(to bottom, black 65%, transparent 100%)"
            }}
          >

            {/* Simple Text Placeholder */}
            <span className="absolute z-0 text-[#71717a] font-medium text-sm md:text-base tracking-wide">
              Dashboard Preview Image
            </span>

            {/* Actual Mockup Image - No zoom, fits field */}
            <img
              src={Mockup}
              alt="Orkflo Dashboard Preview"
              className="relative z-10 w-full h-auto rounded-[12px] md:rounded-[18px] object-contain border border-white/5 shadow-2xl"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>

      </div>
    </section>
  );
}
