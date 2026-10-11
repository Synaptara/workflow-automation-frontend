import { Link } from "react-router-dom";
import RichInput from "../components/RichInput";
import { INTEGRATIONS } from "../config/integrations";
import { webhookFullUrl } from "../lib/config";
import { BlocksIcon, WorkflowIcon, NetworkIcon, RotateCcwClockIcon } from "../components/icons";
import { ExternalLink, Lock, ShieldCheck, Trash2, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { getIntegrationIcon, appName } from "./appIcon";

const NO_VAULT = ["http", "webhook", "schedule", "email"];
const AUTH_KEYS = ["webhook_url", "api_key"];
const OPERATORS = ["==", "!=", ">", "<", ">=", "<=", "contains"];
const lbl = "text-[12px] font-medium text-foreground";
const sec = "text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider";
const rowCls = "group flex items-center gap-3 w-full p-2.5 rounded-md border border-border bg-card hover:bg-accent transition-colors text-left";

const kindOf = (t) => (t === "trigger" ? "triggers" : "actions");
const defaultsFor = (key, type, ev) =>
  Object.fromEntries(
    (INTEGRATIONS[key]?.[kindOf(type)]?.[ev]?.fields || [])
      .filter((f) => f.type === "select")
      .map((f) => [f.key, f.options[0]?.value])
  );

function Pick({ value, onChange, options, placeholder }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full bg-background border-border text-[13px] h-9"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function AppRow({ icon, title, sub, onClick, trailing }) {
  return (
    <button onClick={onClick} className={rowCls}>
      <div className="w-8 h-8 shrink-0 rounded-md bg-background border border-border flex items-center justify-center group-hover:border-foreground/30">{icon}</div>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-[13px] font-medium text-foreground truncate">{title}</span>
        {sub && <span className="text-[11px] text-muted-foreground truncate">{sub}</span>}
      </div>
      {trailing}
    </button>
  );
}

function Variables({ triggerKeys, upstream, onPick }) {
  const chip = "text-[10px] font-mono bg-background border border-border px-1.5 py-1 rounded hover:border-foreground transition-colors";
  return (
    <div className="flex flex-col gap-2 mt-1 p-3 bg-muted/40 rounded-md border border-border">
      <span className={sec}>Insert variables</span>
      <div className="flex flex-wrap gap-1.5">
        {triggerKeys.map((k) => (
          <button key={k} type="button" onClick={() => onPick(`trigger.${k}`)} className={`${chip} text-muted-foreground`}>+ trigger.{k}</button>
        ))}
        {upstream.map((n) => (
          <button key={n.id} type="button" onClick={() => onPick(`${n.id}${n.data.actionKey === "groq_ai" ? ".reply" : ""}`)} className={`${chip} text-foreground`}>
            + {appName(n.data.actionKey)}
          </button>
        ))}
        {!triggerKeys.length && !upstream.length && (
          <span className="text-[11px] text-muted-foreground italic">Click "Fetch Recent Event" to load variables</span>
        )}
      </div>
    </div>
  );
}

function Field({ field, value, onChange, vaultOk, children }) {
  const isAuth = AUTH_KEYS.includes(field.key);
  const secured = isAuth && vaultOk;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className={lbl}>{field.label}</label>
        {secured && (
          <span className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
            <Lock className="w-2.5 h-2.5" /> Vault secured
          </span>
        )}
      </div>
      {field.type === "select" ? (
        <Pick value={value || field.options[0]?.value || ""} onChange={onChange} options={field.options.map((o) => [o.value, o.label])} placeholder="Select an option" />
      ) : isAuth ? (
        <input
          type="password"
          autoComplete="new-password"
          className={`bg-background border border-border rounded-md px-3 py-2 text-[13px] outline-none transition-colors w-full ${secured && !value ? "placeholder-emerald-500/40 text-emerald-500 focus:border-emerald-500" : "text-foreground focus:border-foreground"}`}
          placeholder={secured ? "Leave blank to use Vault connection" : field.placeholder}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <RichInput value={value || ""} onChange={onChange} placeholder={field.placeholder} isTextArea={field.type === "textarea"} />
      )}
      {!isAuth && children}
    </div>
  );
}

export default function ConfigPanel({ selected, onUpdate, onClose, onDelete, workflow, vaultKeys, triggerSchema, upstream, notify }) {
  const { stepType, actionKey, appEvent } = selected.data;
  const config = selected.data.config && typeof selected.data.config === "object" ? selected.data.config : {};
  const setCfg = (k, v) => onUpdate({ config: { ...config, [k]: v } });
  const append = (k, text) => setCfg(k, (config[k] || "") + text);
  const triggerKeys = triggerSchema ? Object.keys(triggerSchema) : [];

  const isCondition = stepType === "condition";
  const integ = INTEGRATIONS[actionKey];
  const events = integ?.[kindOf(stepType)] || {};
  const fields = events[appEvent]?.fields || [];
  const vaultOk = vaultKeys.includes(actionKey);
  const needsVault = !!actionKey && !NO_VAULT.includes(actionKey) && !vaultOk;
  const title = isCondition ? "Router" : actionKey ? appName(actionKey) : "Choose an app";
  const icon = isCondition ? <BlocksIcon className="w-4 h-4 text-foreground" /> : actionKey ? getIntegrationIcon(actionKey) : <WorkflowIcon className="w-4 h-4 text-muted-foreground" />;
  const pickApp = (key, ev = "") => onUpdate({ actionKey: key, appEvent: ev, config: ev ? defaultsFor(key, stepType, ev) : {} });

  return (
    <div className="absolute right-0 top-0 h-full z-30 w-full max-w-[340px] border-l border-border bg-background px-5 py-5 shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-md border border-border bg-card flex items-center justify-center shrink-0">{icon}</div>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-medium text-foreground truncate">{title}</span>
            <span className="text-[11px] font-mono text-muted-foreground">{stepType}</span>
          </div>
        </div>
        <button onClick={onClose} aria-label="Close" className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent transition-colors"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
        {isCondition && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className={lbl}>Field to check</label>
              <Input className="bg-background border-border text-[13px] h-9" placeholder="e.g. trigger.issue_title" value={config.field || ""} onChange={(e) => setCfg("field", e.target.value)} />
              <Variables triggerKeys={triggerKeys} upstream={upstream} onPick={(p) => append("field", p)} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={lbl}>Operator</label>
              <Pick value={config.operator || "=="} onChange={(v) => setCfg("operator", v)} options={OPERATORS.map((o) => [o, o])} placeholder="Select operator" />
            </div>
            <div className="flex flex-col gap-2">
              <label className={lbl}>Target value</label>
              <Input className="bg-background border-border text-[13px] h-9" placeholder="e.g. 5000" value={config.value || ""} onChange={(e) => setCfg("value", e.target.value)} />
            </div>
          </div>
        )}

        {!isCondition && !actionKey && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="text-[14px] font-semibold text-foreground mb-1">Select an app</h3>
              <p className="text-[11px] text-muted-foreground">Choose what application will handle this step.</p>
            </div>
            <div className="flex flex-col gap-2">
              <span className={sec}>Built-in</span>
              {stepType === "trigger" ? (
                <>
                  <AppRow icon={<NetworkIcon className="w-4 h-4 text-foreground" />} title="Incoming Webhook" sub="Trigger via HTTP POST" onClick={() => pickApp("webhook", "webhook_in")} />
                  <AppRow icon={<RotateCcwClockIcon className="w-4 h-4 text-foreground" />} title="Schedule" sub="Run on a fixed interval" onClick={() => pickApp("schedule", "schedule_run")} />
                </>
              ) : (
                <AppRow icon={<NetworkIcon className="w-4 h-4 text-blue-500" />} title="HTTP Request" sub="Send custom API requests" onClick={() => pickApp("http", "custom_request")} />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <span className={`${sec} mt-2`}>Marketplace</span>
              {Object.entries(INTEGRATIONS)
                .filter(([, c]) => Object.keys(c[kindOf(stepType)] || {}).length > 0)
                .map(([key, c]) => (
                  <AppRow key={key} icon={getIntegrationIcon(key)} title={c.name} onClick={() => pickApp(key)}
                    trailing={vaultKeys.includes(key) && <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />} />
                ))}
            </div>
          </div>
        )}

        {!isCondition && actionKey && (
          <div className="flex flex-col gap-5 w-full">
            <div className="flex items-center justify-between bg-card border border-border rounded-md p-2">
              <div className="flex items-center gap-2 px-1 overflow-hidden">
                {getIntegrationIcon(actionKey)}
                <span className="text-[13px] font-medium text-foreground truncate">{appName(actionKey)}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => pickApp("")} className="h-7 text-[10px] font-mono uppercase tracking-wider">Change</Button>
            </div>

            {integ && (
              <div className="flex flex-col gap-2">
                <label className={lbl}>{stepType === "trigger" ? "Trigger event" : "Action event"}</label>
                <Pick value={appEvent || ""} onChange={(v) => pickApp(actionKey, v)} options={Object.entries(events).map(([k, e]) => [k, e.name])} placeholder="Select an event" />
              </div>
            )}

            {appEvent && (
              <div className="animate-in slide-in-from-bottom-2 pt-5 border-t border-border flex flex-col gap-5">
                {needsVault ? (
                  <div className="flex flex-col items-center text-center p-5 border border-dashed border-border rounded-md bg-card">
                    <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3"><Lock className="w-5 h-5" /></div>
                    <h4 className="text-[13px] font-semibold text-foreground mb-1">Vault connection required</h4>
                    <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">Connect {appName(actionKey)} to map fields.</p>
                    <Button asChild variant="outline" className="w-full text-xs font-medium h-9">
                      <Link to="/integrations" target="_blank">Open Vault <ExternalLink className="w-3.5 h-3.5 ml-2" /></Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    {actionKey === "webhook" && (
                      <div className="flex flex-col gap-3">
                        <p className="text-muted-foreground text-[11px] leading-relaxed">Send a POST request to this URL to trigger this workflow.</p>
                        <div className="bg-card border border-border rounded-md p-3 flex flex-col gap-3">
                          <code className="text-[11px] text-foreground break-all font-mono">{webhookFullUrl(workflow?.webhook_url)}</code>
                          <Button variant="secondary" className="w-full h-8 text-[11px] font-medium"
                            onClick={() => { navigator.clipboard.writeText(webhookFullUrl(workflow?.webhook_url)); notify("success", "Webhook URL copied"); }}>
                            Copy webhook URL
                          </Button>
                        </div>
                      </div>
                    )}
                    {actionKey === "schedule" && (
                      <div className="flex flex-col gap-2">
                        <label className={lbl}>Interval (minutes)</label>
                        <Input type="number" className="h-9 text-[13px]" placeholder="15" value={config.interval || ""} onChange={(e) => setCfg("interval", e.target.value)} />
                      </div>
                    )}
                    {fields.map((f) => (
                      <Field key={f.key} field={f} value={config[f.key]} onChange={(v) => setCfg(f.key, v)} vaultOk={vaultOk}>
                        <Variables triggerKeys={triggerKeys} upstream={upstream} onPick={(p) => append(f.key, `{{${p}}}`)} />
                      </Field>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {stepType !== "trigger" && (
        <div className="pt-4 shrink-0 border-t border-border bg-background">
          <Button variant="destructive" className="w-full h-9 text-[12px] gap-2" onClick={onDelete}>
            <Trash2 className="w-4 h-4" /> Delete module
          </Button>
        </div>
      )}
    </div>
  );
}
