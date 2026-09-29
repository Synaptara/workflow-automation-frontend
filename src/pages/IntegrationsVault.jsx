import { useState } from "react";
import IntegrationPng from "../assets/integrations.jpg";

const Icons = {
  discord: (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="#5865F2" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613 1.451.73 1.438 1.613c0 .888-.631 1.612-1.438 1.612"/>
    </svg>
  ),
  google_sheets: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F9D58" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
    </svg>
  ),
  groq_ai: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
    </svg>
  ),
  slack: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#E01E5A" strokeWidth="1.5"><rect x="13" y="2" width="4" height="8" rx="2"/><rect x="7" y="14" width="4" height="8" rx="2"/><rect x="2" y="7" width="8" height="4" rx="2"/><rect x="14" y="13" width="8" height="4" rx="2"/></svg>
  ),
  github: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.03c3.18-.3 6.5-1.5 6.5-7.07a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 5.58 3.3 6.78 6.5 7.08a4.8 4.8 0 0 0-1 3.03V22"/><path d="M9 20c-5 1.5-5-2.5-7-3"/></svg>
  )
};

const AVAILABLE_INTEGRATIONS = [
  { id: "groq_ai", name: "Groq AI", description: "Lightning fast open-source language models.", authType: "api_key", icon: Icons.groq_ai },
  { id: "discord", name: "Discord", description: "Send automated messages to your Discord servers.", authType: "webhook", icon: Icons.discord },
  { id: "github", name: "GitHub", description: "Link pull requests and automate workflows.", authType: "oauth", icon: Icons.github },
  { id: "google_sheets", name: "Google Sheets", description: "Read and write data to your spreadsheets.", authType: "oauth", icon: Icons.google_sheets },
  { id: "slack", name: "Slack", description: "Post updates directly to your Slack channels.", authType: "oauth", icon: Icons.slack },
];

export default function IntegrationsVault() {
  const [connections, setConnections] = useState({
    groq_ai: true,
    discord: false,
    github: false,
    google_sheets: false,
    slack: false,
  });

  const [activeModal, setActiveModal] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setConnections(prev => ({ ...prev, [activeModal.id]: true }));
      setSaving(false);
      setActiveModal(null);
      setInputValue("");
    }, 800);
  };

  const handleDisconnect = (id) => {
    if(window.confirm("Disconnect this service? Active workflows may fail.")) {
      setConnections(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
      <div className="h-full overflow-y-auto px-4 sm:px-10 py-6 sm:py-7 space-y-6 sm:space-y-7 custom-scrollbar bg-canvas">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">

        {/* Top Banner: Fixed short height across all screens */}
        {/* <div className="w-full h-32 shrink-0">
          <div className="w-full h-full rounded-2xl overflow-hidden border border-[#222222] shadow-sm">
            <img
              src={IntegrationPng}
              alt="Integrations Graphic"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </div>*/}

        {/* Section Title */}
        <div className="pt-2">
          <h1 className="text-3xl lg:text-4xl font-serif font-normal text-white tracking-tight">
            Available Integrations
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 font-normal">Manage and connect all your integrations in one place.</p>

        </div>

        {/* Toolbar: Tabs and Search Filter */}
        <div className="flex items-center justify-between border-b border-[#222222] pb-3.5 pt-2">
          <div className="flex items-center gap-6">
            <div className="relative flex items-center gap-2 pb-3.5 pt-1">
              <span className="text-sm font-medium text-white tracking-tight">Integrations</span>
              <span className="px-2 py-0.5 text-[11px] font-mono font-medium rounded-full bg-[#18181b] border border-[#27272a] text-[#a1a1aa]">5</span>
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-full"></span>
            </div>
          </div>
          <div className="relative w-full sm:w-80 mt-3 sm:mt-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#71717a]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-2.85z" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            </div>
            <input
              className="w-full pl-9 pr-14 py-2 text-xs bg-[#111111] hover:bg-[#141414] border border-[#222222] hover:border-[#333333] focus:border-[#52525b] rounded-xl text-white placeholder-[#71717a] focus:outline-none transition-colors font-sans"
              placeholder="Search integrations..."
              type="text"
            />
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">

            </div>
          </div>
        </div>

        {/* Integrations List */}
        <div className="space-y-2 pb-12">
          {AVAILABLE_INTEGRATIONS.map((app) => {
            const isConnected = connections[app.id];

            return (
              <div key={app.id} className="integration-card flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#111111] border border-[#222222] group gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-lg bg-[#181818] border border-[#272727] flex items-center justify-center flex-shrink-0">
                    {app.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-sm font-semibold text-white tracking-tight">{app.name}</h3>
                    </div>
                    <p className="text-xs text-[#a1a1aa] font-normal mt-0.5 leading-relaxed">
                      {app.description}
                    </p>
                  </div>
                </div>

                {/* Mobile Responsive Footer inside the card */}
                <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto mt-2 sm:mt-0 border-t border-[#222222] sm:border-0 pt-3 sm:pt-0">
                  <button className="group/link inline-flex items-center gap-1 text-xs text-[#a1a1aa] hover:text-white font-medium transition-colors">
                    <span>Learn more</span>
                      <svg className="w-3 h-3 text-[#71717a] group-hover/link:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                  </button>
                  {isConnected ? (
                    <button
                      onClick={() => handleDisconnect(app.id)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141d17] border border-[#1b3a27] hover:bg-[#1a261e] transition-colors text-[#34d399] text-xs font-medium"
                    >
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#10b981]"></span>
                      </span>
                      <span>Connected</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveModal(app)}
                      className="px-4 py-1.5 rounded-lg bg-white hover:bg-[#e4e4e7] text-[#09090b] text-xs font-semibold transition-colors text-center"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Connection Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-6">

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#181818] border border-[#272727] flex items-center justify-center">
                  {activeModal.icon}
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">Connect {activeModal.name}</h3>
              </div>
              <button onClick={() => {setActiveModal(null); setInputValue("");}} className="text-[#a1a1aa] hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {activeModal.authType === "oauth" ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-[#a1a1aa] leading-relaxed">You will be redirected to securely authenticate with your account.</p>
                <button
                  onClick={handleSave}
                  className="w-full bg-white hover:bg-[#e4e4e7] text-[#09090b] text-sm font-bold py-3 rounded-lg transition-colors shadow-sm"
                >
                  {saving ? "Authenticating..." : `Sign in with ${activeModal.name}`}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-white uppercase tracking-wider">
                    {activeModal.authType === "api_key" ? "API Key" : "Global Webhook URL"}
                  </label>
                  <input
                    type="password"
                    autoFocus
                    placeholder={`Paste your ${activeModal.name} credential here...`}
                    className="w-full bg-[#09090b] border border-[#222222] focus:border-[#52525b] rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors shadow-inner"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                  <p className="text-[11px] text-[#71717a] mt-1">This credential is encrypted at rest and never shared.</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={!inputValue.trim() || saving}
                  className="w-full bg-white hover:bg-[#e4e4e7] text-[#09090b] text-sm font-bold py-3 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving ? "Encrypting & Saving..." : "Save Credential"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
