"use client";

import { useState } from "react";
import { commodities, states, mandiFinderResults } from "@/lib/mock-data";
import type { MandiResult } from "@/lib/mock-data";
import { MapPin, Search, TrendingUp, Star, Truck, BarChart3, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 85 ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" :
    score >= 70 ? "text-amber-400 bg-amber-500/15 border-amber-500/30" :
    "text-red-400 bg-red-500/15 border-red-500/30";
  return (
    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full border", color)}>
      {score}
    </span>
  );
}

const volumeColor: Record<string, string> = {
  "Very High": "text-emerald-400",
  "High": "text-blue-400",
  "Medium": "text-amber-400",
  "Low": "text-slate-400",
};

export default function BestMarketPage() {
  const [selectedCommodity, setSelectedCommodity] = useState("Onion");
  const [selectedState, setSelectedState] = useState("Maharashtra");
  const [results, setResults] = useState<MandiResult[]>(
    mandiFinderResults["Onion"]?.["Maharashtra"] || []
  );
  const [searched, setSearched] = useState(true);

  const handleSearch = () => {
    const res = mandiFinderResults[selectedCommodity]?.[selectedState];
    if (res) {
      setResults(res);
    } else {
      // Generate fallback results
      setResults([
        { rank: 1, name: `${selectedState} Central APMC`, district: selectedState, expectedPrice: 2800, advantage: "+10.5%", score: 82, distance: "50 km", volume: "High" },
        { rank: 2, name: `District APMC 2`, district: selectedState, expectedPrice: 2650, advantage: "+4.7%", score: 74, distance: "75 km", volume: "Medium" },
        { rank: 3, name: `District APMC 3`, district: selectedState, expectedPrice: 2550, advantage: "+0.8%", score: 66, distance: "90 km", volume: "Medium" },
        { rank: 4, name: `District APMC 4`, district: selectedState, expectedPrice: 2500, advantage: "-1.2%", score: 58, distance: "120 km", volume: "Low" },
        { rank: 5, name: `District APMC 5`, district: selectedState, expectedPrice: 2450, advantage: "-3.1%", score: 51, distance: "145 km", volume: "Low" },
      ]);
    }
    setSearched(true);
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white font-space-grotesk">Best Market Finder</h1>
        <p className="text-slate-400 text-sm mt-1">
          AI-powered mandi recommendations to maximize your price realisation
        </p>
      </div>

      {/* Search Panel */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-white">Find Best Mandi</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Commodity */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Commodity</label>
            <div className="relative">
              <select
                id="best-market-commodity"
                value={selectedCommodity}
                onChange={(e) => setSelectedCommodity(e.target.value)}
                className="w-full appearance-none bg-slate-700/60 border border-slate-600 text-slate-200 text-sm rounded-xl px-4 py-3 pr-9 outline-none focus:border-emerald-500 cursor-pointer"
              >
                {commodities.map((c) => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* State */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">State</label>
            <div className="relative">
              <select
                id="best-market-state"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full appearance-none bg-slate-700/60 border border-slate-600 text-slate-200 text-sm rounded-xl px-4 py-3 pr-9 outline-none focus:border-emerald-500 cursor-pointer"
              >
                {states.map((s) => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Search */}
          <div className="flex items-end">
            <button
              id="best-market-search-btn"
              onClick={handleSearch}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5"
            >
              <Search className="w-4 h-4" />
              Find Best Mandis
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {searched && results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-emerald-500" />
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                Top 5 Recommended Mandis
              </h2>
            </div>
            <div className="text-xs text-slate-500">
              {selectedCommodity} · {selectedState}
            </div>
          </div>

          <div className="space-y-3">
            {results.map((mandi, i) => (
              <div
                key={mandi.rank}
                className={cn(
                  "relative overflow-hidden rounded-2xl border p-5 card-hover",
                  i === 0
                    ? "bg-gradient-to-r from-emerald-950/40 to-slate-800/60 border-emerald-500/30"
                    : "bg-slate-800/50 border-slate-700/50"
                )}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {i === 0 && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" />
                      BEST MATCH
                    </span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Rank */}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold font-space-grotesk flex-shrink-0",
                    i === 0 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                    i === 1 ? "bg-blue-500/15 text-blue-400 border border-blue-500/20" :
                    "bg-slate-700 text-slate-400 border border-slate-600"
                  )}>
                    #{mandi.rank}
                  </div>

                  {/* Mandi info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-white">{mandi.name}</h3>
                      <ScoreBadge score={mandi.score} />
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span className="text-xs text-slate-400">{mandi.district}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold text-white font-space-grotesk">
                      ₹{mandi.expectedPrice.toLocaleString("en-IN")}/q
                    </div>
                    <div className={cn(
                      "text-sm font-semibold flex items-center gap-1 justify-end",
                      mandi.advantage.startsWith("+") ? "text-emerald-400" : "text-red-400"
                    )}>
                      <TrendingUp className="w-3.5 h-3.5" />
                      {mandi.advantage} vs avg
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-row sm:flex-col gap-3 sm:gap-1 sm:text-right flex-shrink-0">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Truck className="w-3.5 h-3.5" />
                      {mandi.distance}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                      <span className={volumeColor[mandi.volume] || "text-slate-400"}>
                        {mandi.volume} volume
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score bar */}
                <div className="mt-3 h-1 bg-slate-700/60 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700",
                      i === 0 ? "bg-gradient-to-r from-emerald-500 to-green-400" :
                      i === 1 ? "bg-gradient-to-r from-blue-500 to-cyan-400" :
                      "bg-slate-500"
                    )}
                    style={{ width: `${mandi.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
