"use client";

import { useState, useEffect } from "react";
import type { AIInsight } from "@/types";
import type { DatasetReadiness } from "@/lib/dashboard-helpers";
import { ReadinessWarningCard } from "@/components/dashboard/readiness-warning-card";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  ShoppingCart,
  PackageCheck,
  Zap,
  Clock,
  MapPin,
  BarChart3,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

function ScoreGauge({
  score,
  label,
  type,
}: {
  score: number;
  label: string;
  type: "opportunity" | "risk";
}) {
  const isOpportunity = type === "opportunity";
  const color =
    isOpportunity
      ? score >= 70
        ? "text-emerald-400"
        : score >= 40
        ? "text-amber-400"
        : "text-red-400"
      : score >= 70
      ? "text-red-400"
      : score >= 40
      ? "text-amber-400"
      : "text-emerald-400";

  const barColor =
    isOpportunity
      ? score >= 70
        ? "bg-emerald-500"
        : score >= 40
        ? "bg-amber-500"
        : "bg-red-500"
      : score >= 70
      ? "bg-red-500"
      : score >= 40
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-slate-400">{label}</span>
        <span className={cn("text-sm font-bold", color)}>{score}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", barColor)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function TrendBadge({ trend, score }: { trend: string; score: number }) {
  const isRising = trend === "Rising";
  const isFalling = trend === "Falling";
  return (
    <div className={cn(
      "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
      isRising ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" :
      isFalling ? "bg-red-500/15 text-red-400 border border-red-500/20" :
      "bg-slate-700 text-slate-400 border border-slate-600"
    )}>
      {isRising ? <TrendingUp className="w-3 h-3" /> :
       isFalling ? <TrendingDown className="w-3 h-3" /> :
       <Minus className="w-3 h-3" />}
      {trend} ({score})
    </div>
  );
}

function RecommendationBadge({ rec }: { rec: string }) {
  const isSell = rec.toLowerCase().includes("sell") || rec.toLowerCase().includes("avoid");
  const isBuy = rec.toLowerCase().includes("buy");

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl border",
      isSell && !isBuy ? "bg-rose-500/15 text-rose-400 border-rose-500/20" :
      isBuy ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" :
      "bg-amber-500/15 text-amber-400 border border-amber-500/20"
    )}>
      {isSell && !isBuy ? <TrendingDown className="w-3.5 h-3.5" /> :
       isBuy ? <ShoppingCart className="w-3.5 h-3.5" /> :
       <PackageCheck className="w-3.5 h-3.5" />}
      {rec}
    </div>
  );
}

function TagChip({ tag }: { tag: string }) {
  const isBullish = tag.toLowerCase().includes("bullish") || tag.toLowerCase().includes("buy") || tag.toLowerCase().includes("demand");
  const isBearish = tag.toLowerCase().includes("bearish") || tag.toLowerCase().includes("risk") || tag.toLowerCase().includes("crash");

  return (
    <span className={cn(
      "text-[10px] font-semibold px-2 py-0.5 rounded-full",
      isBullish ? "bg-emerald-500/10 text-emerald-400" :
      isBearish ? "bg-red-500/10 text-red-400" :
      "bg-slate-700 text-slate-400"
    )}>
      {tag}
    </span>
  );
}

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<AIInsight | null>(null);
  const [readiness, setReadiness] = useState<DatasetReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchInsights = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/dashboard/summary");
        if (!res.ok) {
          throw new Error("Failed to load insights from dashboard summary API.");
        }
        const data = await res.json();
        if (active) {
          setReadiness(data.readiness || null);
          const list = data.aiInsights || [];
          setInsights(list);
          if (list.length > 0) {
            setSelectedInsight(list[0]);
          }
        }
      } catch (e: any) {
        if (active) {
          setError(e.message || "An error occurred.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchInsights();

    return () => {
      active = false;
    };
  }, []);

  const isReady = readiness ? readiness.status === "ready" : true;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-space-grotesk">AI Insights</h1>
          <p className="text-slate-400 text-sm mt-1">
            Deep market intelligence generated by MandiMind&apos;s AI engine
          </p>
        </div>
        <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-semibold px-3 py-2 rounded-xl">
          <Brain className="w-4 h-4" />
          AI Engine v2.4
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-semibold shadow-md">
          Error: {error}
        </div>
      )}

      {!isReady && readiness ? (
        <div className="py-4">
          <ReadinessWarningCard readiness={readiness} moduleName="AI Market Intelligence Insights" />
        </div>
      ) : (
        <>
          {loading && insights.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800/80 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
              <p className="text-sm font-medium text-slate-400">Synthesizing market trend metrics...</p>
            </div>
          ) : (
            <>
              {/* Cards grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {insights.map((insight) => (
                  <div
                    key={insight.commodity}
                    onClick={() => setSelectedInsight(insight)}
                    className={cn(
                      "rounded-2xl border p-5 cursor-pointer transition-all duration-200 card-hover",
                      selectedInsight?.commodity === insight.commodity
                        ? "bg-gradient-to-br from-violet-950/40 to-slate-800/60 border-violet-500/40 shadow-lg shadow-violet-500/10"
                        : "bg-slate-800/60 border-slate-700/50 hover:border-slate-600"
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-base font-bold text-white">{insight.commodity}</h3>
                          <RecommendationBadge rec={insight.recommendation} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <MapPin className="w-3 h-3" />
                          <span>{insight.region}</span>
                          <span>·</span>
                          <Clock className="w-3 h-3" />
                          <span>{insight.horizon}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-slate-500 mb-1 font-medium">Price Target</div>
                        <div className="text-sm font-bold text-white font-space-grotesk">{insight.priceTarget}</div>
                      </div>
                    </div>

                    {/* Trend badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <BarChart3 className="w-3.5 h-3.5" />
                        Demand:
                      </div>
                      <TrendBadge trend={insight.demandTrend} score={insight.demandScore} />
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        Supply:
                      </div>
                      <TrendBadge trend={insight.supplyTrend} score={insight.supplyScore} />
                    </div>

                    {/* Score bars */}
                    <div className="space-y-3 mb-4">
                      <ScoreGauge score={insight.opportunityScore} label="Opportunity Score" type="opportunity" />
                      <ScoreGauge score={insight.riskScore} label="Risk Score" type="risk" />
                    </div>

                    {/* Insight text */}
                    <p className="text-sm text-slate-400 leading-relaxed mb-4 line-clamp-2">
                      {insight.insight}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {insight.tags.map((tag) => <TagChip key={tag} tag={tag} />)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected insight detail */}
              {selectedInsight && (
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-violet-500/20 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5 text-violet-400" />
                    <h2 className="text-base font-semibold text-white">
                      Full Analysis — {selectedInsight.commodity} ({selectedInsight.region})
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                        AI Narrative
                      </h3>
                      <p className="text-slate-300 leading-relaxed text-sm">{selectedInsight.insight}</p>

                      <div className="mt-4 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                        <div className="flex items-start gap-3">
                          <Zap className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm font-semibold text-white mb-1">
                              Recommendation: {selectedInsight.recommendation}
                            </div>
                            <div className="text-xs text-slate-400 font-semibold">
                              Price Target: {selectedInsight.priceTarget} · Horizon: {selectedInsight.horizon}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Scores</h3>
                        <div className="space-y-3">
                          <ScoreGauge score={selectedInsight.opportunityScore} label="Opportunity" type="opportunity" />
                          <ScoreGauge score={selectedInsight.riskScore} label="Risk" type="risk" />
                          <ScoreGauge score={selectedInsight.demandScore} label="Demand" type="opportunity" />
                          <ScoreGauge score={selectedInsight.supplyScore} label="Supply" type="risk" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
