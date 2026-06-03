import { Brain, ArrowRight, Zap, TrendingUp, ShoppingCart, PackageCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIRecommendation } from "@/types";

const typeConfig = {
  sell: {
    icon: TrendingUp,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    badge: "bg-rose-500/15 text-rose-400",
    label: "SELL",
  },
  hold: {
    icon: PackageCheck,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    badge: "bg-amber-500/15 text-amber-400",
    label: "HOLD",
  },
  buy: {
    icon: ShoppingCart,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    badge: "bg-emerald-500/15 text-emerald-400",
    label: "BUY",
  },
};

interface AIRecommendationCardProps {
  recommendation: AIRecommendation;
}

export function AIRecommendationCard({ recommendation }: AIRecommendationCardProps) {
  const config = typeConfig[recommendation.type];
  const TypeIcon = config.icon;

  return (
    <div className={cn("rounded-xl border p-4 card-hover", config.border, config.bg)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-800/60 flex items-center justify-center">
            <Brain className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <span className="text-xs text-slate-400">AI Recommendation</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">{recommendation.commodity}</span>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", config.badge)}>
                {config.label}
              </span>
            </div>
          </div>
        </div>
        <TypeIcon className={cn("w-5 h-5 flex-shrink-0 mt-1", config.color)} />
      </div>

      {/* Message */}
      <p className="text-sm text-slate-300 leading-relaxed mb-3">{recommendation.message}</p>

      {/* Bottom */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-emerald-400">{recommendation.expectedGain}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>AI Confidence:</span>
          <span className="font-bold text-slate-300">{recommendation.confidence}%</span>
        </div>
      </div>
    </div>
  );
}
