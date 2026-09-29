export default function Testimonial({
  quote = "Every hour spent chasing bugs is time away from building features that users actually want. Orkflo gives your team time to focus on what actually matters.",
  name = "Dylan Babbs",
  role = "CTO of Profound",
  image = "/user.png" // Rename your file to user.png and place it in public/
}) {
  return (
    <section className="relative px-6 py-20 md:py-32 border-t border-[#1f1f24] bg-canvas">
      <div className="max-w-5xl mx-auto relative group">

        {/* The Contained Glass Card */}
        <div className="relative w-full rounded-[24px] md:rounded-[32px] border border-white/5 bg-[#08090d]/60 backdrop-blur-xl shadow-2xl overflow-hidden px-6 py-16 md:px-16 md:py-24">

          {/* Contained Multi-color Glowing Aura Background */}
          <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <div className="absolute top-0 left-[-10%] w-[50%] h-[100%] bg-[#ff5a00] mix-blend-screen filter blur-[100px] md:blur-[140px] opacity-20"></div>
            <div className="absolute bottom-0 right-[-10%] w-[50%] h-[100%] bg-[#7b2cbf] mix-blend-screen filter blur-[100px] md:blur-[140px] opacity-20"></div>
          </div>

          {/* Faint side border accents (Mimicking the reference's angled lines subtly) */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[1px] h-1/2 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[1px] h-1/2 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center">

            <p className="font-display text-2xl md:text-3xl lg:text-4xl leading-[1.4] tracking-tight text-white max-w-3xl">
              "{quote}"
            </p>

            {/* User Info Block */}
            <div className="mt-10 md:mt-12 flex items-center justify-center gap-4">

              {/* Avatar Container */}
              <div className="relative w-11 h-11 rounded-full bg-[#18181b] border border-[#27272a] shadow-md overflow-hidden shrink-0">
                <span className="absolute inset-0 flex items-center justify-center text-[10px] text-[#71717a] font-medium z-0">
                  Img
                </span>
                <img
                  src={image}
                  alt={name}
                  className="relative z-10 w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>

              {/* Text Info */}
              <div className="flex flex-col items-start text-left">
                <span className="text-[15px] font-semibold text-white tracking-tight leading-tight">
                  {name}
                </span>
                <span className="text-[13px] text-[#71717a] mt-0.5">
                  {role}
                </span>
              </div>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
