import { useState, useEffect } from "react";
import api from "../api/axios";

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

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const { data } = await api.get("/usage/");
        setUsage(data);
      } catch (err) {
        console.error("Failed to load usage data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#060607]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-white/20 border-t-zinc-400 rounded-full animate-spin"></div>
          <p className="text-zinc-500 text-sm font-medium tracking-wide">Loading billing data...</p>
        </div>
      </div>
    );
  }

  const workflowPercentage =
    usage.workflow_limit === "Unlimited"
      ? 0
      : Math.min(100, (usage.workflow_count / usage.workflow_limit) * 100);

  return (
    <div className="h-full overflow-y-auto px-4 sm:px-10 py-6 sm:py-8 space-y-6 sm:space-y-8 custom-scrollbar bg-[#060607]">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">

        {/* Section Header */}
        <div className="pt-2">
          <h1 className="text-3xl font-serif text-zinc-100 tracking-tight">
            Billing & Usage
          </h1>
          <p className="text-sm text-zinc-400 mt-2 font-medium">
            Manage your subscription plan, view limits, and track automated task usage.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">

          {/* Left Column: Plan Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Current Plan Card */}
            <div className="bg-[#09090b] border border-zinc-800/80 rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">Current Plan</h2>
                  <p className="text-[13px] text-zinc-400 font-medium mt-1">You are currently on the {usage.plan} tier.</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-md text-[11px] font-bold bg-zinc-100 text-zinc-900 uppercase tracking-wider shadow-sm">
                  {usage.plan}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-5 border-t border-zinc-800/50">
                <button className="w-full sm:w-auto px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-bold rounded-md transition-all shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  Upgrade Plan
                </button>
                <button className="w-full sm:w-auto px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-zinc-100 text-xs font-semibold rounded-md transition-colors shadow-sm">
                  Manage Billing
                </button>
              </div>
            </div>

            {/* Usage Metrics Card */}
            <div className="bg-[#09090b] border border-zinc-800/80 rounded-xl p-6 space-y-8 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">Usage Limits</h2>

              {/* Task Execution Progress */}
              <div>
                <div className="flex justify-between text-[13px] mb-2.5">
                  <span className="font-semibold text-zinc-300">Task Executions</span>
                  <span className="text-zinc-500 font-mono font-medium">
                    <span className="text-zinc-200">{usage.task_count}</span> / {usage.task_limit}
                  </span>
                </div>
                <div className="w-full bg-zinc-900/80 rounded-full h-2.5 overflow-hidden border border-zinc-800/50 shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      usage.task_percentage >= 90 ? "bg-red-500/80" : "bg-emerald-500/80"
                    }`}
                    style={{ width: `${usage.task_percentage}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-zinc-500 font-medium mt-2">
                  Tasks reset at the beginning of your billing cycle.
                </p>
              </div>

              {/* Workflow Limit Progress */}
              <div>
                <div className="flex justify-between text-[13px] mb-2.5">
                  <span className="font-semibold text-zinc-300">Active Workflows</span>
                  <span className="text-zinc-500 font-mono font-medium">
                    <span className="text-zinc-200">{usage.workflow_count}</span> / {usage.workflow_limit}
                  </span>
                </div>
                <div className="w-full bg-zinc-900/80 rounded-full h-2.5 overflow-hidden border border-zinc-800/50 shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      workflowPercentage >= 100 ? "bg-orange-500/80" : "bg-blue-500/80"
                    }`}
                    style={{ width: `${workflowPercentage}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-zinc-500 font-medium mt-2">
                  Upgrade to Pro to unlock unlimited workflows.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Upgrade Promo */}
          <div className="relative overflow-hidden bg-[#09090b] border border-emerald-500/20 rounded-xl p-6 flex flex-col justify-between min-h-[300px] shadow-[0_0_15px_rgba(16,185,129,0.05)]">
            <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none"></div>

            <div className="relative z-10">
              <h3 className="text-lg font-semibold text-emerald-400 tracking-tight mb-2">Unlock Pro</h3>
              <p className="text-[13px] text-zinc-400 font-medium leading-relaxed mb-6">
                Remove workflow limits, access premium integration nodes, and get higher task execution caps for your growing enterprise.
              </p>

              <ul className="space-y-3 mb-8">
                {["Unlimited workflows", "10,000 tasks / month", "Priority support", "Custom webhooks"].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-[13px] font-medium text-zinc-300">
                    <svg className="w-4 h-4 text-emerald-400/80 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <button className="relative z-10 w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md text-xs font-bold transition-colors shadow-sm">
              View Pricing Plans
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
