"use client";

import { useState, useEffect } from "react";
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
  Sliders,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowRight,
  Sparkles,
  Info,
  Play,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DatasetReadiness } from "@/lib/dashboard-helpers";
import { ReadinessWarningCard } from "@/components/dashboard/readiness-warning-card";

// Redefining interface locally to avoid client-side imports of server files
export interface ScenarioResult {
  commodity: string;
  mandi: string | null;
  baselinePrice: number;
  baselineDay30Price: number;
  baselineTrend: string;
  baselineOpportunityScore: number;
  baselineConfidence: number;
  baselineRiskLevel: "Low" | "Medium" | "High";

  adjustedPrice: number;
  adjustedDay30Price: number;
  adjustedTrend: "bullish" | "bearish" | "neutral";
  adjustedOpportunityScore: number;
  adjustedConfidence: number;
  adjustedVolatility: number;
  adjustedRiskLevel: "Low" | "Medium" | "High";

  arrivalImpactPct: number;
  demandImpactPct: number;
  priceImpactPct: number;
  oppScoreChange: number;
  confidenceAdjustment: number;

  chartData: Array<{
    date: string;
    baseline: number;
    adjusted: number;
  }>;

  recommendation: {
    action: "BUY" | "SELL" | "HOLD" | "MONITOR";
    headline: string;
    detail: string;
  };
}

const COMMODITIES = ["Onion", "Tomato", "Potato", "Garlic"];

// Static Mandi mapping to avoid querying database on the client
const MANDI_MAPPING: Record<string, string[]> = {
  Onion: ["Lasalgaon", "Pimpalgaon", "Kurnool"],
  Tomato: ["Kolar", "Bangalore APMC", "Pune APMC"],
  Potato: ["Agra", "Kanpur", "Patna"],
  Garlic: ["Neemuch", "Indore", "Kota"],
};

export default function ScenarioPage() {
  const [commodity, setCommodity] = useState("Onion");
  const [mandi, setMandi] = useState("");
  const [arrivalChange, setArrivalChange] = useState(0);
  const [demandChange, setDemandChange] = useState(0);
  
  const [simulation, setSimulation] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(false);
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

  // Mandis matching selected commodity
  const mandiList = MANDI_MAPPING[commodity] || [];

  // Update mandis and reset mandi choice when commodity changes
  useEffect(() => {
    setMandi("");
  }, [commodity]);

  // Fetch simulation results from API
  useEffect(() => {
    let active = true;
    const fetchSimulation = async () => {
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          commodity,
          arrival: arrivalChange.toString(),
          demand: demandChange.toString(),
        });
        if (mandi) {
          queryParams.append("mandi", mandi);
        }

        const res = await fetch(`/api/scenario?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error("Failed to load scenario simulation results.");
        }
        const data = await res.json();
        if (active) {
          setSimulation(data);
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

    fetchSimulation();

    return () => {
      active = false;
    };
  }, [commodity, mandi, arrivalChange, demandChange]);

  // Pre-set Scenarios (Demo Mode)
  const applyPreset = (crop: string, arrivals: number, demand: number) => {
    setCommodity(crop);
    setArrivalChange(arrivals);
    setDemandChange(demand);
  };

  const handleReset = () => {
    setArrivalChange(0);
    setDemandChange(0);
  };

  const isReady = readiness ? readiness.status === "ready" : true;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Interactive Stress Testing
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500 font-space-grotesk">
            Market Scenario Simulator
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Simulate how hypothetical supply shortages, import surges, or demand spikes impact agricultural forecasts.
          </p>
        </div>

        {isReady && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-95 shadow-lg"
          >
            <RotateCcw className="w-4 h-4" /> Reset Controls
          </button>
        )}
      </div>

      {!isReady && readiness ? (
        <div className="py-4">
          <ReadinessWarningCard readiness={readiness} moduleName="Scenario Stress Testing Simulator" />
        </div>
      ) : (
        <>

      {/* Demo Mode Presets Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-zinc-900/60 to-violet-500/10 border border-zinc-800 rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Play className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-bold text-zinc-200">
            One-Click Presentation Presets (Demo Mode)
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => applyPreset("Onion", 25, 0)}
            className={cn(
              "px-4 py-3 rounded-xl border text-left transition-all",
              commodity === "Onion" && arrivalChange === 25 && demandChange === 0
                ? "bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-md shadow-amber-500/5"
                : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-300"
            )}
          >
            <div className="font-bold text-xs uppercase tracking-wider text-zinc-400">Onion Oversupply</div>
            <div className="text-sm font-extrabold mt-1">Arrivals +25%</div>
            <div className="text-xs text-zinc-400 mt-0.5">Bearish price shock</div>
          </button>

          <button
            onClick={() => applyPreset("Tomato", 0, 15)}
            className={cn(
              "px-4 py-3 rounded-xl border text-left transition-all",
              commodity === "Tomato" && arrivalChange === 0 && demandChange === 15
                ? "bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-md shadow-amber-500/5"
                : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-300"
            )}
          >
            <div className="font-bold text-xs uppercase tracking-wider text-zinc-400">Tomato Demand Spike</div>
            <div className="text-sm font-extrabold mt-1">Demand +15%</div>
            <div className="text-xs text-zinc-400 mt-0.5">Bullish price surge</div>
          </button>

          <button
            onClick={() => applyPreset("Garlic", -20, 0)}
            className={cn(
              "px-4 py-3 rounded-xl border text-left transition-all",
              commodity === "Garlic" && arrivalChange === -20 && demandChange === 0
                ? "bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-md shadow-amber-500/5"
                : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-300"
            )}
          >
            <div className="font-bold text-xs uppercase tracking-wider text-zinc-400">Garlic Shortage</div>
            <div className="text-sm font-extrabold mt-1">Arrivals -20%</div>
            <div className="text-xs text-zinc-400 mt-0.5">Strong price growth</div>
          </button>

          <button
            onClick={() => applyPreset("Potato", 0, -10)}
            className={cn(
              "px-4 py-3 rounded-xl border text-left transition-all",
              commodity === "Potato" && arrivalChange === 0 && demandChange === -10
                ? "bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-md shadow-amber-500/5"
                : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-300"
            )}
          >
            <div className="font-bold text-xs uppercase tracking-wider text-zinc-400">Potato Demand Drop</div>
            <div className="text-sm font-extrabold mt-1">Demand -10%</div>
            <div className="text-xs text-zinc-400 mt-0.5">Moderate decline</div>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Sliders className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold">Simulation Inputs</h2>
            </div>

            {/* Commodity Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Select Commodity
              </label>
              <div className="grid grid-cols-2 gap-2">
                {COMMODITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCommodity(c)}
                    className={cn(
                      "py-2.5 px-3 rounded-xl text-sm font-bold border transition-all active:scale-95",
                      commodity === c
                        ? "bg-zinc-800 border-zinc-700 text-amber-400 shadow-md"
                        : "bg-zinc-950 border-zinc-900 hover:border-zinc-800 text-zinc-400"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Mandi Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Mandi / Market (Optional)
              </label>
              <select
                value={mandi}
                onChange={(e) => setMandi(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-3 text-sm text-zinc-200 outline-none focus:border-zinc-700 transition-colors"
              >
                <option value="">All Mandis Combined</option>
                {mandiList.map((m) => (
                  <option key={m} value={m}>
                    {m} Mandi
                  </option>
                ))}
              </select>
            </div>

            {/* Sliders */}
            <div className="space-y-6 border-t border-zinc-800 pt-4">
              {/* Arrival Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-zinc-300">Arrivals (Supply) Change</span>
                  <span
                    className={cn(
                      "font-extrabold",
                      arrivalChange > 0
                        ? "text-red-400"
                        : arrivalChange < 0
                        ? "text-emerald-400"
                        : "text-zinc-400"
                    )}
                  >
                    {arrivalChange > 0 ? "+" : ""}
                    {arrivalChange}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="5"
                  value={arrivalChange}
                  onChange={(e) => setArrivalChange(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>-50% (Extreme Shortage)</span>
                  <span>0% (Neutral)</span>
                  <span>+50% (Glut)</span>
                </div>
              </div>

              {/* Demand Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-zinc-300">Demand Change</span>
                  <span
                    className={cn(
                      "font-extrabold",
                      demandChange > 0
                        ? "text-emerald-400"
                        : demandChange < 0
                        ? "text-red-400"
                        : "text-zinc-400"
                    )}
                  >
                    {demandChange > 0 ? "+" : ""}
                    {demandChange}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="5"
                  value={demandChange}
                  onChange={(e) => setDemandChange(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>-50% (Crushed Demand)</span>
                  <span>0% (Neutral)</span>
                  <span>+50% (Spike)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Explainability Panel */}
          {simulation && !loading && (
            <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl space-y-4 shadow-xl">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                <Info className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold">Simulation Explanation</h2>
              </div>
              <p className="text-xs text-zinc-400">
                How arrival and demand shifts propagate into simulated forecast values through agricultural price elasticity:
              </p>
              <div className="space-y-3 pt-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Arrival Impact (elasticity -0.3)</span>
                  <span className={cn(simulation.arrivalImpactPct > 0 ? "text-emerald-400 font-bold" : simulation.arrivalImpactPct < 0 ? "text-red-400 font-bold" : "text-zinc-400 font-bold")}>
                    {simulation.arrivalImpactPct > 0 ? "+" : ""}{simulation.arrivalImpactPct.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Demand Impact (elasticity +0.4)</span>
                  <span className={cn(simulation.demandImpactPct > 0 ? "text-emerald-400 font-bold" : simulation.demandImpactPct < 0 ? "text-red-400 font-bold" : "text-zinc-400 font-bold")}>
                    {simulation.demandImpactPct > 0 ? "+" : ""}{simulation.demandImpactPct.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between border-t border-zinc-800 pt-2 font-bold">
                  <span className="text-zinc-300">Net Day-30 Price Impact</span>
                  <span className={cn(simulation.priceImpactPct > 0 ? "text-emerald-400" : simulation.priceImpactPct < 0 ? "text-red-400" : "text-zinc-400")}>
                    {simulation.priceImpactPct > 0 ? "+" : ""}{simulation.priceImpactPct}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Opportunity Score Change</span>
                  <span className={cn(simulation.oppScoreChange > 0 ? "text-emerald-400 font-bold" : simulation.oppScoreChange < 0 ? "text-red-400 font-bold" : "text-zinc-400 font-bold")}>
                    {simulation.oppScoreChange > 0 ? "+" : ""}{simulation.oppScoreChange} points
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Confidence Penalty</span>
                  <span className="text-amber-400 font-bold">
                    {simulation.confidenceAdjustment} points
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Visualization & Outputs */}
        <div className="lg:col-span-8 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-semibold">
              Error: {error}
            </div>
          )}

          {loading && !simulation && (
            <div className="bg-zinc-900/60 border border-zinc-800 p-8 rounded-2xl flex flex-col items-center justify-center space-y-4 h-[300px]">
              <Activity className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-sm font-medium text-zinc-400">Running scenario elasticity simulations...</p>
            </div>
          )}

          {simulation && (
            <>
              {/* Scenario Comparison Summary Card */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800 shadow-xl">
                {/* Baseline Column */}
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                      Baseline Forecast
                    </span>
                    <span className="text-xs font-bold bg-zinc-800 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded-full">
                      Normal Conditions
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                        Day-30 Price
                      </div>
                      <div className="text-xl font-black mt-0.5 text-zinc-200 font-space-grotesk">
                        ₹{simulation.baselineDay30Price.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                        Opportunity
                      </div>
                      <div className="text-xl font-black mt-0.5 text-amber-500 font-space-grotesk">
                        {simulation.baselineOpportunityScore}/100
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                        Risk Level
                      </div>
                      <div
                        className={cn(
                          "text-xs font-bold mt-1.5 inline-block px-2 py-0.5 rounded-full uppercase tracking-wider",
                          simulation.baselineRiskLevel === "High"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : simulation.baselineRiskLevel === "Medium"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        )}
                      >
                        {simulation.baselineRiskLevel}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scenario Column */}
                <div className="p-5 space-y-3 bg-gradient-to-b from-amber-500/5 to-transparent">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                      Simulated Scenario
                    </span>
                    {simulation.priceImpactPct !== 0 ? (
                      <span
                        className={cn(
                          "text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border transition-colors",
                          simulation.priceImpactPct > 0
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-red-500/10 border-red-500/20 text-red-400"
                        )}
                      >
                        {simulation.priceImpactPct > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {simulation.priceImpactPct > 0 ? "+" : ""}
                        {simulation.priceImpactPct}% Price Impact
                      </span>
                    ) : (
                      <span className="text-xs font-bold bg-zinc-800 border border-zinc-700 text-zinc-400 px-2 py-0.5 rounded-full">
                        No Change
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                        Day-30 Price
                      </div>
                      <div
                        className={cn(
                          "text-xl font-black mt-0.5 transition-colors font-space-grotesk",
                          simulation.priceImpactPct > 0
                            ? "text-emerald-400"
                            : simulation.priceImpactPct < 0
                            ? "text-red-400"
                            : "text-zinc-200"
                        )}
                      >
                        ₹{simulation.adjustedDay30Price.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                        Opportunity
                      </div>
                      <div
                        className={cn(
                          "text-xl font-black mt-0.5 transition-colors font-space-grotesk",
                          simulation.oppScoreChange > 0
                            ? "text-emerald-400"
                            : simulation.oppScoreChange < 0
                            ? "text-red-400"
                            : "text-amber-500"
                        )}
                      >
                        {simulation.adjustedOpportunityScore}/100
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                        Risk Level
                      </div>
                      <div
                        className={cn(
                          "text-xs font-bold mt-1.5 inline-block px-2 py-0.5 rounded-full uppercase tracking-wider",
                          simulation.adjustedRiskLevel === "High"
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : simulation.adjustedRiskLevel === "Medium"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        )}
                      >
                        {simulation.adjustedRiskLevel}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overlapping Forecast Charts */}
              <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl space-y-4 shadow-xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-amber-400 animate-pulse" />
                    <h2 className="text-lg font-bold">Simulated Price Trajectory</h2>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <div className="w-3 h-0.5 border-t border-dashed border-zinc-500" />
                      Baseline Forecast
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <div className="w-3 h-0.5 bg-amber-500" />
                      Simulated Trajectory
                    </div>
                  </div>
                </div>

                <div className="h-[320px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={simulation.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#71717a"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        domain={["auto", "auto"]}
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#18181b",
                          borderColor: "#27272a",
                          borderRadius: "12px",
                          color: "#f4f4f5",
                        }}
                        formatter={(val: any, name: any) => {
                          const label = name === "baseline" ? "Baseline Price" : "Simulated Price";
                          return [`₹${Number(val).toLocaleString("en-IN")}/q`, label];
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="baseline"
                        stroke="#71717a"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="baseline"
                      />
                      <Line
                        type="monotone"
                        dataKey="adjusted"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={{ r: 3, strokeWidth: 0, fill: "#f59e0b" }}
                        name="adjusted"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Dynamic Recommendation Alert */}
              <div
                className={cn(
                  "p-5 rounded-2xl border transition-all relative overflow-hidden backdrop-blur-md shadow-xl",
                  simulation.recommendation.action === "BUY"
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-200"
                    : simulation.recommendation.action === "SELL"
                    ? "bg-red-500/5 border-red-500/20 text-red-200"
                    : simulation.recommendation.action === "HOLD"
                    ? "bg-amber-500/5 border-amber-500/20 text-amber-200"
                    : "bg-blue-500/5 border-blue-500/20 text-blue-200"
                )}
              >
                <div className="absolute top-0 right-0 p-3 opacity-5">
                  <Sparkles className="w-16 h-16 text-zinc-100" />
                </div>
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "p-3 rounded-xl border font-bold text-center tracking-widest text-xs uppercase shadow-sm shrink-0 min-w-[80px]",
                      simulation.recommendation.action === "BUY"
                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                        : simulation.recommendation.action === "SELL"
                        ? "bg-red-500/20 border-red-500/30 text-red-400"
                        : simulation.recommendation.action === "HOLD"
                        ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                        : "bg-blue-500/20 border-blue-500/30 text-blue-400"
                    )}
                  >
                    {simulation.recommendation.action}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                      {simulation.recommendation.action === "SELL" && <TrendingDown className="w-4 h-4 text-red-400" />}
                      {(simulation.recommendation.action === "BUY" || simulation.recommendation.action === "HOLD") && (
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      )}
                      {simulation.recommendation.action === "MONITOR" && <Activity className="w-4 h-4 text-blue-400" />}
                      {simulation.recommendation.headline}
                    </h3>
                    <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                      {simulation.recommendation.detail}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )}
</div>
  );
}
