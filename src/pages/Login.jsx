import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import OrkfloLogo from "../assets/orkflo.jpeg";
import Bg from "../assets/loginbg.jpg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  // Redirect to webhooks if already logged in
  useEffect(() => {
    if (localStorage.getItem("token") || localStorage.getItem("access") || localStorage.getItem("auth_token")) {
      navigate("/webhooks", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/webhooks");
    } catch {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#060607] flex p-3 md:p-4 font-sans text-white page-enter">

      <style>{`
        .page-enter {
          animation: blurFadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes blurFadeIn {
          0% { opacity: 0; filter: blur(12px); transform: scale(0.98); }
          100% { opacity: 1; filter: blur(0); transform: scale(1); }
        }
      `}</style>

      {/* Left Panel: True Color Image Background */}
      <div className="hidden lg:flex w-1/2 relative rounded-[24px] overflow-hidden bg-[#09090b] border border-white/5 flex-col items-center justify-center p-10 shadow-2xl">

        {/* Image Background & Bottom Fade Gradient */}
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-[#121214]">
          <span className="absolute z-0 text-[#71717a] text-sm font-medium tracking-wide">
            Background Image Placeholder
          </span>

          <img
            src={Bg}
            alt="Login Background"
            className="absolute inset-0 z-10 w-full h-full object-cover"
            onError={(e) => e.target.style.display = 'none'}
          />

          <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#060607] via-[#060607]/60 to-transparent"></div>
        </div>

        {/* Left Panel Foreground Content */}
        <div className="relative z-30 flex flex-col items-center text-center max-w-sm mt-auto pb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shadow-sm flex items-center justify-center bg-black">
              <img src={OrkfloLogo} alt="Orkflo Logo" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
            </div>
            <span className="text-xl font-semibold tracking-tight text-white drop-shadow-md">
              Orkflo
            </span>
          </div>

          <h1 className="text-3xl font-display font-medium tracking-tight mb-3 leading-tight drop-shadow-md font-serif">
            Welcome back
          </h1>
          <p className="text-zinc-200 text-[14px] leading-relaxed mb-8 drop-shadow">
            Log in to continue building, automating, and <br/> monitoring your enterprise workflows.
          </p>

          <div className="w-full flex flex-col gap-2.5">
            <div className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-center gap-3 shadow-lg">
              <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-[11px] font-bold">1</div>
              <span className="text-[13px] font-medium text-white">Access your workflows</span>
            </div>
            <div className="w-full bg-black/40 backdrop-blur-md border border-white/5 rounded-xl p-3 flex items-center gap-3 shadow-lg">
              <div className="w-5 h-5 rounded-full bg-white/10 text-zinc-300 flex items-center justify-center text-[11px] font-bold">2</div>
              <span className="text-[13px] font-medium text-zinc-300">Monitor live executions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Compact Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-[340px]">

          {/* Back Button */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#71717a] hover:text-white transition-colors mb-6 group"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-0.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to home
          </Link>

          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-xl font-semibold tracking-tight mb-1.5 text-white">Log in to <span className="font-serif italic">Orkflo</span></h2>
            <p className="text-[13px] text-[#71717a]">Enter your credentials to access your account.</p>
          </div>

          {/* Social Logins - Compact */}
          <div className="flex gap-3 mb-6">
            <button className="flex-1 flex items-center justify-center gap-2 bg-[#09090b] border border-[#27272a] hover:border-[#404040] rounded-lg py-2 text-[13px] font-medium transition-colors text-[#e4e4e7]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-[#09090b] border border-[#27272a] hover:border-[#404040] rounded-lg py-2 text-[13px] font-medium transition-colors text-[#e4e4e7]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.699-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.022A9.606 9.606 0 0112 6.82c.85.004 1.705.114 2.504.336 1.909-1.29 2.747-1.022 2.747-1.022.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Github
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#27272a]"></div>
            <span className="text-[10px] text-[#71717a] font-semibold uppercase tracking-widest">Or</span>
            <div className="flex-1 h-px bg-[#27272a]"></div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-2.5 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#a1a1aa]">Username</label>
              <input
                type="text"
                required
                className="bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-[#52525b] outline-none focus:border-[#52525b] transition-colors"
                placeholder="johndoe"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#a1a1aa]">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2.5 text-[13px] text-white placeholder-[#52525b] outline-none focus:border-[#52525b] transition-colors"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-white text-black font-semibold rounded-lg py-2.5 mt-2 transition-opacity hover:opacity-90 text-[13px]"
            >
              Sign In
            </button>
          </form>

          <p className="text-[#71717a] text-[12px] text-center mt-6">
            Don't have an account? <Link to="/register" className="text-white font-medium hover:underline">Sign up</Link>
          </p>

        </div>
      </div>
    </div>
  );
}
