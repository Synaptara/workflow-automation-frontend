import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../api/axios";

export default function IntegrationCallback() {
  const { provider } = useParams(); // 'github', 'google_sheets', or 'discord'
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasProcessed = useRef(false);
  const [status, setStatus] = useState("Authenticating...");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const savedState = sessionStorage.getItem("integration_oauth_state");

    if (code && !hasProcessed.current) {
      hasProcessed.current = true;

      // CSRF Protection Check
      if (state !== savedState) {
        setStatus("Security check failed. Redirecting...");
        sessionStorage.removeItem("integration_oauth_state");
        setTimeout(() => navigate("/integrations", { replace: true }), 2000);
        return;
      }

      sessionStorage.removeItem("integration_oauth_state");
      setStatus(`Securing ${provider} credentials in Vault...`);

      // Send to Django backend to exchange for tokens and encrypt them
      api.post(`/credentials/oauth/${provider}/`, { code })
        .then(() => {
          setStatus("Success! Redirecting...");
          setTimeout(() => navigate("/integrations", { replace: true }), 1000);
        })
        .catch((err) => {
          console.error("Integration OAuth Failed:", err);
          setStatus("Authentication failed. Redirecting...");
          setTimeout(() => navigate("/integrations", { replace: true }), 2500);
        });
    } else if (!code) {
      navigate("/integrations", { replace: true });
    }
  }, [provider, searchParams, navigate]);

  return (
    <div className="min-h-screen w-full bg-[#060607] flex items-center justify-center font-sans text-white">
      <div className="flex flex-col items-center gap-5 animate-pulse">
        <div className="w-8 h-8 border-2 border-zinc-100 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-zinc-400 font-medium tracking-wide">
          {status}
        </p>
      </div>
    </div>
  );
}
