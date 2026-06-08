import { TrendingUp, TrendingDown, Minus, Target, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ForecastCardProps {
  commodity: string;
  market: string;
  currentPrice: number;
  predictedMin: number;
  predictedMax: number;
  predictedMid: number;
  confidence: number;
  timeframe: string;
  trend: string;
}

export function ForecastCard({
  commodity,
  market,
  currentPrice,
  predictedMin,
  predictedMax,
  predictedMid,
  confidence,
  timeframe,
  trend,
}: ForecastCardProps) {
  const isBullish = trend === "bullish";
  const pctChange = (((predictedMid - currentPrice) / currentPrice) * 100).toFixed(1);

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-800/80 dark:to-slate-900/80 p-5 card-hover shadow-lg shadow-emerald-500/5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{commodity} Price Forecast</h3>
              <p className="text-xs text-slate-500">{market}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1">
          <Clock className="w-3 h-3" />
          {timeframe}
        </div>
      </div>

      {/* Price display */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-100/60 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/50 dark:border-slate-700/50">
          <div className="text-xs text-slate-500 mb-1">Current Price</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white font-space-grotesk">
            ₹{currentPrice.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-slate-500">/quintal</div>
        </div>
        <div
          className={cn(
            "rounded-xl p-3 border",
            isBullish
              ? "bg-emerald-500/10 border-emerald-500/30"
              : "bg-red-500/10 border-red-500/30"
          )}
        >
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Predicted Range</div>
          <div
            className={cn(
              "text-xl font-bold font-space-grotesk",
              isBullish ? "text-emerald-400" : "text-red-400"
            )}
          >
            ₹{(predictedMin / 1000).toFixed(1)}k–{(predictedMax / 1000).toFixed(1)}k
          </div>
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              isBullish ? "text-emerald-400" : "text-red-400"
            )}
          >
            {isBullish ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {isBullish ? "+" : ""}
            {pctChange}% expected
          </div>
        </div>
      </div>

      {/* Confidence bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">AI Confidence Score</span>
          <span
            className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full",
              confidence >= 80
                ? "text-emerald-400 bg-emerald-500/15"
                : confidence >= 60
                  ? "text-amber-400 bg-amber-500/15"
                  : "text-red-400 bg-red-500/15"
            )}
          >
            {confidence}%
          </span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000",
              confidence >= 80
                ? "bg-gradient-to-r from-emerald-500 to-green-400"
                : confidence >= 60
                  ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                  : "bg-gradient-to-r from-red-500 to-orange-400"
            )}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
    </div>
  );
}
