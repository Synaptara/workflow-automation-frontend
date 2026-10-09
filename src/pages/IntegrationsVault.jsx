import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getCredentials, saveCredential, listWorkflows } from "../api/workflows";
import { DiscordIcon, RobotIcon, SlackIcon, GithubIcon, FileSheetIcon } from "../components/icons";
import { Search, X, Link2, Key, ShieldCheck, Check, AlertTriangle, ArrowUpRight, Loader2, Plug, CircleCheck, CircleAlert } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

/* ---------- config ---------- */

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
    clientId: import.meta.env.VITE_DISCORD_CLIENT_ID,
    authUrl: "https://discord.com/api/oauth2/authorize",
    scope: "identify bot applications.commands",
  },
};

const AUTH_LABEL = { oauth: "OAuth", api_key: "API key", webhook: "Webhook URL" };

const AVAILABLE_INTEGRATIONS = [
  { id: "groq_ai", name: "Groq AI", category: "AI", description: "Fast open-source language models for summarising, extracting and classifying.", authType: "api_key", configKey: "api_key", icon: <RobotIcon className="w-5 h-5 text-orange-500" /> },
  { id: "discord", name: "Discord", category: "Messaging", description: "Connect your account and invite the Orkflo bot to your server.", authType: "oauth", icon: <DiscordIcon className="w-5 h-5 text-[#5865F2]" /> },
  { id: "github", name: "GitHub", category: "DevTools", description: "React to issues and automate repository workflows.", authType: "oauth", icon: <GithubIcon className="w-5 h-5 text-foreground" /> },
  { id: "google_sheets", name: "Google Sheets", category: "Database", description: "Read and write rows directly in your spreadsheets.", authType: "oauth", icon: <FileSheetIcon className="w-5 h-5 text-[#0F9D58]" /> },
  { id: "slack", name: "Slack", category: "Messaging", description: "Post updates to your Slack channels through a webhook.", authType: "webhook", configKey: "webhook_url", icon: <SlackIcon className="w-5 h-5" /> },
  { id: "notion", name: "Notion", category: "CMS", description: "Create and update database items in your workspace.", authType: "api_key", configKey: "api_key", icon: <div className="w-5 h-5 bg-foreground text-background font-serif font-bold flex items-center justify-center rounded-[4px] text-xs">N</div> },
];

const CATEGORIES = ["All", ...Array.from(new Set(AVAILABLE_INTEGRATIONS.map((a) => a.category)))];

/* ---------- small components ---------- */

function Stat({ label, value, hint }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-semibold tracking-tight text-foreground tabular-nums">{value}</span>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

function StatusPill({ connected }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-medium rounded-full px-2 py-0.5 border ${
        connected
          ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
          : "text-muted-foreground bg-transparent border-border"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-muted-foreground/50"}`} />
      {connected ? "Connected" : "Not connected"}
    </span>
  );
}

function IntegrationCard({ app, connected, usedIn, onOpen }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      className="group flex flex-col rounded-lg border border-border bg-card hover:border-foreground/30 transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="w-10 h-10 rounded-md border border-border bg-background flex items-center justify-center">
          {app.icon}
        </div>
        <StatusPill connected={connected} />
      </div>

      <div className="px-4 pb-4 flex flex-col gap-1 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-[14px] font-medium tracking-tight text-foreground">{app.name}</h3>
          <span className="text-[11px] text-muted-foreground">{app.category}</span>
        </div>
        <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2">{app.description}</p>
      </div>

      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border text-[12px] text-muted-foreground">
        <span className="font-mono text-[11px]">{AUTH_LABEL[app.authType]}</span>
        {connected ? (
          <span>
            {usedIn.length > 0 ? (
              <>Used in <span className="text-foreground tabular-nums">{usedIn.length}</span> {usedIn.length === 1 ? "workflow" : "workflows"}</>
            ) : (
              "Not used yet"
            )}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-foreground opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
            Connect <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-card h-[176px] p-4 animate-pulse flex flex-col gap-4">
      <div className="flex justify-between">
        <div className="w-10 h-10 rounded-md bg-accent" />
        <div className="h-5 w-24 rounded-full bg-accent" />
      </div>
      <div className="h-3 w-28 rounded bg-accent" />
      <div className="h-2.5 w-full rounded bg-accent" />
      <div className="h-2.5 w-2/3 rounded bg-accent" />
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const ok = toast.type === "success";
  return (
    <div className="fixed bottom-5 right-5 z-[60] animate-in slide-in-from-bottom-2 fade-in duration-200">
      <div className="flex items-center gap-2.5 rounded-md border border-border bg-background px-3.5 py-2.5 shadow-lg text-[13px] text-foreground">
        {ok ? <CircleCheck className="w-4 h-4 text-emerald-500" /> : <CircleAlert className="w-4 h-4 text-destructive" />}
        {toast.message}
      </div>
    </div>
  );
}

/* ---------- page ---------- */

export default function IntegrationsVault() {
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const [connections, setConnections] = useState({});
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [category, setCategory] = useState("All");

  const [activeId, setActiveId] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [toast, setToast] = useState(null);

  const activeApp = AVAILABLE_INTEGRATIONS.find((a) => a.id === activeId) || null;

  const notify = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadCredentials = useCallback(() => {
    return getCredentials().then((saved) => {
      const map = {};
      saved.forEach((s) => { map[s] = true; });
      setConnections((prev) => ({ ...map, ...Object.fromEntries(Object.entries(prev).filter(([k, v]) => v === false && !map[k])) }));
    });
  }, []);

  useEffect(() => {
    Promise.all([getCredentials(), listWorkflows().catch(() => [])])
      .then(([saved, wfs]) => {
        const map = {};
        saved.forEach((s) => { map[s] = true; });
        setConnections(map);
        setWorkflows(Array.isArray(wfs) ? wfs : []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Refresh when returning from an OAuth tab / redirect
  useEffect(() => {
    const onFocus = () => { loadCredentials().catch(() => {}); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadCredentials]);

  // "/" focuses search, Escape closes the modal
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const usage = useMemo(() => {
    const map = {};
    workflows.forEach((wf) => {
      const keys = new Set((wf.steps || []).map((s) => s.action_key).filter(Boolean));
      keys.forEach((k) => { (map[k] = map[k] || []).push({ id: wf.id, name: wf.name }); });
    });
    return map;
  }, [workflows]);

  const connectedCount = AVAILABLE_INTEGRATIONS.filter((a) => connections[a.id]).length;
  const workflowsUsing = new Set(
    AVAILABLE_INTEGRATIONS.filter((a) => connections[a.id]).flatMap((a) => (usage[a.id] || []).map((w) => w.id))
  ).size;

  const visible = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return AVAILABLE_INTEGRATIONS.filter((a) => {
      const connected = !!connections[a.id];
      if (tab === "connected" && !connected) return false;
      if (tab === "available" && connected) return false;
      if (category !== "All" && a.category !== category) return false;
      if (!q) return true;
      return a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
    });
  }, [connections, tab, category, searchQuery]);

  const TABS = [
    { key: "all", label: "All", n: AVAILABLE_INTEGRATIONS.length },
    { key: "connected", label: "Connected", n: connectedCount },
    { key: "available", label: "Available", n: AVAILABLE_INTEGRATIONS.length - connectedCount },
  ];

  function openModal(app) {
    setActiveId(app.id);
    setInputValue("");
    setConfirmDisconnect(false);
  }
  function closeModal() {
    setActiveId(null);
    setInputValue("");
    setConfirmDisconnect(false);
  }

  const handleSaveCredential = async () => {
    if (!activeApp) return;
    setSaving(true);
    try {
      await saveCredential(activeApp.id, { [activeApp.configKey]: inputValue.trim() });
      setConnections((prev) => ({ ...prev, [activeApp.id]: true }));
      notify(`${activeApp.name} credential saved`);
      closeModal();
    } catch {
      notify("Couldn't save the credential. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleOAuthRedirect = (providerId) => {
    const config = OAUTH_CONFIG[providerId];
    if (!config?.clientId) return;
    const redirectUri = encodeURIComponent(`${window.location.origin}/integrations/callback/${providerId}`);
    const state = crypto.randomUUID();
    sessionStorage.setItem("integration_oauth_state", state);
    let url = `${config.authUrl}?client_id=${config.clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}&scope=${encodeURIComponent(config.scope)}`;
    if (providerId === "google_sheets") url += "&access_type=offline&prompt=consent";
    window.location.href = url;
  };

  const handleDisconnect = () => {
    if (!activeApp) return;
    // UI-only for now: wire this to a delete-credential endpoint when available.
    setConnections((prev) => ({ ...prev, [activeApp.id]: false }));
    notify(`${activeApp.name} disconnected`);
    closeModal();
  };

  const activeConnected = activeApp ? !!connections[activeApp.id] : false;
  const activeUsage = activeApp ? usage[activeApp.id] || [] : [];
  const oauthMissing = activeApp?.authType === "oauth" && !OAUTH_CONFIG[activeApp.id]?.clientId;

  return (
    <div className="h-full overflow-y-auto px-4 py-6 sm:px-6 md:px-8 bg-background custom-scrollbar">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6 pb-20">

        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Integrations Vault</h1>
          <p className="text-[13px] text-muted-foreground max-w-[60ch]">
            Connect an app once. Your workflows use the stored connection, so keys never sit inside a workflow step.
          </p>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-3 rounded-lg border border-border bg-card divide-x divide-border">
          <Stat label="Connected" value={`${connectedCount}/${AVAILABLE_INTEGRATIONS.length}`} />
          <Stat label="Workflows using the vault" value={workflowsUsing} />
          <Stat
            label="Needs attention"
            value={AVAILABLE_INTEGRATIONS.filter((a) => !connections[a.id] && (usage[a.id] || []).length > 0).length}
            hint="used but not connected"
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative w-full sm:max-w-[360px] group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
              <Input
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search integrations"
                className="pl-9 h-9 bg-background border-border text-[13px]"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:block text-[10px] font-mono text-muted-foreground bg-accent border border-border rounded px-1.5">/</kbd>
            </div>

            <div className="inline-flex items-center rounded-md border border-border p-0.5 bg-background w-fit">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`h-7 px-2.5 rounded text-[12px] font-medium transition-colors flex items-center gap-1.5 ${
                    tab === t.key ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                  <span className="font-mono text-[10px] text-muted-foreground tabular-nums">{t.n}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`h-7 px-3 rounded-full border text-[12px] whitespace-nowrap transition-colors ${
                  category === c
                    ? "border-foreground bg-foreground text-background font-medium"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center gap-3 rounded-lg border border-dashed border-border py-20 px-6">
            <div className="w-10 h-10 rounded-md border border-border bg-card flex items-center justify-center">
              <Plug className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[14px] font-medium text-foreground">
                {tab === "connected" && connectedCount === 0 ? "Nothing connected yet" : "No integrations match"}
              </p>
              <p className="text-[13px] text-muted-foreground max-w-[38ch]">
                {tab === "connected" && connectedCount === 0
                  ? "Connect an app and it will show up here."
                  : "Try a different search, category or tab."}
              </p>
            </div>
            {(tab !== "all" || category !== "All" || searchQuery) && (
              <Button
                variant="outline"
                className="h-8 text-[12px] mt-1"
                onClick={() => { setTab("all"); setCategory("All"); setSearchQuery(""); }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visible.map((app) => (
              <IntegrationCard
                key={app.id}
                app={app}
                connected={!!connections[app.id]}
                usedIn={usage[app.id] || []}
                onOpen={() => openModal(app)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {activeApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-lg border border-border bg-background shadow-2xl flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 p-5 pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 shrink-0 rounded-md border border-border bg-card flex items-center justify-center">
                  {activeApp.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold tracking-tight text-foreground truncate">
                    {activeConnected ? "Manage" : "Connect"} {activeApp.name}
                  </h3>
                  <p className="text-[12px] text-muted-foreground font-mono">
                    {activeApp.authType === "oauth" ? "OAuth 2.0" : "Stored credential"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="w-8 h-8 -mr-2 -mt-1 text-muted-foreground hover:text-foreground" onClick={closeModal}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="px-5 pb-5 flex flex-col gap-5">
              {activeConnected && (
                <div className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2.5">
                  <StatusPill connected />
                  <span className="text-[12px] text-muted-foreground">
                    {activeUsage.length === 0 ? "Not used in any workflow" : `Used in ${activeUsage.length} ${activeUsage.length === 1 ? "workflow" : "workflows"}`}
                  </span>
                </div>
              )}

              {activeConnected && activeUsage.length > 0 && (
                <div className="flex flex-col rounded-md border border-border divide-y divide-border max-h-40 overflow-y-auto custom-scrollbar">
                  {activeUsage.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => navigate(`/workflows/${w.id}`)}
                      className="flex items-center justify-between px-3 py-2 text-left text-[13px] text-foreground hover:bg-accent transition-colors"
                    >
                      <span className="truncate">{w.name}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {activeApp.authType === "oauth" ? (
                <div className="flex flex-col gap-3">
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    {activeConnected
                      ? `Re-authenticate to refresh permissions or switch the ${activeApp.name} account Orkflo uses.`
                      : `You'll be redirected to ${activeApp.name} to give Orkflo access to your account.`}
                  </p>
                  {oauthMissing && (
                    <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-[12px] text-amber-500">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
                      <span>
                        Missing client ID for {activeApp.name}. Set <span className="font-mono">VITE_{activeApp.id.toUpperCase()}_CLIENT_ID</span> in your environment.
                      </span>
                    </div>
                  )}
                  <Button onClick={() => handleOAuthRedirect(activeApp.id)} disabled={oauthMissing} className="w-full h-9 gap-2 text-[13px] font-medium">
                    <Link2 className="w-4 h-4" /> {activeConnected ? "Re-authenticate" : `Authenticate with ${activeApp.name}`}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <label className="text-[12px] font-medium text-foreground flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-muted-foreground" />
                    {activeApp.authType === "api_key" ? "API key" : "Webhook URL"}
                  </label>
                  <Input
                    type="password"
                    autoFocus
                    autoComplete="new-password"
                    placeholder={activeConnected ? "Paste a new value to replace the saved one" : `Paste your ${activeApp.name} ${activeApp.authType === "api_key" ? "API key" : "webhook URL"}`}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && inputValue.trim() && !saving) handleSaveCredential(); }}
                    className="font-mono bg-background border-border text-[13px] h-9"
                  />
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Stored encrypted. The saved value is never shown again.
                  </p>
                  <Button onClick={handleSaveCredential} disabled={!inputValue.trim() || saving} className="w-full h-9 gap-2 text-[13px] font-medium">
                    {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving</> : <><Check className="w-4 h-4" /> {activeConnected ? "Replace credential" : "Save credential"}</>}
                  </Button>
                </div>
              )}

              {activeConnected && (
                <div className="pt-4 border-t border-border">
                  {!confirmDisconnect ? (
                    <button
                      onClick={() => setConfirmDisconnect(true)}
                      className="text-[12px] text-destructive hover:underline underline-offset-4"
                    >
                      Disconnect {activeApp.name}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3">
                      <p className="text-[12px] text-foreground leading-relaxed">
                        {activeUsage.length > 0
                          ? `${activeUsage.length} ${activeUsage.length === 1 ? "workflow uses" : "workflows use"} ${activeApp.name}. They will fail until you reconnect.`
                          : `Disconnect ${activeApp.name}?`}
                      </p>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" className="h-8 text-[12px]" onClick={() => setConfirmDisconnect(false)}>Cancel</Button>
                        <Button variant="destructive" className="h-8 text-[12px]" onClick={handleDisconnect}>Disconnect</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
}
