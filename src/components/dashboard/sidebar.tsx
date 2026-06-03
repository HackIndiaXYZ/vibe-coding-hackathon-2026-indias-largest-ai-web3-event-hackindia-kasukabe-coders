"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  MapPin,
  ShieldAlert,
  BarChart3,
  Brain,
  Leaf,
  ChevronRight,
  X,
  MessageSquareDot,
  Sliders,
  Target,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Opportunity Scanner",
    href: "/dashboard/opportunities",
    icon: Target,
  },
  {
    label: "Market Forecasts",
    href: "/dashboard/forecasts",
    icon: TrendingUp,
  },
  /*
  // Temporarily hidden from navigation pending full AGMARKNET integration.
  {
    label: "Best Market Finder",
    href: "/dashboard/best-market",
    icon: MapPin,
  },
  */
  {
    label: "Risk Alerts",
    href: "/dashboard/risk-alerts",
    icon: ShieldAlert,
  },
  {
    label: "Historical Trends",
    href: "/dashboard/historical",
    icon: BarChart3,
  },
  {
    label: "AI Insights",
    href: "/dashboard/insights",
    icon: Brain,
  },
  {
    label: "Scenario Simulator",
    href: "/dashboard/scenario",
    icon: Sliders,
  },
  {
    label: "Data Importer",
    href: "/dashboard/data-upload",
    icon: Database,
  },
  {
    label: "AI Market Analyst",
    href: "/dashboard/analyst",
    icon: MessageSquareDot,
    isNew: true,
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-50 w-64 flex flex-col",
          "bg-slate-900 border-r border-slate-800",
          "transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:relative lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-base font-bold leading-none font-space-grotesk">
                <span className="text-white">Mandi</span>
                <span className="text-emerald-400">Mind</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-medium tracking-wide">
                AI INTELLIGENCE
              </div>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-500 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live indicator */}
        <div className="px-5 py-3">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
            <span className="text-emerald-400 text-xs font-medium">Live Data — 2,847 Mandis</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-3 py-2">
            Navigation
          </div>
          {navItems.map((item, idx) => {
            const active = isActive(item);
            const showDivider = idx === navItems.length - 1;
            return (
              <div key={item.href}>
                {showDivider && (
                  <div className="my-2 border-t border-slate-800" />
                )}
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                    active
                      ? item.isNew
                        ? "bg-violet-500/15 text-violet-400 border border-violet-500/20"
                        : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      : item.isNew
                        ? "text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 border border-violet-500/10"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 flex-shrink-0 transition-colors",
                      active
                        ? item.isNew ? "text-violet-400" : "text-emerald-400"
                        : item.isNew
                          ? "text-violet-400"
                          : "text-slate-500 group-hover:text-white"
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.isNew && !active && (
                    <span className="text-[9px] font-bold bg-violet-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>
                  )}
                  {active && (
                    <ChevronRight className={cn("w-4 h-4", item.isNew ? "text-violet-400" : "text-emerald-400")} />
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Bottom info */}
        <div className="px-4 py-4 border-t border-slate-800">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-3">
            <div className="text-xs font-semibold text-white mb-1">Data last updated</div>
            <div className="text-xs text-slate-400">Jun 1, 2024 · 2:45 PM IST</div>
            <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full w-4/5" />
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Next refresh in 15 min</div>
          </div>
        </div>
      </aside>
    </>
  );
}
