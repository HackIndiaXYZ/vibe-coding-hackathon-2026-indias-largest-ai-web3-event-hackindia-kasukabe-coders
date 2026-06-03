import { getDashboardSummary } from "@/lib/dashboard-helpers";
import { KPICard } from "@/components/dashboard/kpi-card";
import { ForecastCard } from "@/components/dashboard/forecast-card";
import { RiskAlertCard } from "@/components/dashboard/risk-alert-card";
import { AIRecommendationCard } from "@/components/dashboard/ai-recommendation-card";
import { ReadinessWarningCard } from "@/components/dashboard/readiness-warning-card";
import { Activity, AlertTriangle, Brain, Sparkles, Database, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default function DashboardOverview() {
  const summary = getDashboardSummary();
  const { datasetMode, recordCount, readiness, kpis, featuredForecast, riskAlerts, aiRecommendations, aiInsights } = summary;

  const isForecastReady = readiness.status === "ready";
  const topOpportunityCommodity = featuredForecast?.commodity || "Onion";

  // Readiness pill configuration
  const readinessBadge = {
    ready: {
      icon: CheckCircle2,
      style: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    },
    limited: {
      icon: AlertCircle,
      style: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    },
    unavailable: {
      icon: XCircle,
      style: "bg-rose-500/15 border-rose-500/30 text-rose-400",
    },
  }[readiness.status];

  const ReadinessIcon = readinessBadge.icon;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/60 via-green-900/30 to-slate-800/60 border border-emerald-500/20 p-6">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #22c55e 0%, transparent 60%)" }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">Good afternoon, Rajesh!</span>
            </div>
            <h2 className="text-xl font-bold text-white font-space-grotesk">
              {isForecastReady ? (
                <>Market conditions are <span className="text-emerald-400">favourable</span> for {topOpportunityCommodity} sellers today.</>
              ) : (
                <>Database online and ready for <span className="text-emerald-400">data aggregation</span>.</>
              )}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {isForecastReady ? (
                <>{aiInsights.length} new AI insights available · {riskAlerts.filter((a) => a.severity === "high").length} high-priority risk alerts</>
              ) : (
                <>Time-series model offline due to limited historical coordinates</>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {/* Dataset readiness pill badge */}
            <div className={`flex items-center gap-1.5 border rounded-xl px-3.5 py-2 text-xs font-bold shadow-md ${readinessBadge.style}`}>
              <ReadinessIcon className="w-3.5 h-3.5" />
              <span>{readiness.label}</span>
            </div>
            
            {/* Active dataset indicator */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/60 rounded-xl px-3.5 py-2 text-xs text-slate-300 font-semibold shadow-md">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Using AGMARKNET {datasetMode === "uploaded" ? "Upload" : "Demo"} ({recordCount.toLocaleString()} records)</span>
            </div>
          </div>
        </div>
      </div>

      {isForecastReady ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => (
              <KPICard key={kpi.title} {...kpi} index={i} />
            ))}
          </div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Forecast Card */}
            <div className="lg:col-span-1">
              <div className="mb-3 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-emerald-500" />
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                  Featured Forecast
                </h2>
              </div>
              {featuredForecast ? (
                <ForecastCard {...featuredForecast} />
              ) : (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center text-slate-500 text-sm h-[200px] flex items-center justify-center">
                  No forecasts available for current active dataset
                </div>
              )}
            </div>

            {/* Risk Alerts */}
            <div className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-red-500" />
                  <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                    Risk Alerts
                  </h2>
                  <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                    {riskAlerts.filter((a) => a.severity === "high").length} High
                  </span>
                </div>
                <a href="/dashboard/risk-alerts" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
                  View all →
                </a>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {riskAlerts.slice(0, 4).map((alert) => (
                  <RiskAlertCard key={alert.id} alert={alert} compact />
                ))}
                {riskAlerts.length === 0 && (
                  <div className="col-span-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center text-slate-500 text-sm">
                    No active risk alerts detected in the current dataset
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-violet-500" />
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                AI Recommendations
              </h2>
              <Brain className="w-4 h-4 text-violet-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aiRecommendations.map((rec) => (
                <AIRecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="py-4">
          <ReadinessWarningCard readiness={readiness} moduleName="Executive Decision Forecasting" />
        </div>
      )}
    </div>
  );
}
