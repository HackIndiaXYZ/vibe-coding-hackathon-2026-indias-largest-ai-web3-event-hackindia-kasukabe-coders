"use client";

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { forecastChartData } from "@/lib/mock-data";
import type { ChartDataPoint } from "@/lib/forecast";

// ─── Types ────────────────────────────────────────────────────────────────────

export type { ChartDataPoint };

interface ForecastChartProps {
  commodity?: string;
  /** Optional real data from /api/forecast — overrides mock when provided. */
  data?: ChartDataPoint[];
  /** Label for the "Today" reference line. */
  todayLabel?: string;
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number | null; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl">
        <p className="text-xs font-semibold text-slate-300 mb-2">{label}</p>
        {payload.map((entry) => {
          if (entry.value === null || entry.value === undefined) return null;
          return (
            <div key={entry.name} className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-400 capitalize">{entry.name}:</span>
              <span className="font-semibold text-white">
                ₹{entry.value?.toLocaleString("en-IN")}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ForecastChart({
  commodity = "Onion",
  data: externalData,
  todayLabel,
}: ForecastChartProps) {
  // Prefer real CSV-driven data; fall back to mock
  const chartData = externalData ?? forecastChartData;

  // Find the "today" transition label — last point that has an `actual` value
  const transitionLabel =
    todayLabel ??
    (() => {
      const lastActual = [...chartData].reverse().find((d) => d.actual !== null);
      return lastActual?.date ?? null;
    })();

  // Dynamic Y-axis domain based on data
  const allPrices = chartData.flatMap((d) =>
    [d.actual, d.forecast, d.low, d.high].filter((v): v is number => v !== null && v !== undefined)
  );
  const minP = allPrices.length ? Math.min(...allPrices) : 1000;
  const maxP = allPrices.length ? Math.max(...allPrices) : 5000;
  const pad = (maxP - minP) * 0.1;
  const yDomain: [number, number] = [Math.max(0, Math.floor((minP - pad) / 100) * 100), Math.ceil((maxP + pad) / 100) * 100];

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />

          <XAxis
            dataKey="date"
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`}
            domain={yDomain}
          />

          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: "16px", fontSize: "12px", color: "#94a3b8" }} />

          {/* Confidence band — upper fill */}
          <Area
            dataKey="high"
            fill="url(#confidenceGradient)"
            stroke="#22c55e"
            strokeWidth={1}
            strokeOpacity={0.3}
            strokeDasharray="3 3"
            name="Upper bound"
            legendType="none"
            activeDot={false}
            connectNulls={false}
          />
          {/* Confidence band — lower fill (white erases the area beneath) */}
          <Area
            dataKey="low"
            fill="white"
            stroke="#22c55e"
            strokeWidth={1}
            strokeOpacity={0.3}
            strokeDasharray="3 3"
            fillOpacity={0}
            name="Lower bound"
            legendType="none"
            activeDot={false}
            connectNulls={false}
          />

          {/* Today reference line */}
          {transitionLabel && (
            <ReferenceLine
              x={transitionLabel}
              stroke="rgba(255,255,255,0.25)"
              strokeDasharray="4 4"
              label={{
                value: "Today",
                fill: "#64748b",
                fontSize: 10,
                position: "top",
              }}
            />
          )}

          {/* Actual prices */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#60a5fa"
            strokeWidth={2.5}
            dot={{ fill: "#60a5fa", r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#60a5fa" }}
            name="Actual Price"
            connectNulls={false}
          />

          {/* Forecast line */}
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#22c55e"
            strokeWidth={2.5}
            strokeDasharray="6 3"
            dot={{ fill: "#22c55e", r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#22c55e" }}
            name="AI Forecast"
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
