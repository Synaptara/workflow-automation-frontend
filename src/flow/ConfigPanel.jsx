import { useState } from "react";
import { Link } from "react-router-dom";
import RichInput, { RichInputMetaContext } from "../components/RichInput";
import { INTEGRATIONS } from "../config/integrations";
import { webhookFullUrl } from "../lib/config";
import {
  BlocksIcon,
  WorkflowIcon,
  NetworkIcon,
  RotateCcwClockIcon,
} from "../components/icons";
import { ExternalLink, Lock, ShieldCheck, Trash2, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { getIntegrationIcon, appName } from "./appIcon";

const NO_VAULT = ["http", "webhook", "schedule", "email"];
const AUTH_KEYS = ["webhook_url", "api_key"];

const OPERATOR_OPTIONS = [
  ["contains", "Contains text"],
  ["==", "Equals exactly"],
  ["!=", "Does not equal"],
  [">", "Is greater than (>)"],
  ["<", "Is less than (<)"],
  [">=", "Is at least (≥)"],
  ["<=", "Is at most (≤)"],
];

const VARIABLE_META = {
  issue_title: { label: "Title", desc: "Title of the issue" },
  issue_body: { label: "Description", desc: "Body text of the issue" },
  author: { label: "Author", desc: "Creator's username" },
  repo_name: { label: "Repository", desc: "Repository name" },
  url: { label: "Link", desc: "Direct web URL" },
  content: { label: "Message Text", desc: "Chat message content" },
  author_name: { label: "Sender Name", desc: "Username of sender" },
  author_id: { label: "Sender ID", desc: "User ID of sender" },
  channel_id: { label: "Channel ID", desc: "Discord channel ID" },
  guild_id: { label: "Server ID", desc: "Discord server ID" },
  row_index: { label: "Row Number", desc: "Spreadsheet row #" },
  col_a: { label: "Column A", desc: "First column value" },
  col_b: { label: "Column B", desc: "Second column value" },
  col_c: { label: "Column C", desc: "Third column value" },
  source: { label: "Source", desc: "How this run started" },
};

function getVarMeta(key, sampleVal) {
  const found = VARIABLE_META[key];
  const label = found
    ? found.label
    : key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const sample =
    sampleVal !== undefined &&
    sampleVal !== null &&
    String(sampleVal).trim() !== ""
      ? String(sampleVal)
      : found?.desc || "";
  return { label, sample };
}

const lbl = "text-[12px] font-medium text-foreground";
const sec =
  "text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-wider";
const rowCls =
  "group flex items-center gap-3 w-full p-2.5 rounded-md border border-border bg-card hover:bg-accent transition-colors text-left";

const kindOf = (t) => (t === "trigger" ? "triggers" : "actions");
const defaultsFor = (key, type, ev) =>
  Object.fromEntries(
    (INTEGRATIONS[key]?.[kindOf(type)]?.[ev]?.fields || [])
      .filter((f) => f.type === "select")
      .map((f) => [f.key, f.options[0]?.value]),
  );

function Pick({ value, onChange, options, placeholder }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full bg-background border-border text-[13px] h-9">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AppRow({ icon, title, sub, onClick, trailing }) {
  return (
    <button onClick={onClick} className={rowCls}>
      <div className="w-8 h-8 shrink-0 rounded-md bg-background border border-border flex items-center justify-center group-hover:border-foreground/30">
        {icon}
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-[13px] font-medium text-foreground truncate">
          {title}
        </span>
        {sub && (
          <span className="text-[11px] text-muted-foreground truncate">
            {sub}
          </span>
        )}
      </div>
      {trailing}
    </button>
  );
}

function Variables({
  triggerNode,
  triggerSchema,
  upstream,
  stepNumbers,
  selectedPath,
  onPick,
}) {
  const triggerKeys = triggerSchema
    ? Object.keys(triggerSchema).filter((k) => k !== "event_type")
    : [];
  const triggerActionKey = triggerNode?.data?.actionKey || "webhook";
  const triggerStepNum = (triggerNode && stepNumbers?.[triggerNode.id]) || 1;

  return (
    <div className="flex flex-col gap-2.5 mt-1 p-3 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">
          Data from previous steps
        </span>
        <span className="text-[10px] text-muted-foreground/70">
          Click to insert
        </span>
      </div>

      {triggerKeys.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground/80">
            <span className="w-4 h-4 rounded-full bg-accent text-foreground text-[10px] font-semibold flex items-center justify-center">
              {triggerStepNum}
            </span>
            <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
              {getIntegrationIcon(triggerActionKey)}
            </span>
            <span className="truncate">{appName(triggerActionKey)}</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {triggerKeys.map((k) => {
              const path = `trigger.${k}`;
              const { label, sample } = getVarMeta(k, triggerSchema?.[k]);
              const isSelected = selectedPath === path;
              return (
                <button
                  key={k}
                  type="button"
                  title={sample ? `Example: ${sample}` : label}
                  onClick={() => onPick(path)}
                  className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-left transition-all min-w-0 ${
                    isSelected
                      ? "bg-foreground text-background border-foreground shadow-sm"
                      : "bg-background border-border hover:border-foreground/50 hover:bg-accent/50"
                  }`}
                >
                  <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                    {getIntegrationIcon(triggerActionKey)}
                  </span>
                  <span className="flex flex-col min-w-0 flex-1">
                    <span
                      className={`text-[12px] font-medium truncate ${isSelected ? "text-background" : "text-foreground"}`}
                    >
                      {triggerStepNum}. {label}
                    </span>
                    {sample && (
                      <span
                        className={`text-[10px] truncate ${isSelected ? "text-background/75" : "text-muted-foreground"}`}
                      >
                        {sample}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {upstream.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-1 border-t border-border/60">
          <div className="flex flex-wrap gap-1.5">
            {upstream.map((n) => {
              const stepNum = stepNumbers?.[n.id] || "";
              const path = `${n.id}${n.data.actionKey === "groq_ai" ? ".reply" : ""}`;
              const isSelected = selectedPath === path;
              const outLabel =
                n.data.actionKey === "groq_ai" ? "AI Response" : "Output";
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onPick(path)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-left transition-all ${
                    isSelected
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background border-border hover:border-foreground/50 hover:bg-accent/50"
                  }`}
                >
                  <span className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                    {getIntegrationIcon(n.data.actionKey)}
                  </span>
                  <span className="text-[12px] font-medium">
                    {stepNum ? `${stepNum}. ` : ""}
                    {appName(n.data.actionKey)} · {outLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!triggerKeys.length && !upstream.length && (
        <span className="text-[11px] text-muted-foreground">
          Click <strong>Load Sample Data</strong> on the left panel to see
          available fields.
        </span>
      )}
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
        <Pick
          value={value || field.options[0]?.value || ""}
          onChange={onChange}
          options={field.options.map((o) => [o.value, o.label])}
          placeholder="Select an option"
        />
      ) : isAuth ? (
        <input
          type="password"
          autoComplete="new-password"
          className={`bg-background border border-border rounded-md px-3 py-2 text-[13px] outline-none transition-colors w-full ${secured && !value ? "placeholder-emerald-500/40 text-emerald-500 focus:border-emerald-500" : "text-foreground focus:border-foreground"}`}
          placeholder={
            secured ? "Using your connected account" : field.placeholder
          }
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <RichInput
          value={value || ""}
          onChange={onChange}
          placeholder={field.placeholder}
          isTextArea={field.type === "textarea"}
        />
      )}
      {!isAuth && children}
    </div>
  );
}

export default function ConfigPanel({
  selected,
  onUpdate,
  onClose,
  onDelete,
  workflow,
  vaultKeys,
  triggerNode,
  triggerSchema,
  upstream,
  stepNumbers,
  notify,
}) {
  const [customFieldMode, setCustomFieldMode] = useState(false);
  const { stepType, actionKey, appEvent } = selected.data;
  const config =
    selected.data.config && typeof selected.data.config === "object"
      ? selected.data.config
      : {};
  const setCfg = (k, v) => onUpdate({ config: { ...config, [k]: v } });
  const append = (k, text) => setCfg(k, (config[k] || "") + text);

  const isCondition = stepType === "condition";
  const integ = INTEGRATIONS[actionKey];
  const events = integ?.[kindOf(stepType)] || {};
  const fields = events[appEvent]?.fields || [];
  const usesVault = !!actionKey && !NO_VAULT.includes(actionKey);
  const vaultOk = vaultKeys.includes(actionKey);
  const needsVault = usesVault && !vaultOk;

  const stepNum = stepNumbers?.[selected.id];
  const roleLabel =
    stepType === "trigger"
      ? "Trigger"
      : isCondition
        ? "Router (If / Else)"
        : "Action";
  const subtitle = stepNum ? `Step ${stepNum} · ${roleLabel}` : roleLabel;

  const title = isCondition
    ? "Router"
    : actionKey
      ? appName(actionKey)
      : "Choose an app";
  const icon = isCondition ? (
    <BlocksIcon className="w-4 h-4 text-foreground" />
  ) : actionKey ? (
    getIntegrationIcon(actionKey)
  ) : (
    <WorkflowIcon className="w-4 h-4 text-muted-foreground" />
  );
  const pickApp = (key, ev = "") =>
    onUpdate({
      actionKey: key,
      appEvent: ev,
      config: ev ? defaultsFor(key, stepType, ev) : {},
    });

  const triggerActionKey = triggerNode?.data?.actionKey || "webhook";
  const triggerStepNum = (triggerNode && stepNumbers?.[triggerNode.id]) || 1;

  const renderSelectedConditionField = () => {
    const raw = (config.field || "").trim();
    if (!raw) return null;
    if (raw.startsWith("trigger.")) {
      const key = raw.slice("trigger.".length);
      const { label, sample } = getVarMeta(key, triggerSchema?.[key]);
      return (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-border bg-card">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-4 h-4 shrink-0 flex items-center justify-center">
              {getIntegrationIcon(triggerActionKey)}
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-medium text-foreground truncate">
                {triggerStepNum}. {label}
              </span>
              {sample && (
                <span className="text-[11px] text-muted-foreground truncate">
                  {sample}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCfg("field", "")}
            className="text-muted-foreground hover:text-foreground p-1 rounded"
            title="Clear selection"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }
    return null;
  };

  const friendlyPill =
    isCondition && !customFieldMode ? renderSelectedConditionField() : null;

  return (
    <RichInputMetaContext.Provider
      value={{ triggerNode, upstream, stepNumbers }}
    >
      <div className="absolute right-0 top-0 h-full z-30 w-full max-w-[350px] border-l border-border bg-background px-5 py-5 shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md border border-border bg-card flex items-center justify-center shrink-0">
              {icon}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[14px] font-semibold text-foreground truncate">
                {title}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {subtitle}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
          {isCondition && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className={lbl}>When this value</label>
                  <button
                    type="button"
                    onClick={() => setCustomFieldMode((v) => !v)}
                    className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-4"
                  >
                    {customFieldMode ? "Pick from list" : "Custom field"}
                  </button>
                </div>

                {friendlyPill ? (
                  friendlyPill
                ) : (
                  <Input
                    className="bg-background border-border text-[13px] h-9"
                    placeholder="Select a value below (e.g. 1. Title)"
                    value={config.field || ""}
                    onChange={(e) => setCfg("field", e.target.value)}
                  />
                )}

                <Variables
                  triggerNode={triggerNode}
                  triggerSchema={triggerSchema}
                  upstream={upstream}
                  stepNumbers={stepNumbers}
                  selectedPath={config.field}
                  onPick={(p) => setCfg("field", p)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className={lbl}>Condition</label>
                <Pick
                  value={config.operator || "=="}
                  onChange={(v) => setCfg("operator", v)}
                  options={OPERATOR_OPTIONS}
                  placeholder="Select condition"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className={lbl}>Matches value</label>
                <Input
                  className="bg-background border-border text-[13px] h-9"
                  placeholder="e.g. bug"
                  value={config.value || ""}
                  onChange={(e) => setCfg("value", e.target.value)}
                />
              </div>
            </div>
          )}

          {!isCondition && !actionKey && (
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-[14px] font-semibold text-foreground mb-1">
                  Choose an app
                </h3>
                <p className="text-[12px] text-muted-foreground">
                  Pick the app that will run in this step.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <span className={sec}>Built-in tools</span>
                {stepType === "trigger" ? (
                  <>
                    <AppRow
                      icon={<NetworkIcon className="w-4 h-4 text-foreground" />}
                      title="Incoming Webhook"
                      sub="Start from any external URL call"
                      onClick={() => pickApp("webhook", "webhook_in")}
                    />
                    <AppRow
                      icon={
                        <RotateCcwClockIcon className="w-4 h-4 text-foreground" />
                      }
                      title="Schedule"
                      sub="Run automatically on a timer"
                      onClick={() => pickApp("schedule", "schedule_run")}
                    />
                  </>
                ) : (
                  <AppRow
                    icon={<NetworkIcon className="w-4 h-4 text-blue-500" />}
                    title="HTTP Request"
                    sub="Send data to any custom URL"
                    onClick={() => pickApp("http", "custom_request")}
                  />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <span className={`${sec} mt-2`}>Apps</span>
                {Object.entries(INTEGRATIONS)
                  .filter(
                    ([, c]) =>
                      Object.keys(c[kindOf(stepType)] || {}).length > 0,
                  )
                  .map(([key, c]) => (
                    <AppRow
                      key={key}
                      icon={getIntegrationIcon(key)}
                      title={c.name}
                      onClick={() => pickApp(key)}
                      trailing={
                        vaultKeys.includes(key) && (
                          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        )
                      }
                    />
                  ))}
              </div>
            </div>
          )}

          {!isCondition && actionKey && (
            <div className="flex flex-col gap-5 w-full">
              <div className="flex items-center justify-between bg-card border border-border rounded-md p-2">
                <div className="flex items-center gap-2 px-1 overflow-hidden">
                  {getIntegrationIcon(actionKey)}
                  <span className="text-[13px] font-medium text-foreground truncate">
                    {appName(actionKey)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => pickApp("")}
                  className="h-7 text-[11px] font-medium"
                >
                  Change app
                </Button>
              </div>

              {usesVault && vaultOk && (
                <div className="flex items-center justify-between rounded-md border border-border bg-card/60 px-3 py-2 text-[11px]">
                  <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> Account connected
                  </span>
                  <Link
                    to="/integrations"
                    target="_blank"
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Reconnect <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}

              {integ && (
                <div className="flex flex-col gap-2">
                  <label className={lbl}>
                    {stepType === "trigger"
                      ? "When this happens"
                      : "Do this action"}
                  </label>
                  <Pick
                    value={appEvent || ""}
                    onChange={(v) => pickApp(actionKey, v)}
                    options={Object.entries(events).map(([k, e]) => [
                      k,
                      e.name,
                    ])}
                    placeholder="Choose an event"
                  />
                </div>
              )}

              {appEvent && (
                <div className="animate-in slide-in-from-bottom-2 pt-5 border-t border-border flex flex-col gap-5">
                  {needsVault ? (
                    <div className="flex flex-col items-center text-center p-5 border border-dashed border-border rounded-md bg-card">
                      <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-3">
                        <Lock className="w-5 h-5" />
                      </div>
                      <h4 className="text-[13px] font-semibold text-foreground mb-1">
                        Connect your {appName(actionKey)} account
                      </h4>
                      <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
                        Link {appName(actionKey)} once in the Vault to use it in
                        your workflows.
                      </p>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full text-xs font-medium h-9"
                      >
                        <Link to="/integrations" target="_blank">
                          Connect {appName(actionKey)}{" "}
                          <ExternalLink className="w-3.5 h-3.5 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <>
                      {actionKey === "webhook" && (
                        <div className="flex flex-col gap-3">
                          <p className="text-muted-foreground text-[11px] leading-relaxed">
                            Send data to this unique URL to start this workflow
                            automatically.
                          </p>
                          <div className="bg-card border border-border rounded-md p-3 flex flex-col gap-3">
                            <code className="text-[11px] text-foreground break-all font-mono">
                              {webhookFullUrl(workflow?.webhook_url)}
                            </code>
                            <Button
                              variant="secondary"
                              className="w-full h-8 text-[11px] font-medium"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  webhookFullUrl(workflow?.webhook_url),
                                );
                                notify("success", "Webhook URL copied");
                              }}
                            >
                              Copy webhook URL
                            </Button>
                          </div>
                        </div>
                      )}
                      {actionKey === "schedule" && (
                        <div className="flex flex-col gap-2">
                          <label className={lbl}>Run every (minutes)</label>
                          <Input
                            type="number"
                            className="h-9 text-[13px]"
                            placeholder="15"
                            value={config.interval || ""}
                            onChange={(e) => setCfg("interval", e.target.value)}
                          />
                        </div>
                      )}
                      {fields.map((f) => (
                        <Field
                          key={f.key}
                          field={f}
                          value={config[f.key]}
                          onChange={(v) => setCfg(f.key, v)}
                          vaultOk={vaultOk}
                        >
                          <Variables
                            triggerNode={triggerNode}
                            triggerSchema={triggerSchema}
                            upstream={upstream}
                            stepNumbers={stepNumbers}
                            onPick={(p) => append(f.key, `{{${p}}}`)}
                          />
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
            <Button
              variant="destructive"
              className="w-full h-9 text-[12px] gap-2"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" /> Delete step
            </Button>
          </div>
        )}
      </div>
    </RichInputMetaContext.Provider>
  );
}
