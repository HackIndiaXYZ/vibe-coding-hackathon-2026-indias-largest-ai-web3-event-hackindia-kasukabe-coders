"use client";

import { Moon, Sun, Menu, Bell, Search, ChevronDown, Database } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const pageNames: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/opportunities": "Opportunity Scanner",
  "/dashboard/forecasts": "Market Forecasts",
  "/dashboard/best-market": "Best Market Finder",
  "/dashboard/risk-alerts": "Risk Alerts",
  "/dashboard/historical": "Historical Trends",
  "/dashboard/insights": "AI Insights",
  "/dashboard/analyst": "AI Market Analyst",
  "/dashboard/data-upload": "Data Importer",
  "/dashboard/scenario": "Scenario Simulator",
};

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const pageName = pageNames[pathname] || "Dashboard";

  const [sourceInfo, setSourceInfo] = useState<{ label: string; recordCount: number; effectiveDataset: string } | null>(null);

  const fetchSource = async () => {
    try {
      const res = await fetch("/api/market-data/upload");
      if (res.ok) {
        const data = await res.json();
        setSourceInfo({
          label: data.label,
          recordCount: data.recordCount,
          effectiveDataset: data.effectiveDataset,
        });
      }
    } catch (e) {
      console.warn("Failed to fetch data source info in header:", e);
    }
  };

  useEffect(() => {
    fetchSource();
    
    // Listen for custom events when database changes in upload page
    window.addEventListener("dataset-changed", fetchSource);
    return () => {
      window.removeEventListener("dataset-changed", fetchSource);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-slate-400 hover:text-white transition-colors p-2 -ml-2 rounded-lg"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-white font-space-grotesk">
            {pageName}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-slate-500 hidden sm:block">
              MandiMind AI Platform
            </p>
            {sourceInfo && (
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-bold border hidden md:flex items-center gap-1 shrink-0",
                sourceInfo.effectiveDataset === "uploaded"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              )}>
                <Database className="w-2.5 h-2.5" />
                Using {sourceInfo.label} ({sourceInfo.recordCount.toLocaleString("en-IN")} records)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center — Search */}
      <div className="hidden md:flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 w-72">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search commodities, mandis..."
          className="bg-transparent text-sm text-slate-300 placeholder:text-slate-600 outline-none flex-1"
          id="header-search"
        />
        <kbd className="text-[10px] text-slate-600 bg-slate-700 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button
          className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
          aria-label="Toggle theme"
          id="theme-toggle"
        >
          <Sun className="w-5 h-5 hidden dark:block" />
          <Moon className="w-5 h-5 dark:hidden" />
        </button>

        {/* User avatar */}
        <button className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm hover:border-slate-600 transition-colors">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-xs">
            R
          </div>
          <span className="text-slate-300 hidden sm:block font-medium">Rajesh Kumar</span>
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    </header>
  );
}
