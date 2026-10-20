export default function Testimonial({
  quote = "We used to spend hours connecting tools and chasing repetitive tasks. Orkflo brings everything together, so our team can spend less time managing workflows and more time getting real work done.",
  name = "Alex Morgan",
  role = "Product Lead",
  image = "/user.png",
}) {
  return (
    <section className="relative px-6 py-20 md:py-32 border-t border-[#1f1f24] bg-canvas">
      <div className="max-w-5xl mx-auto relative group">
        {/* Glass Card */}
        <div className="relative w-full rounded-[24px] md:rounded-[32px] border border-white/5 bg-[#08090d]/60 backdrop-blur-xl shadow-2xl overflow-hidden px-6 py-16 md:px-16 md:py-24">
          {/* Ambient Glow */}
          <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <div className="absolute top-0 left-[-10%] w-[50%] h-full bg-[#ff5a00] mix-blend-screen blur-[100px] md:blur-[140px] opacity-20" />
            <div className="absolute bottom-0 right-[-10%] w-[50%] h-full bg-[#7b2cbf] mix-blend-screen blur-[100px] md:blur-[140px] opacity-20" />
          </div>

          {/* Side Accents */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-1/2 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-1/2 bg-gradient-to-b from-transparent via-white/10 to-transparent" />

          {/* Testimonial Content */}
          <div className="relative z-10 flex flex-col items-center text-center">
            <p className="font-display text-2xl md:text-3xl lg:text-4xl leading-[1.4] tracking-tight text-white max-w-3xl">
              “{quote}”
            </p>

            {/* User Information */}
            <div className="mt-10 md:mt-12 flex items-center justify-center gap-4">
              <div className="relative w-11 h-11 rounded-full bg-[#18181b] border border-[#27272a] shadow-md overflow-hidden shrink-0">
                <img
                  src={image}
                  alt={name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white/60">
                  {name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)}
                </span>
              </div>

              <div className="flex flex-col items-start text-left">
                <span className="text-[15px] font-semibold text-white tracking-tight leading-tight">
                  {name}
                </span>
                <span className="text-[13px] text-[#a1a1aa] mt-1">{role}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
