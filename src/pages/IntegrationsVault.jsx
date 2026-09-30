import { useState, useEffect } from "react";
import { getCredentials, saveCredential } from "../api/workflows";

// --- ICON IMPORTS ---
import {
  DiscordIcon,
  RobotIcon,
  SlackIcon,
  GithubIcon,
  FileSheetIcon
} from "../components/icons";
import { Search, ChevronRight, X, Link2, Key, ShieldCheck } from "lucide-react";

// 1. Define OAuth configurations and scopes for our specific apps
const OAUTH_CONFIG = {
  github: {
    clientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
    authUrl: "https://github.com/login/oauth/authorize",
    scope: "repo user",
  },
  google_sheets: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scope: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly email profile",
  },
  discord: {
    clientId: import.meta.env.VITE_DISCORD_CLIENT_ID, // You will need to add this to .env later
    authUrl: "https://discord.com/api/oauth2/authorize",
    scope: "identify bot applications.commands",
  },

};

const AVAILABLE_INTEGRATIONS = [
  {
    id: "groq_ai",
    name: "Groq AI",
    description: "Lightning fast open-source language models.",
    authType: "api_key",
    configKey: "api_key",
    icon: <RobotIcon className="w-5 h-5 text-orange-500" />
  },
  {
    id: "discord",
    name: "Discord",
    description: "Connect your account and invite the Orkflo bot to your servers.",
    authType: "oauth", // Upgraded to OAuth
    icon: <DiscordIcon className="w-5 h-5" />
  },
  {
    id: "github",
    name: "GitHub",
    description: "Link pull requests and automate repository workflows.",
    authType: "oauth",
    icon: <GithubIcon className="w-5 h-5 text-white" />
  },
  {
    id: "google_sheets",
    name: "Google Sheets",
    description: "Read and write data directly to your spreadsheets.",
    authType: "oauth",
    icon: <FileSheetIcon className="w-5 h-5" />
  },
  {
    id: "slack",
    name: "Slack",
    description: "Post updates directly to your Slack channels via Webhook.",
    authType: "webhook",
    configKey: "webhook_url",
    icon: <SlackIcon className="w-5 h-5" />
  },
  {
      id: "notion",
      name: "Notion",
      description: "Connect to your workspace and automate database items.",
      authType: "api_key",
      configKey: "api_key",
      icon: (
        <div className="w-5 h-5 bg-zinc-100 text-black font-serif font-bold flex items-center justify-center rounded-[4px] text-xs">
          N
        </div>
      )
    },
];

export default function IntegrationsVault() {
  const [connections, setConnections] = useState({});
  const [activeModal, setActiveModal] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch saved credentials on load
  useEffect(() => {
    getCredentials()
      .then((savedServices) => {
        const stateMap = {};
        savedServices.forEach((service) => {
          stateMap[service] = true;
        });
        setConnections(stateMap);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveAPIKey = async () => {
    setSaving(true);
    try {
      await saveCredential(activeModal.id, { [activeModal.configKey]: inputValue });
      setConnections(prev => ({ ...prev, [activeModal.id]: true }));
      setActiveModal(null);
      setInputValue("");
    } catch (err) {
      alert("Failed to save credential securely.");
    } finally {
      setSaving(false);
    }
  };

  const handleOAuthRedirect = (providerId) => {
    const config = OAUTH_CONFIG[providerId];
    if (!config || !config.clientId) {
      alert(`Client ID for ${providerId} is missing in your environment variables.`);
      return;
    }

    // We use a different callback route so we don't accidentally log the user out
    // when they are just trying to connect an integration.
    const redirectUri = encodeURIComponent(`${window.location.origin}/integrations/callback/${providerId}`);
    const state = crypto.randomUUID();
    sessionStorage.setItem("integration_oauth_state", state);

    let url = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}&scope=${encodeURIComponent(config.scope)}`;

    // Google requires extra params to return a refresh token for background tasks
    if (providerId === "google_sheets") {
      url += "&access_type=offline&prompt=consent";
    }

    window.location.href = url;
  };

  const handleDisconnect = async (id) => {
    if(window.confirm("Disconnect this service? Active workflows may fail.")) {
      try {
        setConnections(prev => ({ ...prev, [id]: false }));
      } catch (err) {
        alert("Could not disconnect service.");
      }
    }
  };

  if (loading) return <div className="p-10 text-center text-zinc-500 font-medium animate-pulse">Loading secure vault...</div>;

  return (
    <div className="h-full overflow-y-auto px-4 sm:px-10 py-6 sm:py-8 space-y-6 sm:space-y-8 custom-scrollbar bg-[#060607]">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">

        {/* Section Header */}
        <div className="pt-2">
          <h1 className="text-3xl font-serif text-zinc-100 tracking-tight">
            Available Integrations
          </h1>
          <p className="text-sm text-zinc-400 mt-2 font-medium">Manage and connect all your third-party applications in one secure place.</p>
        </div>

        {/* Toolbar: Tabs and Search Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-800/80 pb-4 gap-4">
          <div className="flex items-center gap-6">
            <div className="relative flex items-center gap-2 pb-4 pt-1">
              <span className="text-sm font-semibold text-zinc-100">Integrations</span>
              <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-md bg-zinc-800/80 border border-zinc-700/50 text-zinc-300">
                {AVAILABLE_INTEGRATIONS.length}
              </span>
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-zinc-100 rounded-t-md"></span>
            </div>
          </div>
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              className="w-full pl-9 pr-4 py-2 text-sm bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 rounded-lg text-zinc-100 placeholder-zinc-500 outline-none transition-all shadow-sm"
              placeholder="Search integrations..."
              type="text"
            />
          </div>
        </div>

        {/* Integrations List (Shadcn Style Cards) */}
        <div className="grid gap-3 pb-12">
          {AVAILABLE_INTEGRATIONS.map((app) => {
            const isConnected = connections[app.id];

            return (
              <div key={app.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#09090b] border border-zinc-800/80 hover:border-zinc-700/80 transition-all shadow-sm gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:bg-zinc-800/50 transition-colors">
                    {app.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">{app.name}</h3>
                    <p className="text-[13px] text-zinc-400 font-medium mt-0.5">
                      {app.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-zinc-800/50 sm:border-0">
                  {isConnected ? (
                    <>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold select-none">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Connected
                      </div>
                      <button
                        onClick={() => setActiveModal(app)}
                        className="px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-zinc-100 text-xs font-semibold transition-colors shadow-sm"
                      >
                        Configure
                      </button>
                      <button
                        onClick={() => handleDisconnect(app.id)}
                        className="px-3 py-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold transition-colors"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="hidden sm:inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 font-medium transition-colors mr-2 group/link">
                        Learn more
                        <ChevronRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                      </button>
                      <button
                        onClick={() => setActiveModal(app)}
                        className="px-4 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-bold transition-all shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                      >
                        Connect
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Connection Modal (Shadcn Dialog Style) */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#09090b] border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-6 animate-in zoom-in-95 duration-200">

            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner">
                  {activeModal.icon}
                </div>
                <div>
                  <h3 className="text-lg font-normal text-zinc-100 tracking-tight">
                    {connections[activeModal.id] ? "Manage" : "Connect"} {activeModal.name}
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium">{activeModal.authType === 'oauth' ? 'OAuth 2.0 Authorization' : 'Secure Credential Storage'}</p>
                </div>
              </div>
              <button onClick={() => {setActiveModal(null); setInputValue("");}} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-md hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeModal.authType === "oauth" ? (
              <div className="flex flex-col gap-5">
                <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-4 text-sm text-zinc-300 leading-relaxed font-medium">
                  You will be securely redirected to {activeModal.name} to grant Orkflo permission to access your account.
                </div>
                <button
                  onClick={() => handleOAuthRedirect(activeModal.id)}
                  className="w-full bg-zinc-100 hover:bg-white text-zinc-900 text-sm font-bold py-2.5 rounded-md transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  Authenticate with {activeModal.name}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2.5">
                  <label className="text-xs font-bold text-zinc-300 tracking-wide flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-zinc-500" />
                    {activeModal.authType === "api_key" ? "API Key" : "Webhook URL"}
                  </label>
                  <input
                    type="password"
                    autoFocus
                    placeholder={connections[activeModal.id] ? "Paste a new credential to overwrite..." : `Paste your ${activeModal.name} credential here...`}
                    className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 rounded-md px-3 py-2.5 text-sm text-zinc-100 outline-none transition-all shadow-inner placeholder:text-zinc-600 font-mono"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <p className="text-[11px] text-zinc-500 font-medium flex items-center gap-1 mt-1">
                    <ShieldCheck className="w-3 h-3" />
                    Encrypted at rest using AES-256. Never shared.
                  </p>
                </div>
                <button
                  onClick={handleSaveAPIKey}
                  disabled={!inputValue.trim() || saving}
                  className="w-full bg-zinc-100 hover:bg-white text-zinc-900 text-sm font-bold py-2.5 rounded-md transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin"></div>
                      Encrypting...
                    </>
                  ) : "Save Credential"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
