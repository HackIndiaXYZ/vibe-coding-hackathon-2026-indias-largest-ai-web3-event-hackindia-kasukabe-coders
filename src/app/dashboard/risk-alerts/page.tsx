"use client";

import { useState, useEffect, useCallback } from "react";
import type { RiskAlert } from "@/types";
import type { DatasetReadiness } from "@/lib/dashboard-helpers";
import { RiskAlertCard } from "@/components/dashboard/risk-alert-card";
import { ReadinessWarningCard } from "@/components/dashboard/readiness-warning-card";
import { ShieldAlert, Filter, AlertTriangle, AlertCircle, Info, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const severityFilters = [
  { value: "all", label: "All Alerts", icon: ShieldAlert },
  { value: "high", label: "High Risk", icon: AlertTriangle },
  { value: "medium", label: "Medium", icon: AlertCircle },
  { value: "low", label: "Low", icon: Info },
];

export default function RiskAlertsPage() {
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [readiness, setReadiness] = useState<DatasetReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/summary");
      if (!res.ok) {
        throw new Error("Failed to load alerts from dashboard summary API.");
      }
      const data = await res.json();
      setAlerts(data.riskAlerts || []);
      setReadiness(data.readiness || null);
    } catch (e: any) {
      setError(e.message || "An error occurred while loading alerts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // If data is not ready, display the explanations diagnostics card
  const isReady = readiness ? readiness.status === "ready" : true;

  // Compute dynamic stats based on fetched alerts
  const totalCount = alerts.length;
  const highCount = alerts.filter((a) => a.severity === "high").length;
  const mediumCount = alerts.filter((a) => a.severity === "medium").length;
  const lowCount = alerts.filter((a) => a.severity === "low").length;

  const stats = [
    { label: "Total Alerts", value: totalCount, color: "text-slate-300", bg: "bg-slate-700/50" },
    { label: "High Risk", value: highCount, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Medium Risk", value: mediumCount, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Low Risk", value: lowCount, color: "text-blue-400", bg: "bg-blue-500/10" },
  ];

  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.severity === filter);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-space-grotesk">Risk Alerts</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time market risk monitoring across all tracked mandis
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 text-sm px-4 py-2.5 rounded-xl hover:border-slate-600 hover:text-white transition-colors disabled:opacity-50 self-start sm:self-auto shadow-md"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh Alerts
        </button>
      </div>

      {!isReady && readiness ? (
        <div className="py-4">
          <ReadinessWarningCard readiness={readiness} moduleName="Anomaly Risk Alerts" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((s) => (
              <div key={s.label} className={cn("rounded-xl border border-slate-700/50 p-4 text-center transition-all duration-300", s.bg)}>
                {loading ? (
                  <div className="h-8 bg-slate-800 rounded animate-pulse mx-auto w-12" />
                ) : (
                  <div className={cn("text-2xl font-bold font-space-grotesk", s.color)}>{s.value}</div>
                )}
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-semibold shadow-md">
              Error: {error}
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-500" />
            {severityFilters.map((f) => (
              <button
                key={f.value}
                id={`filter-${f.value}`}
                onClick={() => setFilter(f.value as "all" | "high" | "medium" | "low")}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all",
                  filter === f.value
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
                )}
              >
                <f.icon className="w-3.5 h-3.5" />
                {f.label}
              </button>
            ))}
            {!loading && (
              <span className="ml-auto text-xs text-slate-500">{filtered.length} alerts matching</span>
            )}
          </div>

          {/* Alert list */}
          <div className="space-y-4">
            {loading && alerts.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-sm font-medium text-slate-400">Analyzing dataset for market anomalies...</p>
              </div>
            ) : (
              <>
                {filtered.map((alert) => (
                  <RiskAlertCard key={alert.id} alert={alert} />
                ))}
                {filtered.length === 0 && (
                  <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-slate-800/80">
                    <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500">No active alerts for this severity filter</p>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
