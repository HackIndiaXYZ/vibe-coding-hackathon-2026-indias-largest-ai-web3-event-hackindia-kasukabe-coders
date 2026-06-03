import { cn } from "@/lib/utils";
import {
  MapPin,
  Wheat,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MapPin,
  Wheat,
  AlertTriangle,
  TrendingUp,
};

const colorMap: Record<
  string,
  { bg: string; icon: string; badge: string; border: string; glow: string }
> = {
  emerald: {
    bg: "from-emerald-500/10 to-emerald-600/5",
    icon: "text-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-400",
    border: "border-emerald-500/20",
    glow: "shadow-emerald-500/10",
  },
  amber: {
    bg: "from-amber-500/10 to-amber-600/5",
    icon: "text-amber-400",
    badge: "bg-amber-500/15 text-amber-400",
    border: "border-amber-500/20",
    glow: "shadow-amber-500/10",
  },
  red: {
    bg: "from-red-500/10 to-red-600/5",
    icon: "text-red-400",
    badge: "bg-red-500/15 text-red-400",
    border: "border-red-500/20",
    glow: "shadow-red-500/10",
  },
  blue: {
    bg: "from-blue-500/10 to-blue-600/5",
    icon: "text-blue-400",
    badge: "bg-blue-500/15 text-blue-400",
    border: "border-blue-500/20",
    glow: "shadow-blue-500/10",
  },
};

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  description: string;
  icon: string;
  color: string;
  index?: number;
}

export function KPICard({
  title,
  value,
  change,
  trend,
  description,
  icon,
  color,
  index = 0,
}: KPICardProps) {
  const colors = colorMap[color] || colorMap.emerald;
  const IconComponent = iconMap[icon] || TrendingUp;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5",
        "bg-gradient-to-br from-slate-800/80 to-slate-900/80",
        "card-hover shadow-lg",
        colors.border,
        colors.glow
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Background gradient */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-50",
          colors.bg
        )}
      />

      <div className="relative z-10">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              `bg-gradient-to-br ${colors.bg}`,
              "border",
              colors.border
            )}
          >
            <IconComponent className={cn("w-5 h-5", colors.icon)} />
          </div>
          <span
            className={cn(
              "flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
              colors.badge
            )}
          >
            {trend === "up" ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {change}
          </span>
        </div>

        {/* Value */}
        <div className="text-3xl font-bold text-white font-space-grotesk mb-1">
          {value}
        </div>

        {/* Labels */}
        <div className="text-sm font-medium text-slate-300">{title}</div>
        <div className="text-xs text-slate-500 mt-0.5">{description}</div>
      </div>
    </div>
  );
}
