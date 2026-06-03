import React from "react";
import { Database, AlertTriangle, Calendar, FileText, MapPin, Wheat, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DatasetReadiness } from "@/lib/dashboard-helpers";

interface ReadinessWarningCardProps {
  readiness: DatasetReadiness;
  moduleName?: string;
}

export function ReadinessWarningCard({ readiness, moduleName = "Forecasting" }: ReadinessWarningCardProps) {
  const isLimited = readiness.status === "limited";
  const badgeCls = isLimited
    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
    : "bg-rose-500/10 border-rose-500/30 text-rose-400";
  const borderCls = isLimited ? "border-amber-500/20 shadow-amber-500/5" : "border-rose-500/20 shadow-rose-500/5";

  return (
    <div className={cn("rounded-2xl border bg-slate-900/60 p-6 lg:p-8 shadow-xl max-w-[900px] mx-auto space-y-6", borderCls)}>
      {/* Header and status badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border",
            isLimited ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          )}>
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-space-grotesk">{moduleName} Service Locked</h3>
            <p className="text-xs text-slate-500 mt-0.5">Dataset verification check failed</p>
          </div>
        </div>
        <div className={cn("text-xs font-bold px-3.5 py-1.5 rounded-full border self-start sm:self-auto", badgeCls)}>
          {readiness.label}
        </div>
      </div>

      {/* Primary requirements comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Dates */}
        <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl text-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Current Unique Dates</span>
          <span className={cn("text-2xl font-black font-space-grotesk mt-1 block", isLimited ? "text-amber-400" : "text-rose-400")}>
            {readiness.uniqueDates}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">available in dataset</span>
        </div>

        {/* Minimum Required */}
        <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl text-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Minimum Required</span>
          <span className="text-2xl font-black font-space-grotesk text-slate-300 mt-1 block">30</span>
          <span className="text-xs text-slate-500 mt-1 block">dates for basic OLS models</span>
        </div>

        {/* Recommended */}
        <div className="bg-slate-950/40 border border-slate-900 p-4 rounded-xl text-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Recommended</span>
          <span className="text-2xl font-black font-space-grotesk text-slate-300 mt-1 block">180+</span>
          <span className="text-xs text-slate-500 mt-1 block">dates for full seasonality checks</span>
        </div>
      </div>

      {/* Explanation text */}
      <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-900 text-sm">
        <div className="flex items-center gap-2 text-slate-400 font-semibold mb-1">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          <span>Why is this required?</span>
        </div>
        <p className="text-slate-400 leading-relaxed text-xs">
          {readiness.reason} 
        </p>
        <p className="text-slate-500 leading-relaxed text-[11px] pt-1.5 border-t border-slate-900">
          💡 **Next Steps**: Go to the **Data Importer** page, drag and drop an AGMARKNET export file containing at least 30 separate historical date intervals (ideally daily/weekly records spanning 6+ months), map your columns, and click "Validate & Import".
        </p>
      </div>

      {/* Dataset Diagnostics Panel */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-slate-500" />
          <span>Dataset Diagnostic Statistics</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Records", value: readiness.totalRecords.toLocaleString(), icon: FileText, color: "text-blue-400" },
            { label: "Unique Commodities", value: readiness.uniqueCommodities.toString(), icon: Wheat, color: "text-amber-400" },
            { label: "Unique Mandis", value: readiness.uniqueMandis.toString(), icon: MapPin, color: "text-emerald-400" },
            { 
              label: "Date Range", 
              value: readiness.dateRange ? `${readiness.dateRange.start} to ${readiness.dateRange.end}` : "—", 
              icon: Calendar, 
              color: "text-indigo-400",
              colSpan2: true 
            },
          ].map((diag, index) => (
            <div 
              key={index} 
              className={cn(
                "bg-slate-950/60 border border-slate-900 p-3.5 rounded-xl flex items-center gap-3",
                diag.colSpan2 ? "col-span-2" : ""
              )}
            >
              <div className="p-2 rounded-lg bg-slate-900 text-slate-400">
                <diag.icon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">{diag.label}</span>
                <span className={cn("text-xs font-bold mt-0.5 block truncate max-w-[200px]", diag.color)}>
                  {diag.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
