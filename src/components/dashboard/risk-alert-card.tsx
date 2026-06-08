import { AlertTriangle, AlertCircle, Info, TrendingUp, TrendingDown, MapPin, Clock, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskAlert } from "@/types";

const severityConfig = {
  high: {
    icon: AlertTriangle,
    badge: "bg-red-500/15 text-red-400 border-red-500/30",
    border: "border-red-500/20",
    dot: "bg-red-500",
    label: "HIGH RISK",
  },
  medium: {
    icon: AlertCircle,
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
    label: "MEDIUM",
  },
  low: {
    icon: Info,
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    border: "border-blue-500/20",
    dot: "bg-blue-500",
    label: "LOW",
  },
};

interface RiskAlertCardProps {
  alert: RiskAlert;
  compact?: boolean;
}

export function RiskAlertCard({ alert, compact = false }: RiskAlertCardProps) {
  const config = severityConfig[alert.severity];
  const SeverityIcon = config.icon;
  const isNegative = alert.priceChange < 0;

  return (
    <div
      className={cn(
        "rounded-xl border bg-white/60 dark:bg-slate-800/60 p-4 card-hover",
        config.border
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-1", config.dot)} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{alert.commodity}</span>
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                  config.badge
                )}
              >
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-500" />
              <span className="text-xs text-slate-500 dark:text-slate-400">{alert.region}</span>
            </div>
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 text-sm font-bold flex-shrink-0",
            isNegative ? "text-red-400" : "text-emerald-400"
          )}
        >
          {isNegative ? (
            <TrendingDown className="w-4 h-4" />
          ) : (
            <TrendingUp className="w-4 h-4" />
          )}
          {isNegative ? "" : "+"}
          {alert.priceChange}%
        </div>
      </div>

      {/* Reason */}
      {!compact && (
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">{alert.reason}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Building2 className="w-3 h-3" />
          <span>{alert.affectedMandis} mandis affected</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{alert.timestamp}</span>
        </div>
      </div>
    </div>
  );
}
