import { NextRequest, NextResponse } from "next/server";
import {
  getAllCommodities,
  getAllStates,
  getAllMandis,
  queryMarketData,
} from "@/lib/market-data";
import { generateForecast } from "@/lib/forecast";
import { getDatasetConfig } from "@/lib/csv-parser";
import { getDashboardSummary } from "@/lib/dashboard-helpers";

export interface OpportunityDetail {
  commodity: string;
  currentPrice: number;
  day30Price: number;
  expectedReturnPct: number;
  confidenceScore: number;
  volatilityScore: number;
  trend: "bullish" | "bearish" | "neutral";
  opportunityScore: number;
  riskLevel: "Low" | "Medium" | "High";
  decisionSignal: "Strong Buy" | "Buy" | "Hold" | "Monitor" | "Avoid";
  contributions: {
    base: number;
    expectedReturn: number;
    confidence: number;
    volatility: number;
    trend: number;
  };
}

// 5-minute in-memory cache for API requests
interface CacheEntry {
  timestamp: number;
  data: any;
}
const apiCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const state = searchParams.get("state") ?? undefined;
    const mandi = searchParams.get("mandi") ?? undefined;

    const allData = queryMarketData({});
    const records = allData.records;
    const config = getDatasetConfig();
    const datasetMode = config.activeDataset;

    // Check cache (include datasetMode and record count in the key for instant cache invalidation upon switch/upload)
    const cacheKey = `${datasetMode}||${records.length}||${(state || "").toLowerCase()}||${(mandi || "").toLowerCase()}`;
    const cached = apiCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      console.log(`[opportunities-api] Serving from cache: ${cacheKey}`);
      return NextResponse.json(cached.data);
    }

    const commodities = getAllCommodities();
    const mandisList = getAllMandis();
    const statesList = getAllStates();

    // 1. Retrieve readiness from central helper
    const summary = getDashboardSummary();
    const { readiness } = summary;

    if (readiness.status !== "ready") {
      const responseData = {
        opportunities: [],
        metadata: {
          states: statesList,
          mandis: mandisList,
        },
        readiness,
        insufficientHistory: true,
      };

      apiCache.set(cacheKey, { timestamp: Date.now(), data: responseData });
      return NextResponse.json(responseData);
    }

    const list: OpportunityDetail[] = [];

    for (const commodity of commodities) {
      const fc = generateForecast({ commodity, mandi, state, days: 30 });
      if (fc) {
        const priceChangePct = fc.summary.priceChangePct;
        const confidence = fc.confidence;
        const volatility = fc.volatilityScore;
        const trend = fc.trend;
        const opportunityScore = fc.opportunityScore;

        // Determine Risk Level
        let riskLevel: "Low" | "Medium" | "High" = "Low";
        if (volatility > 60 || priceChangePct < -8) {
          riskLevel = "High";
        } else if (volatility > 40 || priceChangePct < -3) {
          riskLevel = "Medium";
        }

        // Determine Executive Decision Signal
        let decisionSignal: "Strong Buy" | "Buy" | "Hold" | "Monitor" | "Avoid" = "Monitor";
        if (opportunityScore >= 80 && riskLevel !== "High") {
          decisionSignal = "Strong Buy";
        } else if (opportunityScore >= 65 && riskLevel !== "High") {
          decisionSignal = "Buy";
        } else if (opportunityScore >= 45) {
          decisionSignal = "Hold";
        } else if (opportunityScore < 40 && riskLevel === "High") {
          decisionSignal = "Avoid";
        }

        // Calculate score contributions strictly matching the OLS/Holt formula
        const returnContribution = parseFloat((priceChangePct * 2).toFixed(1));
        const confidenceContribution = parseFloat(((confidence - 70) * 0.5).toFixed(1));
        const volatilityPenalty = parseFloat((-(volatility - 30) * 0.3).toFixed(1));
        const trendContribution = trend === "bullish" ? 15 : trend === "bearish" ? -20 : 0;

        list.push({
          commodity: fc.commodity,
          currentPrice: fc.currentPrice,
          day30Price: fc.summary.day30Price,
          expectedReturnPct: priceChangePct,
          confidenceScore: confidence,
          volatilityScore: volatility,
          trend,
          opportunityScore,
          riskLevel,
          decisionSignal,
          contributions: {
            base: 50,
            expectedReturn: returnContribution,
            confidence: confidenceContribution,
            volatility: volatilityPenalty,
            trend: trendContribution,
          },
        });
      }
    }

    // Sort by Opportunity Score descending
    list.sort((a, b) => b.opportunityScore - a.opportunityScore);

    const responseData = {
      opportunities: list,
      metadata: {
        states: getAllStates(),
        mandis: getAllMandis(),
      },
    };

    // Cache the response
    apiCache.set(cacheKey, {
      timestamp: Date.now(),
      data: responseData,
    });

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    console.error("[api/opportunities] GET error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
