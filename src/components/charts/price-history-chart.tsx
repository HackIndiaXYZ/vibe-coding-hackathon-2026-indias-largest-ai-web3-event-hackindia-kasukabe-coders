"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { historicalData } from "@/lib/mock-data";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PriceHistoryDataPoint {
  month: string;
  price: number;
  volume: number;
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl">
        <p className="text-xs font-semibold text-slate-300 mb-2">{label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-xs mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-400">{entry.name}:</span>
            <span className="font-semibold text-white">
              {entry.name === "Price (₹/q)"
                ? `₹${entry.value.toLocaleString("en-IN")}`
                : `${(entry.value / 1000).toFixed(0)}k MT`}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Component ────────────────────────────────────────────────────────────────

interface PriceHistoryChartProps {
  commodity?: string;
  /** Optional external data from the API — overrides mock data when provided. */
  data?: PriceHistoryDataPoint[];
}

export function PriceHistoryChart({ commodity = "Onion", data: externalData }: PriceHistoryChartProps) {
  // Prefer external (real CSV) data; fall back to mock data
  const data = externalData ?? (historicalData[commodity] || historicalData.Onion);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          yAxisId="price"
          orientation="left"
          tick={{ fill: "#64748b", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`}
        />
        <YAxis
          yAxisId="volume"
          orientation="right"
          tick={{ fill: "#64748b", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: "12px", fontSize: "12px", color: "#94a3b8" }} />
        <Bar
          yAxisId="volume"
          dataKey="volume"
          name="Volume (MT)"
          fill="url(#volumeGradient)"
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
        <Line
          yAxisId="price"
          type="monotone"
          dataKey="price"
          name="Price (₹/q)"
          stroke="#f59e0b"
          strokeWidth={2.5}
          dot={{ fill: "#f59e0b", r: 5, strokeWidth: 0 }}
          activeDot={{ r: 7, fill: "#f59e0b" }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
