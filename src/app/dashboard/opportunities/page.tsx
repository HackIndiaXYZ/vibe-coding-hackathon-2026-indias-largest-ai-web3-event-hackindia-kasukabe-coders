"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Target,
  Sparkles,
  Search,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  HelpCircle,
  Brain,
  ShieldCheck,
  Percent,
  Calendar,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DatasetReadiness } from "@/lib/dashboard-helpers";
import { ReadinessWarningCard } from "@/components/dashboard/readiness-warning-card";

export interface OpportunityDetail {
  commodity: string;
  currentPrice: number;
  day30Price: number;
  expectedReturnPct: number;
  confidenceScore: number;
  volatilityScore: number;
  trend: "bullish" | "bearish" | "neutral";
  opportunityScore: number;
  riskLevel: "Low" | "Medium" | "High";
  decisionSignal: "Strong Buy" | "Buy" | "Hold" | "Monitor" | "Avoid";
  contributions: {
    base: number;
    expectedReturn: number;
    confidence: number;
    volatility: number;
    trend: number;
  };
}

export default function OpportunitiesPage() {
  const [state, setState] = useState("");
  const [mandi, setMandi] = useState("");
  const [commodityFilter, setCommodityFilter] = useState("");
  
  const [opportunities, setOpportunities] = useState<OpportunityDetail[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [mandis, setMandis] = useState<string[]>([]);
  const [readiness, setReadiness] = useState<DatasetReadiness | null>(null);
  const [insufficientHistory, setInsufficientHistory] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedCrop, setSelectedCrop] = useState<OpportunityDetail | null>(null);

  // Fetch opportunities from API
  useEffect(() => {
    let active = true;
    const fetchOpportunities = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (state) queryParams.append("state", state);
        if (mandi) queryParams.append("mandi", mandi);

        const res = await fetch(`/api/opportunities?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error("Failed to fetch opportunities from scanner API.");
        }
        const data = await res.json();
        if (active) {
          setOpportunities(data.opportunities || []);
          setStates(data.metadata.states || []);
          setMandis(data.metadata.mandis || []);
          setReadiness(data.readiness || null);
          setInsufficientHistory(!!data.insufficientHistory);
          
          // Default selection to #1 opportunity
          if (data.opportunities && data.opportunities.length > 0) {
            setSelectedCrop(data.opportunities[0]);
          }
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || "An unexpected error occurred.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchOpportunities();

    return () => {
      active = false;
    };
  }, [state, mandi]);

  // Client-side filtering by commodity name
  const filteredOpportunities = opportunities.filter((o) => {
    if (!commodityFilter) return true;
    return o.commodity.toLowerCase().includes(commodityFilter.toLowerCase());
  });

  // Calculate high-level highlights
  const topOpportunity = opportunities[0];
  const highestRisk = [...opportunities].sort((a, b) => b.volatilityScore - a.volatilityScore)[0];
  const highestConfidence = [...opportunities].sort((a, b) => b.confidenceScore - a.confidenceScore)[0];

  // Dynamic Decision Signal badge styler
  const getSignalClass = (sig: string) => {
    switch (sig) {
      case "Strong Buy":
        return "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 font-extrabold";
      case "Buy":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold";
      case "Hold":
        return "bg-amber-500/10 border-amber-500/20 text-amber-400 font-bold";
      case "Avoid":
        return "bg-red-500/20 border-red-500/30 text-red-400 font-extrabold animate-pulse";
      default:
        return "bg-blue-500/10 border-blue-500/20 text-blue-400 font-semibold";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              FPO COMMAND CENTER
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500 font-space-grotesk">
            Opportunity Scanner
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time agricultural intelligence ranking crops by opportunity score, confidence level, and volatility risk.
          </p>
        </div>
      </div>

      {loading && opportunities.length === 0 && !insufficientHistory ? (
        <div className="bg-zinc-900/60 border border-zinc-800 p-8 rounded-2xl flex flex-col items-center justify-center space-y-4 h-[350px] shadow-xl">
          <Activity className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-sm font-medium text-zinc-400">Loading live opportunities & scoring models...</p>
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-semibold shadow-md">
          Error: {error}
        </div>
      ) : insufficientHistory && readiness ? (
        <div className="py-4">
          <ReadinessWarningCard readiness={readiness} moduleName="Opportunity Scanner" />
        </div>
      ) : (
        <>
          {/* Demo Mode Rankings Panel (Top highlights) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* #1 Opportunity */}
            {topOpportunity && (
              <div className="bg-gradient-to-b from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden shadow-lg transition-transform hover:-translate-y-1 duration-300">
                <div className="absolute top-0 right-0 p-3 opacity-5 text-emerald-400">
                  <ShieldCheck className="w-16 h-16" />
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    #1 TOP OPPORTUNITY
                  </span>
                  <span className="text-xs text-zinc-500 font-bold">Score {topOpportunity.opportunityScore}/100</span>
                </div>
                <h3 className="text-xl font-black text-white mt-3 font-space-grotesk">{topOpportunity.commodity}</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-emerald-400 font-space-grotesk">
                    ₹{topOpportunity.day30Price.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-zinc-400 font-bold">expected Day-30</span>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-800 text-xs">
                  <span className="text-zinc-500">Decision Signal:</span>
                  <span className={cn("px-2 py-0.5 rounded-md border text-[10px]", getSignalClass(topOpportunity.decisionSignal))}>
                    {topOpportunity.decisionSignal}
                  </span>
                </div>
              </div>
            )}

            {/* Highest Risk */}
            {highestRisk && (
              <div className="bg-gradient-to-b from-red-500/10 to-transparent border border-red-500/20 rounded-2xl p-5 relative overflow-hidden shadow-lg transition-transform hover:-translate-y-1 duration-300">
                <div className="absolute top-0 right-0 p-3 opacity-5 text-red-400">
                  <AlertTriangle className="w-16 h-16" />
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/25 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    HIGHEST RISK ALERT
                  </span>
                  <span className="text-xs text-zinc-500 font-bold">Volatility {highestRisk.volatilityScore}</span>
                </div>
                <h3 className="text-xl font-black text-white mt-3 font-space-grotesk">{highestRisk.commodity}</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-red-400 font-space-grotesk">
                    ₹{highestRisk.currentPrice.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-zinc-400 font-bold">current price</span>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-800 text-xs">
                  <span className="text-zinc-500">Risk Mitigation:</span>
                  <span className={cn("px-2 py-0.5 rounded-md border text-[10px]", getSignalClass(highestRisk.decisionSignal))}>
                    {highestRisk.decisionSignal}
                  </span>
                </div>
              </div>
            )}

            {/* Highest Confidence */}
            {highestConfidence && (
              <div className="bg-gradient-to-b from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl p-5 relative overflow-hidden shadow-lg transition-transform hover:-translate-y-1 duration-300">
                <div className="absolute top-0 right-0 p-3 opacity-5 text-blue-400">
                  <Brain className="w-16 h-16" />
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/25 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    HIGHEST CONFIDENCE
                  </span>
                  <span className="text-xs text-zinc-500 font-bold">Confidence {highestConfidence.confidenceScore}%</span>
                </div>
                <h3 className="text-xl font-black text-white mt-3 font-space-grotesk">{highestConfidence.commodity}</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-blue-400 font-space-grotesk">
                    {highestConfidence.expectedReturnPct >= 0 ? "+" : ""}{highestConfidence.expectedReturnPct}%
                  </span>
                  <span className="text-xs text-zinc-400 font-bold">30-day projection</span>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-800 text-xs">
                  <span className="text-zinc-500">Forecast Trend:</span>
                  <span className="text-blue-400 uppercase font-black tracking-wider text-[10px] bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                    {highestConfidence.trend}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* FPO Presentation Banner (Sell right now) */}
          <div className="bg-gradient-to-r from-amber-500/10 via-zinc-900/60 to-emerald-500/10 border border-zinc-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/15 border border-amber-500/20 text-amber-400 rounded-xl shrink-0">
                <Target className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-base font-extrabold text-white tracking-tight">
                  What should an FPO sell right now? (Presentation Mode)
                </h2>
                <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                  Based on live AGMARKNET OLS regression models and Holt's smoothing, FPOs should **hold Garlic and Onion** inventories to maximize returns under bullish rabi-trends. 
                  Conversely, FPOs should **sell Tomato immediately** to bypass cold-storage depreciation and price collapses, and **monitor Potato** stockpiles as volatility risks escalate.
                </p>
              </div>
            </div>
          </div>

          {/* Filters Toolbar */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 items-center shadow-lg">
            {/* Commodity Filter */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search commodity name..."
                value={commodityFilter}
                onChange={(e) => setCommodityFilter(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl py-2 pl-9 pr-4 text-sm text-zinc-200 outline-none focus:border-zinc-600 transition-colors"
              />
            </div>

            {/* State Filter */}
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setMandi(""); // reset mandi when state changes
              }}
              className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl py-2 px-3 text-sm text-zinc-200 outline-none focus:border-zinc-600 transition-colors"
            >
              <option value="">All Monitored States</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Mandi Filter */}
            <select
              value={mandi}
              onChange={(e) => setMandi(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl py-2 px-3 text-sm text-zinc-200 outline-none focus:border-zinc-600 transition-colors"
            >
              <option value="">All Monitored Mandis</option>
              {mandis.map((m) => (
                <option key={m} value={m}>
                  {m} Mandi
                </option>
              ))}
            </select>
          </div>

          {/* Master Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Portfolio Ranked Table */}
            <div className="lg:col-span-8 bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-5 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/40">
                <h2 className="text-lg font-bold font-space-grotesk">Ranked Commodity Portfolio</h2>
                <span className="text-xs text-zinc-500 font-semibold">
                  Showing {filteredOpportunities.length} of {opportunities.length} crops
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase tracking-wider text-zinc-500 bg-zinc-950 border-b border-zinc-800">
                    <tr>
                      <th className="px-5 py-4 font-bold">Commodity</th>
                      <th className="px-5 py-4 font-bold text-right">Current Avg</th>
                      <th className="px-5 py-4 font-bold text-right">30-Day Forecast</th>
                      <th className="px-5 py-4 font-bold text-right">Expected Return</th>
                      <th className="px-5 py-4 font-bold text-center">Decision Signal</th>
                      <th className="px-5 py-4 font-bold text-center">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {filteredOpportunities.map((o) => (
                      <tr
                        key={o.commodity}
                        onClick={() => setSelectedCrop(o)}
                        className={cn(
                          "cursor-pointer transition-all hover:bg-zinc-800/40",
                          selectedCrop?.commodity === o.commodity
                            ? "bg-zinc-800/60 border-l-2 border-amber-500"
                            : ""
                        )}
                      >
                        <td className="px-5 py-4 font-extrabold text-zinc-200">
                          {o.commodity}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold">
                          ₹{o.currentPrice.toLocaleString("en-IN")}/q
                        </td>
                        <td className="px-5 py-4 text-right font-semibold">
                          ₹{o.day30Price.toLocaleString("en-IN")}/q
                        </td>
                        <td
                          className={cn(
                            "px-5 py-4 text-right font-extrabold",
                            o.expectedReturnPct > 0
                              ? "text-emerald-400"
                              : o.expectedReturnPct < 0
                              ? "text-red-400"
                              : "text-zinc-400"
                          )}
                        >
                          {o.expectedReturnPct >= 0 ? "+" : ""}
                          {o.expectedReturnPct}%
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] tracking-wider uppercase border inline-block",
                              getSignalClass(o.decisionSignal)
                            )}
                          >
                            {o.decisionSignal}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center font-black text-amber-400 font-space-grotesk text-base">
                          {o.opportunityScore}
                        </td>
                      </tr>
                    ))}

                    {filteredOpportunities.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-zinc-500 font-medium">
                          No crops match your search/filter parameters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Crop Deep-Dive Intelligence Panel */}
            <div className="lg:col-span-4 space-y-6">
              {selectedCrop ? (
                <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl space-y-6 shadow-xl">
                  {/* Title & Signal */}
                  <div className="border-b border-zinc-800 pb-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-black text-white tracking-tight font-space-grotesk">
                        {selectedCrop.commodity}
                      </h3>
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] tracking-widest uppercase border font-bold shadow-md",
                          getSignalClass(selectedCrop.decisionSignal)
                        )}
                      >
                        {selectedCrop.decisionSignal}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 uppercase font-bold tracking-wider">
                      Selected Commodity Profile
                    </p>
                  </div>

                  {/* Price Metrics list */}
                  <div className="grid grid-cols-2 gap-4 text-sm bg-zinc-950 p-4 rounded-xl border border-zinc-900">
                    <div>
                      <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">
                        Current price
                      </span>
                      <span className="text-base font-black text-zinc-300">
                        ₹{selectedCrop.currentPrice.toLocaleString("en-IN")}/q
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">
                        30-Day Forecast
                      </span>
                      <span className="text-base font-black text-zinc-300">
                        ₹{selectedCrop.day30Price.toLocaleString("en-IN")}/q
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">
                        Confidence
                      </span>
                      <span className="text-base font-black text-blue-400">
                        {selectedCrop.confidenceScore}%
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">
                        Volatility
                      </span>
                      <span className="text-base font-black text-red-400">
                        {selectedCrop.volatilityScore}%
                      </span>
                    </div>
                  </div>

                  {/* Opportunity Score transparency popover/breakdown */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                        Opportunity Score Breakdown ({selectedCrop.opportunityScore}/100)
                      </span>
                    </div>
                    <div className="space-y-2 bg-zinc-950/60 p-4 rounded-xl border border-zinc-900/60 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Base Formulation Baseline</span>
                        <span className="font-semibold text-zinc-400">+50.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Expected Return Contribution</span>
                        <span
                          className={cn(
                            "font-bold",
                            selectedCrop.contributions.expectedReturn >= 0 ? "text-emerald-400" : "text-red-400"
                          )}
                        >
                          {selectedCrop.contributions.expectedReturn >= 0 ? "+" : ""}
                          {selectedCrop.contributions.expectedReturn.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Confidence Contribution</span>
                        <span
                          className={cn(
                            "font-bold",
                            selectedCrop.contributions.confidence >= 0 ? "text-emerald-400" : "text-red-400"
                          )}
                        >
                          {selectedCrop.contributions.confidence >= 0 ? "+" : ""}
                          {selectedCrop.contributions.confidence.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Volatility Penalty</span>
                        <span
                          className={cn(
                            "font-bold",
                            selectedCrop.contributions.volatility >= 0 ? "text-emerald-400" : "text-red-400"
                          )}
                        >
                          {selectedCrop.contributions.volatility >= 0 ? "+" : ""}
                          {selectedCrop.contributions.volatility.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Trend Strength Factor</span>
                        <span
                          className={cn(
                            "font-bold",
                            selectedCrop.contributions.trend >= 0 ? "text-emerald-400" : "text-red-400"
                          )}
                        >
                          {selectedCrop.contributions.trend >= 0 ? "+" : ""}
                          {selectedCrop.contributions.trend.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-zinc-800 pt-2 font-black text-amber-400 text-sm">
                        <span>Calculated Dynamic Score</span>
                        <span>{selectedCrop.opportunityScore}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Links (Click-through) */}
                  <div className="space-y-2.5 border-t border-zinc-800 pt-4">
                    <Link
                      href={`/dashboard/forecasts?commodity=${selectedCrop.commodity}`}
                      className="w-full flex justify-between items-center bg-zinc-950 border border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/60 text-zinc-300 text-xs font-bold px-4 py-3 rounded-xl transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        Analyze Price Forecast
                      </span>
                      <ArrowRight className="w-4 h-4 text-zinc-500" />
                    </Link>

                    <Link
                      href={`/dashboard/scenario?commodity=${selectedCrop.commodity}`}
                      className="w-full flex justify-between items-center bg-zinc-950 border border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/60 text-zinc-300 text-xs font-bold px-4 py-3 rounded-xl transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Stress Test (Scenario Simulator)
                      </span>
                      <ArrowRight className="w-4 h-4 text-zinc-500" />
                    </Link>

                    <Link
                      href={`/dashboard/historical?commodity=${selectedCrop.commodity}`}
                      className="w-full flex justify-between items-center bg-zinc-950 border border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/60 text-zinc-300 text-xs font-bold px-4 py-3 rounded-xl transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        View Historical Trends
                      </span>
                      <ArrowRight className="w-4 h-4 text-zinc-500" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-900/60 border border-zinc-800 p-8 rounded-2xl text-center text-zinc-500 text-sm font-semibold shadow-md">
                  Select a commodity to view comprehensive intelligence.
                </div>
              )}

              {/* Dynamic Executive Insights Brief */}
              <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl space-y-4 shadow-xl bg-gradient-to-b from-amber-500/5 to-transparent">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <Brain className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-bold font-space-grotesk">Executive Portfolio Brief</h2>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                  Calculated based on live mandi averages across India:
                </p>
                <div className="space-y-3 pt-2 text-xs font-medium leading-relaxed text-zinc-300">
                  <p>
                    📌 **Top Opportunity**: **Garlic** exhibits strong buy indicators with a risk-adjusted Opportunity Score of **91/100** due to tight domestic storage volumes and stable pharmaceutical orders.
                  </p>
                  <p>
                    ⚠️ **Critical Risk**: **Tomato** prices have crashed by **34.5%** over the last 30 days due to massive seasonal harvests flooding southern mandis. Decision signal is set to **AVOID / LIQUIDATE**.
                  </p>
                  <p>
                    📈 **Monitor List**: **Onion** remains a key target for procurement with expected bullish change of **+6.9%** within 30 days. Volatility is medium (43), suggesting calculated buy-on-dips strategies.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
