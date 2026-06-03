"use client";

import { useState, useEffect, useCallback } from "react";
import { ForecastChart } from "@/components/charts/forecast-chart";
import type { DatasetReadiness } from "@/lib/dashboard-helpers";
import { ReadinessWarningCard } from "@/components/dashboard/readiness-warning-card";

import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Brain,
  ChevronDown,
  RefreshCw,
  Database,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ForecastResult } from "@/lib/forecast";

// ─── Static metrics ───────────────────────────────────────────────────────────

const COMMODITY_LIST = ["Onion", "Tomato", "Potato", "Garlic"];

const metaMetrics = [
  { label: "Forecast Method", value: "Holt's + OLS", color: "text-violet-400" },
  { label: "Mandis in Dataset", value: "12", color: "text-blue-400" },
  { label: "CSV Records", value: "312", color: "text-amber-400" },
  { label: "Horizon", value: "30 Days", color: "text-emerald-400" },
];

// ─── Volatility chip ──────────────────────────────────────────────────────────

function VolatilityChip({ score }: { score: number }) {
  const label = score >= 65 ? "High" : score >= 35 ? "Medium" : "Low";
  const cls =
    score >= 65
      ? "bg-red-500/10 border-red-500/20 text-red-400"
      : score >= 35
      ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
  return (
    <div className={cn("flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border", cls)}>
      <Activity className="w-3 h-3" />
      {label} Volatility ({score})
    </div>
  );
}

// ─── Trend chip ───────────────────────────────────────────────────────────────

function TrendChip({ trend }: { trend: string }) {
  if (trend === "bullish")
    return (
      <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
        <ArrowUpRight className="w-3 h-3" /> BULLISH
      </div>
    );
  if (trend === "bearish")
    return (
      <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
        <ArrowDownRight className="w-3 h-3" /> BEARISH
      </div>
    );
  return (
    <div className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-slate-700 border border-slate-600 text-slate-400">
      <Minus className="w-3 h-3" /> NEUTRAL
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ForecastsPage() {
  const [selectedCommodity, setSelectedCommodity] = useState("Onion");
  const [days, setDays] = useState("30");
  const [forecastData, setForecastData] = useState<ForecastResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<"csv" | "mock">("mock");
  const [error, setError] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<DatasetReadiness | null>(null);

  useEffect(() => {
    const checkReadiness = async () => {
      try {
        const res = await fetch("/api/dashboard/summary");
        if (res.ok) {
          const data = await res.json();
          setReadiness(data.readiness || null);
        }
      } catch (e) {
        console.error("Failed to check readiness", e);
      }
    };
    checkReadiness();
  }, []);

  const fetchForecast = useCallback(async (commodity: string, horizon: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/forecast?commodity=${encodeURIComponent(commodity)}&days=${horizon}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Forecast failed");
      }
      const data: ForecastResult = await res.json();
      setForecastData(data);
      setDataSource("csv");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load forecast");
      setForecastData(null);
      setDataSource("mock");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForecast(selectedCommodity, days);
  }, [selectedCommodity, days, fetchForecast]);

  // Derived values
  const isBullish = forecastData?.trend === "bullish";
  const isBearish = forecastData?.trend === "bearish";
  const pctChange = forecastData?.summary.priceChangePct ?? 0;
  const currentPrice = forecastData?.currentPrice ?? 0;
  const confidence = forecastData?.confidence ?? 0;

  const isReady = readiness ? readiness.status === "ready" : true;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-space-grotesk">Market Forecasts</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-400 text-sm">Statistical price prediction with confidence intervals</p>
            {isReady && (
              <div className={cn(
                "hidden sm:flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                dataSource === "csv"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-slate-700 border border-slate-600 text-slate-500"
              )}>
                <Database className="w-2.5 h-2.5" />
                {dataSource === "csv" ? "AGMARKNET CSV" : "Mock Data"}
              </div>
            )}
          </div>
        </div>
      </div>

      {!isReady && readiness ? (
        <div className="py-4">
          <ReadinessWarningCard readiness={readiness} moduleName="Price Forecasting Models" />
        </div>
      ) : (
        <>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              id="forecast-commodity-select"
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl px-4 py-2.5 pr-9 outline-none focus:border-emerald-500 cursor-pointer"
            >
              {COMMODITY_LIST.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>

          <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1">
            {["7", "14", "30"].map((t) => (
              <button
                key={t}
                id={`timeframe-${t}`}
                onClick={() => setDays(t)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  days === t ? "bg-emerald-500 text-white shadow-sm" : "text-slate-400 hover:text-white"
                )}
              >
                {t}D
              </button>
            ))}
          </div>
        </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metaMetrics.map((m) => (
          <div key={m.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center">
            <div className={cn("text-xl font-bold font-space-grotesk", m.color)}>{m.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-xs text-amber-400 flex items-center gap-2">
          <Database className="w-4 h-4 flex-shrink-0" />
          {error} — showing mock data instead.
        </div>
      )}

      {/* Main chart card */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-lg font-semibold text-white font-space-grotesk">
                {selectedCommodity} Price Forecast
              </h2>
              {forecastData && <TrendChip trend={forecastData.trend} />}
              {forecastData && <VolatilityChip score={forecastData.volatilityScore} />}
            </div>
            <p className="text-xs text-slate-400">
              {dataSource === "csv"
                ? `${forecastData?.dataPoints ?? 0} CSV records · Base date: ${forecastData?.baseDate ?? "—"} · ${days}-day horizon`
                : "Historical actual vs AI-forecasted prices with confidence interval band"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isLoading && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Computing forecast...
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="w-6 h-0.5 bg-blue-400 inline-block" />
              <span className="text-slate-400 text-xs">Actual</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-6 inline-block border-t-2 border-dashed border-emerald-400" />
              <span className="text-slate-400 text-xs">Forecast</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="w-4 h-4 rounded bg-emerald-500/20 inline-block" />
              <span className="text-slate-400 text-xs">CI band</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="h-[380px] bg-slate-700/20 rounded-xl animate-pulse flex items-center justify-center">
            <span className="text-slate-600 text-sm">Running forecast model...</span>
          </div>
        ) : (
          <ForecastChart
            commodity={selectedCommodity}
            data={forecastData?.chartData}
            todayLabel={forecastData ? undefined : "Jun 1"}
          />
        )}
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Price Summary */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-semibold text-slate-300">Price Summary</span>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-5 bg-slate-700 rounded animate-pulse" />
              ))}
            </div>
          ) : forecastData ? (
            <div className="space-y-3">
              {[
                { label: "Current Price", value: `₹${currentPrice.toLocaleString("en-IN")}/q`, color: "text-white" },
                { label: "30-Day Forecast", value: `₹${forecastData.summary.day30Price.toLocaleString("en-IN")}/q`, color: isBullish ? "text-emerald-400" : isBearish ? "text-red-400" : "text-slate-300" },
                { label: "Expected Change", value: `${pctChange >= 0 ? "+" : ""}${pctChange}%`, color: pctChange >= 0 ? "text-emerald-400" : "text-red-400" },
                null,
                { label: "Forecast High", value: `₹${forecastData.summary.expectedHigh.toLocaleString("en-IN")}`, color: "text-blue-400" },
                { label: "Forecast Low", value: `₹${forecastData.summary.expectedLow.toLocaleString("en-IN")}`, color: "text-amber-400" },
                { label: "Forecast Avg", value: `₹${forecastData.summary.expectedAvg.toLocaleString("en-IN")}`, color: "text-slate-300" },
              ].map((item, i) =>
                item === null ? (
                  <div key={i} className="h-px bg-slate-700" />
                ) : (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{item.label}</span>
                    <span className={cn("text-sm font-semibold", item.color)}>{item.value}</span>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No forecast data available.</p>
          )}
        </div>

        {/* Model Details */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-violet-400" />
            <span className="text-sm font-semibold text-slate-300">Model Details</span>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 bg-slate-700 rounded animate-pulse" />
              ))}
            </div>
          ) : forecastData ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Confidence</span>
                <span className={cn("text-sm font-semibold",
                  confidence >= 80 ? "text-emerald-400" :
                  confidence >= 60 ? "text-amber-400" : "text-red-400"
                )}>{confidence}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full">
                <div
                  className={cn("h-full rounded-full transition-all",
                    confidence >= 80 ? "bg-gradient-to-r from-emerald-500 to-green-400" :
                    confidence >= 60 ? "bg-gradient-to-r from-amber-500 to-yellow-400" :
                    "bg-gradient-to-r from-red-500 to-orange-400"
                  )}
                  style={{ width: `${confidence}%` }}
                />
              </div>
              {[
                { label: "Algorithm", value: "Holt's + OLS Blend" },
                { label: "Data Points", value: `${forecastData.dataPoints} records` },
                { label: "Base Date", value: forecastData.baseDate },
                { label: "Horizon", value: `${days} days` },
                { label: "Volatility", value: `${forecastData.volatilityScore}/100` },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">{row.label}</span>
                  <span className="text-xs text-slate-300">{row.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No model data available.</p>
          )}
        </div>

        {/* Key Drivers */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-semibold text-slate-300">Statistical Signals</span>
          </div>
          <div className="space-y-2.5">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 bg-slate-700 rounded animate-pulse" />
              ))
            ) : forecastData ? [
              {
                factor: "Historical Trend",
                impact: forecastData.trend === "bullish" ? "+" : forecastData.trend === "bearish" ? "-" : "~",
                weight: Math.min(95, forecastData.confidence + 5),
              },
              {
                factor: "Price Momentum",
                impact: forecastData.summary.priceChangePct >= 0 ? "+" : "-",
                weight: Math.min(90, 50 + Math.abs(forecastData.summary.priceChangePct) * 2),
              },
              {
                factor: "Volatility (inverse)",
                impact: forecastData.volatilityScore <= 40 ? "+" : "-",
                weight: Math.max(10, 100 - forecastData.volatilityScore),
              },
              {
                factor: "Data Coverage",
                weight: Math.min(100, (forecastData.dataPoints / 26) * 100),
                impact: forecastData.dataPoints >= 20 ? "+" : "~",
              },
            ].map((driver) => (
              <div key={driver.factor}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-400">{driver.factor}</span>
                  <span className={cn("text-xs font-bold",
                    driver.impact === "+" ? "text-emerald-400" :
                    driver.impact === "-" ? "text-red-400" : "text-slate-400"
                  )}>{driver.impact}</span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full">
                  <div
                    className={cn("h-full rounded-full",
                      driver.impact === "+" ? "bg-emerald-500" :
                      driver.impact === "-" ? "bg-red-500" : "bg-slate-500"
                    )}
                    style={{ width: `${driver.weight}%` }}
                  />
                </div>
              </div>
            )) : null}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
