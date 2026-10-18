import { useCallback, useEffect, useState } from "react";
import { getUsage, createCheckoutSession } from "../api/workflows";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Check,
  Minus,
  Sparkles,
  Receipt,
  RefreshCw,
  Loader2,
} from "lucide-react";

/* ---------- helpers ---------- */

const isUnlimited = (v) =>
  typeof v === "string" && v.toLowerCase() === "unlimited";
const fmt = (v) =>
  isUnlimited(v) ? "Unlimited" : Number(v ?? 0).toLocaleString();

function toneFor(pct) {
  if (pct >= 100)
    return { bar: "bg-red-500", text: "text-red-500", label: "Limit reached" };
  if (pct >= 80)
    return {
      bar: "bg-amber-400",
      text: "text-amber-400",
      label: "Nearly at your limit",
    };
  return { bar: "bg-foreground", text: "text-muted-foreground", label: "" };
}

const PLANS = [
  {
    key: "free",
    name: "Free",
    blurb: "For trying Orkflo out.",
    rows: [
      ["Workflows", "2"],
      ["Tasks per month", "1,000"],
      ["Priority support", false],
      ["Custom webhooks", true],
    ],
  },
  {
    key: "pro",
    name: "Pro",
    blurb: "For teams running automations in production.",
    rows: [
      ["Workflows", "Unlimited"],
      ["Tasks per month", "10,000"],
      ["Priority support", true],
      ["Custom webhooks", true],
    ],
  },
];

/* ---------- small components ---------- */

function Stat({ label, value, hint }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-semibold tracking-tight text-foreground tabular-nums">
          {value}
        </span>
        {hint && (
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        )}
      </div>
    </div>
  );
}

function Meter({ label, used, limit, pct, note }) {
  const tone = toneFor(pct);
  const unlimited = isUnlimited(limit);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-mono text-[12px] text-muted-foreground tabular-nums">
          <span className="text-foreground">{fmt(used)}</span> / {fmt(limit)}
        </span>
      </div>
      <div
        className="w-full bg-accent rounded-full h-1.5 overflow-hidden"
        role="progressbar"
        aria-valuenow={unlimited ? undefined : Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${tone.bar}`}
          style={{ width: `${unlimited ? 4 : pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[12px]">
        <span className={tone.label ? tone.text : "text-muted-foreground"}>
          {tone.label || note}
        </span>
        {!unlimited && (
          <span className="text-muted-foreground tabular-nums">
            {Math.round(pct)}% used
          </span>
        )}
      </div>
    </div>
  );
}

function PlanCard({ plan, current, loading, onSelect }) {
  const isPro = plan.key === "pro";
  return (
    <div
      className={`flex flex-col rounded-lg border bg-card ${current ? "border-foreground/40" : "border-border"}`}
    >
      <div className="flex items-start justify-between gap-3 p-5 pb-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground flex items-center gap-2">
            {isPro && <Sparkles className="w-4 h-4 text-blue-500" />}
            {plan.name}
          </h3>
          <p className="text-[12px] text-muted-foreground">{plan.blurb}</p>
        </div>
        {current && (
          <span className="text-[11px] font-medium text-foreground border border-border rounded-full px-2 py-0.5 bg-background">
            Current
          </span>
        )}
      </div>

      <ul className="px-5 pb-5 flex flex-col divide-y divide-border">
        {plan.rows.map(([label, value]) => (
          <li
            key={label}
            className="flex items-center justify-between py-2.5 text-[13px]"
          >
            <span className="text-muted-foreground">{label}</span>
            {typeof value === "boolean" ? (
              value ? (
                <Check className="w-4 h-4 text-foreground" />
              ) : (
                <Minus className="w-4 h-4 text-muted-foreground/60" />
              )
            ) : (
              <span className="font-medium text-foreground tabular-nums">
                {value}
              </span>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-auto px-5 py-3 border-t border-border">
        {current ? (
          <span className="text-[12px] text-muted-foreground">
            You're on this plan.
          </span>
        ) : (
          <Button
            onClick={onSelect}
            disabled={loading}
            variant={isPro ? "default" : "outline"}
            className="w-full h-8 text-[12px] font-medium gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Redirecting...
              </>
            ) : isPro ? (
              "Upgrade to Pro"
            ) : (
              "Switch to Free"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ---------- page ---------- */

export default function Billing() {
  const [usage, setUsage] = useState({
    plan: "Free",
    task_count: 0,
    task_limit: 1000,
    task_percentage: 0,
    workflow_count: 0,
    workflow_limit: 2,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchUsage = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const data = await getUsage();
      setUsage((prev) => ({ ...prev, ...data }));
      setError("");
    } catch (err) {
      console.error("Failed to load usage data", err);
      setError("Couldn't load your usage. Showing the last known values.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const handleCheckout = async (planKey) => {
    // Prevent checkout generation if they are selecting the Free tier (we'll build downgrade logic later)
    if (planKey === "free") return;

    setCheckoutLoading(true);
    setError("");
    try {
      const res = await createCheckoutSession(planKey);
      // Redirect the user entirely to the Dodo Payments hosted checkout page
      if (res.checkout_url) {
        window.location.href = res.checkout_url;
      }
    } catch (err) {
      console.error("Checkout failed", err);
      setError("Failed to create a secure checkout session. Please try again.");
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full px-4 py-6 sm:px-6 md:px-8 bg-background">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-6 animate-pulse">
          <div className="h-8 w-48 rounded bg-accent" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-72 rounded-lg bg-accent/60" />
            <div className="h-72 rounded-lg bg-accent/60" />
          </div>
        </div>
      </div>
    );
  }

  const planName = String(usage.plan || "Free");
  const planKey = planName.toLowerCase();
  const tasksUnlimited = isUnlimited(usage.task_limit);
  const workflowsUnlimited = isUnlimited(usage.workflow_limit);

  const taskPct = tasksUnlimited
    ? 0
    : Math.min(
        100,
        Number(
          usage.task_percentage ??
            (usage.task_limit
              ? (usage.task_count / usage.task_limit) * 100
              : 0),
        ),
      );
  const workflowPct = workflowsUnlimited
    ? 0
    : Math.min(
        100,
        usage.workflow_limit
          ? (usage.workflow_count / usage.workflow_limit) * 100
          : 0,
      );

  const tasksLeft = tasksUnlimited
    ? "Unlimited"
    : Math.max(0, usage.task_limit - usage.task_count).toLocaleString();
  const nearLimit = taskPct >= 80 || workflowPct >= 100;

  return (
    <div className="h-full overflow-y-auto px-4 py-6 sm:px-6 md:px-8 bg-background custom-scrollbar">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6 pb-20">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Billing & Usage
            </h1>
            <p className="text-[13px] text-muted-foreground max-w-[60ch]">
              Your plan, what you've used this cycle, and what's left.
            </p>
          </div>
          <button
            onClick={() => fetchUsage(true)}
            disabled={refreshing}
            title="Refresh"
            className="w-8 h-8 shrink-0 rounded-md flex items-center justify-center border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin text-foreground" : ""}`}
            />
          </button>
        </div>

        {error && (
          <div className="rounded-md border border-red-500/25 bg-red-500/5 px-3 py-2 text-[13px] text-red-500 flex items-center justify-between">
            {error}
            <button
              onClick={() => fetchUsage(true)}
              className="underline underline-offset-4"
            >
              Retry
            </button>
          </div>
        )}

        {/* Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 rounded-lg border border-border bg-card divide-border divide-x [&>*:nth-child(n+3)]:border-t md:[&>*:nth-child(n+3)]:border-t-0 [&>*]:border-border [&>*:nth-child(3)]:border-l-0 md:[&>*:nth-child(3)]:border-l">
          <Stat label="Plan" value={planName} />
          <Stat
            label="Tasks used"
            value={fmt(usage.task_count)}
            hint={tasksUnlimited ? undefined : `of ${fmt(usage.task_limit)}`}
          />
          <Stat label="Tasks left" value={tasksLeft} />
          <Stat
            label="Workflows"
            value={fmt(usage.workflow_count)}
            hint={
              workflowsUnlimited ? undefined : `of ${fmt(usage.workflow_limit)}`
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Usage */}
          <section className="lg:col-span-2 rounded-lg border border-border bg-card flex flex-col">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-[14px] font-semibold tracking-tight text-foreground">
                  Usage
                </h2>
                <p className="text-[12px] text-muted-foreground">
                  Tasks reset at the start of each billing cycle.
                </p>
              </div>
              <Badge
                variant="secondary"
                className="bg-accent text-foreground hover:bg-accent px-2 py-0.5 text-[11px] rounded-full font-medium"
              >
                {planName}
              </Badge>
            </div>

            <div className="p-5 flex flex-col gap-7">
              <Meter
                label="Task executions"
                used={usage.task_count}
                limit={usage.task_limit}
                pct={taskPct}
                note={`${tasksLeft} left this cycle`}
              />
              <Meter
                label="Workflows"
                used={usage.workflow_count}
                limit={usage.workflow_limit}
                pct={workflowPct}
                note={
                  workflowsUnlimited
                    ? "No limit on your plan"
                    : `${Math.max(0, usage.workflow_limit - usage.workflow_count)} more available`
                }
              />
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-border">
              <p className="text-[12px] text-muted-foreground">
                {nearLimit
                  ? "You're close to a limit. Upgrade to keep your workflows running."
                  : "Need more room? Compare plans below."}
              </p>
              <Button
                onClick={() => handleCheckout("pro")}
                disabled={checkoutLoading}
                variant={nearLimit ? "default" : "outline"}
                className="h-8 px-3 text-[12px] font-medium shrink-0"
              >
                {nearLimit ? "Upgrade Now" : "Manage billing"}
              </Button>
            </div>
          </section>

          {/* Invoices */}
          <section className="rounded-lg border border-border bg-card flex flex-col">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-[14px] font-semibold tracking-tight text-foreground">
                Invoices
              </h2>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center text-center gap-3 px-6 py-10">
              <div className="w-10 h-10 rounded-md border border-border bg-background flex items-center justify-center">
                <Receipt className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[14px] font-medium text-foreground">
                  No invoices yet
                </p>
                <p className="text-[13px] text-muted-foreground max-w-[30ch]">
                  Invoices will appear here once you upgrade to a paid plan.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Plans */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[13px] font-medium text-foreground">Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[760px]">
            {PLANS.map((p) => (
              <PlanCard
                key={p.key}
                plan={p}
                current={planKey === p.key}
                loading={checkoutLoading}
                onSelect={() => handleCheckout(p.key)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
