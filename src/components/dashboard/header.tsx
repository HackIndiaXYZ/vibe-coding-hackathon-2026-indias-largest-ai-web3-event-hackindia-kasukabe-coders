"use client";

import Link from "next/link";
import { Moon, Sun, Menu, Bell, Search, ChevronDown, Database, LayoutDashboard, Upload, ExternalLink, LogIn } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

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
  const { theme, setTheme, resolvedTheme } = useTheme();
  const pathname = usePathname();
  const pageName = pageNames[pathname] || "Dashboard";

  const [mounted, setMounted] = useState(false);
  const [iconKey, setIconKey] = useState(0);
  const [sourceInfo, setSourceInfo] = useState<{ label: string; recordCount: number; effectiveDataset: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";

    // Add transitioning class for smooth animation
    document.documentElement.classList.add("transitioning");
    setTheme(newTheme);
    setIconKey((k) => k + 1);

    // Remove transitioning class after animation completes
    setTimeout(() => {
      document.documentElement.classList.remove("transitioning");
    }, 350);
  }, [resolvedTheme, setTheme]);

  const isDark = resolvedTheme === "dark";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 -ml-2 rounded-lg"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-slate-900 dark:text-white font-space-grotesk">
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
      <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 w-72">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Search commodities, mandis..."
          className="bg-transparent text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none flex-1"
          id="header-search"
        />
        <kbd className="text-[10px] text-slate-500 dark:text-slate-600 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button
          className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Toggle theme"
          id="theme-toggle"
        >
          {mounted ? (
            isDark ? (
              <Sun key={iconKey} className="w-5 h-5 theme-icon-enter" />
            ) : (
              <Moon key={iconKey} className="w-5 h-5 theme-icon-enter" />
            )
          ) : (
            <div className="w-5 h-5" />
          )}
        </button>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm hover:border-slate-300 dark:hover:border-slate-600 transition-colors outline-none"
              id="profile-menu-trigger"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-emerald-500/20">
                G
              </div>
              <span className="text-slate-700 dark:text-slate-300 hidden sm:block font-medium">Guest User</span>
              <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            {/* Profile header */}
            <div className="px-3 py-3 mb-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-emerald-500/20">
                  G
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">Guest User</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Demo Session</div>
                </div>
              </div>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuLabel>Navigation</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="cursor-pointer">
                  <LayoutDashboard className="w-4 h-4 text-emerald-500" />
                  <span>Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/data-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 text-blue-500" />
                  <span>Data Upload</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span>GitHub Repository</span>
                </a>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem disabled className="opacity-50">
              <LogIn className="w-4 h-4 text-slate-400" />
              <span>Sign In</span>
              <span className="ml-auto text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                Soon
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
