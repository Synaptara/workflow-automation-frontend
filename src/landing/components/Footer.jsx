import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import OrkfloLogo from "../../assets/orkflo.jpeg";

export default function Footer() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("access") || localStorage.getItem("auth_token");
    setIsLoggedIn(!!token);
  }, []);

  return (
    <footer className="border-t border-[#1f1f24] bg-canvas">
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">

        {/* Logo & Copyright */}
        <div className="flex flex-col gap-4">
          <Link to="/" className="flex items-center gap-3 group w-fit">
            <div className="w-7 h-7 rounded-md overflow-hidden border border-[#27272a] shadow-sm group-hover:border-[#404040] transition-colors flex items-center justify-center bg-[#09090b]">
              <img
                src={OrkfloLogo}
                alt="Orkflo Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-[16px] font-semibold tracking-tight text-white">
              Orkflo
            </span>
          </Link>
          <p className="text-[13px] text-[#71717a]">
            © {new Date().getFullYear()} Orkflo Inc. All rights reserved.
          </p>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-wrap items-center gap-6 text-[13px] font-medium text-[#71717a]">
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#integrations" className="hover:text-white transition-colors">Integrations</a>
          <a href="#features" className="hover:text-white transition-colors">Architecture</a>
          {!isLoggedIn && (
            <Link to="/login" className="hover:text-white transition-colors ml-2">Log in</Link>
          )}
        </div>

      </div>
    </footer>
  );
}
