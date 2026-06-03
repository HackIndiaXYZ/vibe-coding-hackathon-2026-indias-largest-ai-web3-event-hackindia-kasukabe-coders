"use client";

import { useState, useEffect, useCallback } from "react";
import { PriceHistoryChart, type PriceHistoryDataPoint } from "@/components/charts/price-history-chart";

import { BarChart3, TrendingUp, TrendingDown, Minus, RefreshCw, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MonthlyAggregate } from "@/lib/market-data";

// ─── Types from API ───────────────────────────────────────────────────────────

interface APIResponse {
  monthly: MonthlyAggregate[];
  summary: {
    count: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    totalVolume: number;
    dateRange: { start: string; end: string } | null;
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const COMMODITY_LIST = ["Onion", "Tomato", "Potato", "Garlic"];

export default function HistoricalTrendsPage() {
  const [selectedCommodity, setSelectedCommodity] = useState("Onion");
  const [apiData, setApiData] = useState<APIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dataSource, setDataSource] = useState<"csv" | "mock">("mock");

  const fetchData = useCallback(async (commodity: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/market-data?commodity=${encodeURIComponent(commodity)}&startDate=2024-01-01&endDate=2024-12-31`
      );
      if (!res.ok) throw new Error("API error");
      const data: APIResponse = await res.json();
      if (data.monthly && data.monthly.length > 0) {
        setApiData(data);
        setDataSource("csv");
      } else {
        setApiData(null);
        setDataSource("mock");
      }
    } catch {
      setApiData(null);
      setDataSource("mock");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedCommodity);
  }, [selectedCommodity, fetchData]);

  // Transform API monthly data into chart format
  const chartData: PriceHistoryDataPoint[] | undefined = apiData?.monthly.map((m) => ({
    month: m.month,
    price: m.avgPrice,
    volume: m.totalVolume,
  }));

  // Stats — prefer real data, fall back to chart data computed values
  const statsData = chartData ?? [];
  const firstPrice = statsData[0]?.price || 0;
  const lastPrice = statsData[statsData.length - 1]?.price || 0;
  const pctChange = firstPrice ? (((lastPrice - firstPrice) / firstPrice) * 100).toFixed(1) : "0";
  const isBullish = parseFloat(pctChange) > 0;
  const maxPrice = apiData?.summary.maxPrice ?? Math.max(...statsData.map((d) => d.price), 0);
  const minPrice = apiData?.summary.minPrice ?? Math.min(...statsData.map((d) => d.price), 0);
  const avgPrice = apiData?.summary.avgPrice ?? (
    statsData.length ? Math.round(statsData.reduce((s, d) => s + d.price, 0) / statsData.length) : 0
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-space-grotesk">Historical Trends</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-400 text-sm">
              6-month price and volume analytics across commodities
            </p>
            {/* Data source badge */}
            <div className={cn(
              "hidden sm:flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full",
              dataSource === "csv"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : "bg-slate-700 border border-slate-600 text-slate-500"
            )}>
              <Database className="w-2.5 h-2.5" />
              {dataSource === "csv" ? "AGMARKNET CSV" : "Mock Data"}
            </div>
          </div>
        </div>

        {/* Commodity tabs */}
        <div className="flex flex-wrap gap-2">
          {COMMODITY_LIST.map((c) => (
            <button
              key={c}
              id={`hist-tab-${c.toLowerCase()}`}
              onClick={() => setSelectedCommodity(c)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                selectedCommodity === c
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                  : "bg-slate-800 border border-slate-700 text-slate-400 hover:text-white"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "6M Change", value: `${isBullish ? "+" : ""}${pctChange}%`, color: isBullish ? "text-emerald-400" : "text-red-400" },
          { label: "6M High", value: maxPrice > 0 ? `₹${maxPrice.toLocaleString("en-IN")}` : "—", color: "text-blue-400" },
          { label: "6M Low", value: minPrice > 0 ? `₹${minPrice.toLocaleString("en-IN")}` : "—", color: "text-amber-400" },
          { label: "6M Average", value: avgPrice > 0 ? `₹${avgPrice.toLocaleString("en-IN")}` : "—", color: "text-slate-300" },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-center">
            {isLoading ? (
              <div className="h-7 bg-slate-700 rounded animate-pulse mx-auto w-20" />
            ) : (
              <div className={cn("text-xl font-bold font-space-grotesk", stat.color)}>{stat.value}</div>
            )}
            <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white font-space-grotesk">
              {selectedCommodity} — Price &amp; Volume History
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {dataSource === "csv"
                ? `AGMARKNET CSV · ${apiData?.summary.count ?? 0} records · ${apiData?.summary.dateRange?.start ?? ""} to ${apiData?.summary.dateRange?.end ?? ""}`
                : "January – June 2024 · National composite average"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isLoading && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Loading CSV data...
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-3 h-3 rounded bg-indigo-500/50" />
                Volume (MT)
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-6 h-0.5 bg-amber-400 inline-block" />
                Price (₹/q)
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="h-[320px] bg-slate-700/30 rounded-xl animate-pulse flex items-center justify-center">
            <span className="text-slate-600 text-sm">Loading AGMARKNET data...</span>
          </div>
        ) : (
          <PriceHistoryChart commodity={selectedCommodity} data={chartData} />
        )}
      </div>

      {/* Monthly breakdown table */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            Monthly Breakdown
          </h3>
          {dataSource === "csv" && (
            <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
              <Database className="w-3 h-3" /> Real CSV Data
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="text-xs text-slate-500 font-medium pb-3">Month</th>
                <th className="text-xs text-slate-500 font-medium pb-3 text-right">Avg Price (₹/q)</th>
                <th className="text-xs text-slate-500 font-medium pb-3 text-right hidden sm:table-cell">Min</th>
                <th className="text-xs text-slate-500 font-medium pb-3 text-right hidden sm:table-cell">Max</th>
                <th className="text-xs text-slate-500 font-medium pb-3 text-right">Volume (q)</th>
                <th className="text-xs text-slate-500 font-medium pb-3 text-right">MoM Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="py-3">
                        <div className="h-4 bg-slate-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : apiData?.monthly.length ? (
                apiData.monthly.map((row, i) => {
                  const prev = apiData.monthly[i - 1];
                  const change = prev
                    ? (((row.avgPrice - prev.avgPrice) / prev.avgPrice) * 100).toFixed(1)
                    : null;
                  return (
                    <tr key={row.monthKey} className="hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 font-medium text-slate-200">{row.month} {row.year}</td>
                      <td className="py-3 text-right font-semibold text-white">
                        ₹{row.avgPrice.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 text-right text-slate-400 hidden sm:table-cell">
                        ₹{row.minPrice.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 text-right text-slate-400 hidden sm:table-cell">
                        ₹{row.maxPrice.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 text-right text-slate-300">
                        {(row.totalVolume / 1000).toFixed(0)}k q
                      </td>
                      <td className="py-3 text-right">
                        {change ? (
                          <span className={cn(
                            "flex items-center gap-1 justify-end font-medium text-xs",
                            parseFloat(change) > 0 ? "text-emerald-400" : parseFloat(change) < 0 ? "text-red-400" : "text-slate-400"
                          )}>
                            {parseFloat(change) > 0 ? <TrendingUp className="w-3 h-3" /> :
                             parseFloat(change) < 0 ? <TrendingDown className="w-3 h-3" /> :
                             <Minus className="w-3 h-3" />}
                            {parseFloat(change) > 0 ? "+" : ""}{change}%
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                // Fallback: show message when no CSV data
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-sm">
                    No CSV data found for {selectedCommodity}. Place a CSV file in{" "}
                    <code className="bg-slate-700 px-1 rounded text-xs">/data/agmarknet/</code>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
