import { useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback() {
  const { provider } = useParams(); // 'github' or 'google'
  const [searchParams] = useSearchParams();
  const { oauthLogin } = useAuth();
  const navigate = useNavigate();
  const hasProcessed = useRef(false); // Prevents double-firing in React StrictMode

  useEffect(() => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const savedState = sessionStorage.getItem("oauth_state");

      if (code && !hasProcessed.current) {
        hasProcessed.current = true;

        // CSRF Protection Check
        if (state !== savedState) {
          console.error("OAuth state mismatch. Possible CSRF attack.");
          sessionStorage.removeItem("oauth_state");
          navigate("/login", { replace: true });
          return;
        }

        sessionStorage.removeItem("oauth_state");

        // Send the code to your backend via AuthContext
        oauthLogin(provider, code)
          .then(() => {
            navigate("/webhooks", { replace: true });
          })
          .catch((err) => {
            console.error("OAuth Login Failed:", err);
            navigate("/login", { replace: true });
          });
      } else if (!code) {
        navigate("/login", { replace: true });
      }
    }, [provider, searchParams, oauthLogin, navigate]);

  return (
    <div className="min-h-screen w-full bg-[#060607] flex items-center justify-center font-sans text-white">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-[#a1a1aa] font-medium tracking-wide">
          Authenticating with {provider}...
        </p>
      </div>
    </div>
  );
}
