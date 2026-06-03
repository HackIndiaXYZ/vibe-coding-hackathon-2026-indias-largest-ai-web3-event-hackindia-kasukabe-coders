import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import {
  getAllCommodities,
  getAllMandis,
  queryMarketData,
} from "@/lib/market-data";
import { generateForecast } from "@/lib/forecast";
import { runScenarioSimulation } from "@/lib/scenario";
import { getDatasetConfig } from "@/lib/csv-parser";
import { getDashboardSummary } from "@/lib/dashboard-helpers";

const COMMODITY_ALIASES: Record<string, string> = {
  onion: "Onion",
  onions: "Onion",
  pyaz: "Onion",
  kanda: "Onion",
  tomato: "Tomato",
  tomatoes: "Tomato",
  tamatar: "Tomato",
  potato: "Potato",
  potatoes: "Potato",
  aloo: "Potato",
  garlic: "Garlic",
  garlics: "Garlic",
  lahsun: "Garlic",
  wheat: "Wheat",
  gehun: "Wheat",
  rice: "Rice",
  paddy: "Rice",
  mustard: "Mustard",
  sarson: "Mustard",
  chilli: "Chilli",
  maize: "Maize",
  soybean: "Soybean",
};

const CLOSEST_SUGGESTIONS: Record<string, string[]> = {
  Mustard: ["Garlic", "Onion"],
  Wheat: ["Potato", "Onion"],
  Rice: ["Potato", "Onion"],
  Paddy: ["Potato", "Onion"],
  Chilli: ["Garlic", "Onion"],
  Maize: ["Potato"],
  Soybean: ["Garlic", "Onion"],
  Cotton: ["Onion", "Garlic"],
  Pulses: ["Onion", "Potato"],
};

export interface AnalystResponse {
  executiveSummary: string;
  sentiment: "bullish" | "bearish" | "neutral";
  keyDataPoints: Array<{
    label: string;
    value: string;
    type: "price" | "forecast" | "volume" | "score" | "change" | "alert";
  }>;
  confidenceScore: number;
  confidenceRationale: string;
  riskFactors: Array<{
    severity: "high" | "medium" | "low";
    description: string;
  }>;
  recommendedAction: {
    action: "BUY" | "SELL" | "HOLD" | "MONITOR";
    headline: string;
    detail: string;
  };
  dataSourcesUsed: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured. Please add it to your .env.local file." },
        { status: 500 }
      );
    }

    const userQuery = messages[messages.length - 1]?.content || "";
    const lowercaseQuery = userQuery.toLowerCase();

    // 1. Detect active commodities & mandis
    const activeCommodities = getAllCommodities();
    let detectedCommodity: string | undefined;

    for (const [alias, canonical] of Object.entries(COMMODITY_ALIASES)) {
      if (new RegExp(`\\b${alias}\\b|${alias}`, "i").test(lowercaseQuery)) {
        if (activeCommodities.includes(canonical)) {
          detectedCommodity = canonical;
          break;
        }
      }
    }

    if (!detectedCommodity) {
      for (const c of activeCommodities) {
        if (lowercaseQuery.includes(c.toLowerCase())) {
          detectedCommodity = c;
          break;
        }
      }
    }

    // Detect Mandi
    const allMandis = getAllMandis();
    let detectedMandi: string | undefined;
    for (const m of allMandis) {
      if (lowercaseQuery.includes(m.toLowerCase())) {
        detectedMandi = m;
        break;
      }
    }

    // Detect unsupported commodities mentioned by user
    let requestedUnsupported: string | undefined;
    if (!detectedCommodity) {
      const allKnownAliases = Object.keys(COMMODITY_ALIASES);
      for (const alias of allKnownAliases) {
        if (new RegExp(`\\b${alias}\\b|${alias}`, "i").test(lowercaseQuery)) {
          const canonical = COMMODITY_ALIASES[alias];
          if (!activeCommodities.includes(canonical)) {
            requestedUnsupported = canonical;
            break;
          }
        }
      }

      if (!requestedUnsupported) {
        const generalUnsupported = [
          "mustard", "wheat", "rice", "paddy", "chilli", "maize", "soybean",
          "cotton", "pulses", "apple", "mango", "banana", "coffee", "tea"
        ];
        for (const crop of generalUnsupported) {
          if (lowercaseQuery.includes(crop)) {
            requestedUnsupported = crop.charAt(0).toUpperCase() + crop.slice(1);
            break;
          }
        }
      }
    }

    // Detect if we are in simulation/scenario query mode
    let simulatedScenario: any = null;
    let isScenarioMode = false;
    let arrivalChange = 0;
    let demandChange = 0;

    const summary = getDashboardSummary();
    const { readiness, datasetMode, recordCount } = summary;
    const isForecastReady = readiness.status === "ready";
    const modeLabel = datasetMode === "uploaded" ? "AGMARKNET Upload" : "Demo Dataset";

    if (isForecastReady && /(?:happen|simulate|scenario|what if|if\s+)/i.test(lowercaseQuery)) {
      // Parse arrival change %
      const arrivalMatch = lowercaseQuery.match(/(?:arrival|arrivals|supply)\s+(?:change|increase|decrease|rise|fall|drop|up|down|growth|surge|shortage|oversupply)\s*(?:by|to)?\s*([+-]?\d+)\s*%/i);
      if (arrivalMatch) {
        arrivalChange = parseInt(arrivalMatch[1], 10);
        const directionMatch = lowercaseQuery.match(/(?:arrival|arrivals|supply)\s+(?:decrease|fall|drop|down|shortage)/i);
        if (directionMatch && arrivalChange > 0) {
          arrivalChange = -arrivalChange;
        }
      }

      // Parse demand change %
      const demandMatch = lowercaseQuery.match(/(?:demand)\s+(?:change|increase|decrease|rise|fall|drop|up|down|growth|surge|shortage)\s*(?:by|to)?\s*([+-]?\d+)\s*%/i);
      if (demandMatch) {
        demandChange = parseInt(demandMatch[1], 10);
        const directionMatch = lowercaseQuery.match(/(?:demand)\s+(?:decrease|fall|drop|down|shortage)/i);
        if (directionMatch && demandChange > 0) {
          demandChange = -demandChange;
        }
      }

      if ((arrivalChange !== 0 || demandChange !== 0) && detectedCommodity) {
        const sim = runScenarioSimulation({
          commodity: detectedCommodity,
          mandi: detectedMandi,
          arrivalChangePct: arrivalChange,
          demandChangePct: demandChange,
        });
        if (sim) {
          simulatedScenario = sim;
          isScenarioMode = true;
        }
      }
    }

    // Parse for general Opportunity Scanner portfolio ranking queries
    let opportunitiesContext = "";
    if (isForecastReady && /(?:sell\s+(?:right\s+now|today)|highest\s+upside|riskiest|opportunity|opportunities|rank\s+all|scanner|what\s+should\s+an\s+fpo)/i.test(lowercaseQuery)) {
      const oppList = [];
      for (const commodity of activeCommodities) {
        const fc = generateForecast({ commodity, days: 30 });
        if (fc) {
          const volatility = fc.volatilityScore;
          const priceChangePct = fc.summary.priceChangePct;
          const opportunityScore = fc.opportunityScore;
          
          let riskLevel: "Low" | "Medium" | "High" = "Low";
          if (volatility > 60 || priceChangePct < -8) riskLevel = "High";
          else if (volatility > 40 || priceChangePct < -3) riskLevel = "Medium";

          let decisionSignal: "Strong Buy" | "Buy" | "Hold" | "Monitor" | "Avoid" = "Monitor";
          if (opportunityScore >= 80 && riskLevel !== "High") decisionSignal = "Strong Buy";
          else if (opportunityScore >= 65 && riskLevel !== "High") decisionSignal = "Buy";
          else if (opportunityScore >= 45) decisionSignal = "Hold";
          else if (opportunityScore < 40 && riskLevel === "High") decisionSignal = "Avoid";
          
          oppList.push({
            commodity: fc.commodity,
            currentPrice: fc.currentPrice,
            day30Price: fc.summary.day30Price,
            priceChangePct,
            confidence: fc.confidence,
            volatility,
            trend: fc.trend,
            opportunityScore,
            riskLevel,
            decisionSignal,
          });
        }
      }
      // Sort by Opportunity Score descending
      oppList.sort((a, b) => b.opportunityScore - a.opportunityScore);
      
      opportunitiesContext = `
## DYNAMIC OPPORTUNITY SCANNER PORTFOLIO RANKINGS (Live Data):
Use these real-time mathematical rankings to answer questions about what FPOs should sell, hold, or buy:
${oppList.map((o, idx) => `${idx + 1}. **${o.commodity}**
   - Current Price: ₹${o.currentPrice.toLocaleString("en-IN")}/q
   - 30-Day Forecast: ₹${o.day30Price.toLocaleString("en-IN")}/q (Expected change: ${o.priceChangePct >= 0 ? "+" : ""}${o.priceChangePct}%)
   - Trend Sentiment: ${o.trend.toUpperCase()}
   - Confidence Score: ${o.confidence}%
   - Volatility Score: ${o.volatility}% (Risk Level: ${o.riskLevel})
   - Opportunity Score: ${o.opportunityScore}/100
   - **Executive Decision Signal**: **${o.decisionSignal.toUpperCase()}**`).join("\n\n")}
`;
    }

    // 2. Build dynamic contextual system prompt
    let dynamicContext = `You are MandiMind AI Analyst — an expert agricultural market intelligence assistant for Indian commodity markets.
You have deep knowledge of mandi (agricultural market) pricing, supply/demand dynamics, seasonal patterns, and trade flows across India.

## ACTIVE SYSTEM DATA SOURCE
- **Data Source Mode**: ${modeLabel}
- **Active Record Count**: ${recordCount.toLocaleString("en-IN")} records
- **Unique Dates Count**: ${readiness.uniqueDates}
- **Readiness Status**: ${readiness.label}
Use these exact numbers when referring to data validity, counts, or the currently selected dataset config.

`;

    if (isScenarioMode && simulatedScenario) {
      const sim = simulatedScenario;
      dynamicContext += `## SIMULATED SCENARIO ACTIVE
The user is explicitly running a hypothetical market stress-test scenario:
- **Target Commodity**: ${sim.commodity}
- **Mandi Filter**: ${sim.mandi || "Average across all markets"}
- **Arrival Change**: ${arrivalChange}% (Elasticity Impact: ${sim.arrivalImpactPct >= 0 ? "+" : ""}${sim.arrivalImpactPct}%)
- **Demand Change**: ${demandChange}% (Elasticity Impact: ${sim.demandImpactPct >= 0 ? "+" : ""}${sim.demandImpactPct}%)
- **Simulated Net Price Impact**: ${sim.priceImpactPct >= 0 ? "+" : ""}${sim.priceImpactPct}% at Day 30

### SIMULATED METRICS:
- **Current Price**: ₹${sim.baselinePrice.toLocaleString("en-IN")}/q
- **Baseline Day-30 Price**: ₹${sim.baselineDay30Price.toLocaleString("en-IN")}/q
- **Simulated Day-30 Price**: ₹${sim.adjustedDay30Price.toLocaleString("en-IN")}/q
- **Baseline Opportunity Score**: ${sim.baselineOpportunityScore}
- **Simulated Opportunity Score**: ${sim.adjustedOpportunityScore} (Change: ${sim.oppScoreChange >= 0 ? "+" : ""}${sim.oppScoreChange})
- **Simulated Volatility Score**: ${sim.adjustedVolatility}%
- **Simulated Confidence Score**: ${sim.adjustedConfidence}%
- **Simulated Risk Level**: ${sim.adjustedRiskLevel} (Baseline was: ${sim.baselineRiskLevel})

### SIMULATED RECOMMENDATION:
- **Action**: ${sim.recommendation.action}
- **Headline**: ${sim.recommendation.headline}
- **Detail**: ${sim.recommendation.detail}

## INSTRUCTIONS FOR SIMULATED SCENARIOS:
1. You MUST address the user's simulation query directly, explain the elasticities (Supply: -0.3, Demand: +0.4), and explain how the arrival/demand shock shifts the baseline forecast.
2. In your "executiveSummary" and "recommendedAction" details, you MUST explicitly cite and mention the *simulated* forecast values instead of the baseline values (e.g. citing the Simulated Day-30 Price of ₹${sim.adjustedDay30Price.toLocaleString("en-IN")}/q, the expected price change, and simulated opportunity score of ${sim.adjustedOpportunityScore}).
3. Under "keyDataPoints", include exactly:
   - "Current Price" (e.g. ₹${sim.baselinePrice.toLocaleString("en-IN")}/q)
   - "Baseline Day-30 Price" (e.g. ₹${sim.baselineDay30Price.toLocaleString("en-IN")}/q)
   - "Simulated Day-30 Price" (e.g. ₹${sim.adjustedDay30Price.toLocaleString("en-IN")}/q)
   - "Price Impact" (e.g. ${sim.priceImpactPct >= 0 ? "+" : ""}${sim.priceImpactPct}%)
   - "Simulated Opportunity Score" (e.g. ${sim.adjustedOpportunityScore})
   - "Simulated Confidence" (e.g. ${sim.adjustedConfidence}%)
4. Ensure your "sentiment" reflects the simulated adjusted trend: "${sim.adjustedTrend}".
5. Set your "dataSourcesUsed" to ["Forecast Engine", "Market Trend Analysis", "Elasticity Scenario Simulator"].
`;
    } else if (opportunitiesContext) {
      // Append Opportunity Scanner Rankings context
      dynamicContext += opportunitiesContext + `
## CRITICAL DYNAMIC OPPORTUNITY SCANNER INSTRUCTIONS:
1. If the user asks about crop rankings, upside, risks, or what to sell, you MUST explicitly analyze the **DYNAMIC OPPORTUNITY SCANNER PORTFOLIO RANKINGS** provided above.
2. Refer directly to the **Opportunity Score (0-100)** and **Executive Decision Signals** (Strong Buy, Buy, Hold, Monitor, Avoid).
3. Do not invent decision signals; strictly cite the computed signals from the Rankings above (e.g., Garlic is 'STRONG BUY', Onion is 'BUY', Potato is 'HOLD', Tomato is 'AVOID').
4. Under "keyDataPoints", include exactly:
   - "Top Opportunity" (e.g., Garlic with Opportunity Score 91)
   - "Highest Risk Crop" (e.g., Tomato with Volatility Score 76)
   - "Executive Recommendation" (e.g., Hold Onion, Avoid Tomato)
   - "Opportunity Score" or "Confidence Score"
5. Set your "dataSourcesUsed" to ["Forecast Engine", "Market Trend Analysis", "Opportunity Scanner Engine"].
`;
    } else if (detectedCommodity) {
      // Specific commodity requested
      const md = queryMarketData({ commodity: detectedCommodity, mandi: detectedMandi });
      const fc = isForecastReady ? generateForecast({ commodity: detectedCommodity, mandi: detectedMandi }) : null;

      if (fc && md) {
        let recentMovementStr = "Insufficient monthly data.";
        if (md.monthly && md.monthly.length >= 2) {
          const latestMonthObj = md.monthly[md.monthly.length - 1];
          const prevMonthObj = md.monthly[md.monthly.length - 2];
          const diff = latestMonthObj.avgPrice - prevMonthObj.avgPrice;
          const diffPct = ((diff / prevMonthObj.avgPrice) * 100).toFixed(1);
          recentMovementStr = `${latestMonthObj.month} average price: ₹${latestMonthObj.avgPrice.toLocaleString("en-IN")}/q vs ${prevMonthObj.month} average price: ₹${prevMonthObj.avgPrice.toLocaleString("en-IN")}/q (${diff >= 0 ? "+" : ""}${diffPct}%)`;
        }

        dynamicContext += `## REAL-TIME MARKET DATA FOR ${detectedCommodity.toUpperCase()}${detectedMandi ? ` IN ${detectedMandi.toUpperCase()}` : ""}
- **Current Modal Price**: ₹${fc.currentPrice.toLocaleString("en-IN")}/q
- **30-Day Statistical Forecast**: ₹${fc.summary.day30Price.toLocaleString("en-IN")}/q (Expected change: ${fc.summary.priceChangePct >= 0 ? "+" : ""}${fc.summary.priceChangePct}%)
- **Forecast Trend**: ${fc.trend.toUpperCase()}
- **Forecast Confidence Score**: ${fc.confidence}%
- **Volatility Score**: ${fc.volatilityScore}%
- **Opportunity Score**: ${fc.opportunityScore}%
- **Recent Price Movement**: ${recentMovementStr}

### Historical Monthly Averages:
${md.monthly.map(m => `- ${m.month} ${m.year}: Avg ₹${m.avgPrice.toLocaleString("en-IN")}/q, Min ₹${m.minPrice.toLocaleString("en-IN")}/q, Max ₹${m.maxPrice.toLocaleString("en-IN")}/q, Volume ${m.totalVolume.toLocaleString("en-IN")}q`).join("\n")}

### Top Mandis for ${detectedCommodity}:
${md.mandis.slice(0, 3).map((m, idx) => `${idx + 1}. ${m.mandi}, ${m.state} (Avg price: ₹${m.avgPrice.toLocaleString("en-IN")}/q, Latest price: ₹${m.latestPrice.toLocaleString("en-IN")}/q, Volume: ${m.totalVolume.toLocaleString("en-IN")}q)`).join("\n")}
`;
      } else if (md && md.records.length > 0) {
        // Fallback descriptive market context for locked forecasting
        const prices = md.records.map(r => r.modalPrice).filter(p => p > 0);
        const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
        const maxPrice = prices.length ? Math.max(...prices) : 0;
        const minPrice = prices.length ? Math.min(...prices) : 0;
        const totalVolume = md.records.reduce((sum, r) => sum + r.arrivalQty, 0);

        dynamicContext += `## DESCRIPTIVE MARKET DATA FOR ${detectedCommodity.toUpperCase()}${detectedMandi ? ` IN ${detectedMandi.toUpperCase()}` : ""} (Forecasting Locked)
- **Available Record Count**: ${md.records.length} records
- **Average Price in Dataset**: ₹${avgPrice.toLocaleString("en-IN")}/q
- **Min Price in Dataset**: ₹${minPrice.toLocaleString("en-IN")}/q
- **Max Price in Dataset**: ₹${maxPrice.toLocaleString("en-IN")}/q
- **Total Inflow Volume**: ${totalVolume.toLocaleString("en-IN")} quintals

### Available Monthly Averages:
${md.monthly.map(m => `- ${m.month} ${m.year}: Avg ₹${m.avgPrice.toLocaleString("en-IN")}/q, Volume ${m.totalVolume.toLocaleString("en-IN")}q`).join("\n")}

### Mandis with Data:
${md.mandis.slice(0, 5).map((m, idx) => `${idx + 1}. ${m.mandi}, ${m.state} (Avg price: ₹${m.avgPrice.toLocaleString("en-IN")}/q, Volume: ${m.totalVolume.toLocaleString("en-IN")}q)`).join("\n")}
`;
      } else {
        dynamicContext += `No historical data is available for ${detectedCommodity}${detectedMandi ? ` in ${detectedMandi}` : ""}. Tell the user you cannot analyze this crop due to lack of AGMARKNET CSV records.`;
      }
    } else if (requestedUnsupported) {
      // Requested unsupported commodity
      const suggestions = CLOSEST_SUGGESTIONS[requestedUnsupported] || ["Onion", "Garlic"];
      let alternativeData = "";
      for (const crop of suggestions) {
        if (activeCommodities.includes(crop)) {
          const fc = isForecastReady ? generateForecast({ commodity: crop }) : null;
          if (fc) {
            alternativeData += `
### Suggested Monitored Crop: ${crop}
- **Current Price**: ₹${fc.currentPrice.toLocaleString("en-IN")}/q
- **30-Day Forecast**: ₹${fc.summary.day30Price.toLocaleString("en-IN")}/q (${fc.summary.priceChangePct >= 0 ? "+" : ""}${fc.summary.priceChangePct}%)
- **Forecast Trend**: ${fc.trend.toUpperCase()}
- **Confidence**: ${fc.confidence}%
- **Volatility**: ${fc.volatilityScore}%
- **Opportunity Score**: ${fc.opportunityScore}%
`;
          }
        }
      }

      dynamicContext += `## IMPORTANT: REQUESTED COMMODITY "${requestedUnsupported.toUpperCase()}" IS UNSUPPORTED
- The user is asking about "${requestedUnsupported}", which is NOT in the database.
- We ONLY have active AGMARKNET CSV records for: ${activeCommodities.join(", ")}.
- You MUST politely explain that we do not have data for "${requestedUnsupported}" due to missing AGMARKNET CSV data files, and recommend looking at the closest monitored alternatives: ${suggestions.join(" and ")}.
- Suggest analyzing one of these alternative crops instead, and explain how they relate to the Rabi/Kharif season or similar trading profiles.
- Set your confidenceScore to a low value (e.g. 30-45%) and make sure your recommended action reflects monitoring these supported alternatives instead.

### REAL-TIME METRICS FOR RECOMMENDED MONITORED ALTERNATIVES:
${alternativeData}
`;
    } else {
      // General overview / crop comparison
      let allCropsContext = "";
      for (const crop of activeCommodities) {
        const md = queryMarketData({ commodity: crop });
        if (isForecastReady) {
          const fc = generateForecast({ commodity: crop });
          if (fc && md) {
            let recentMovementStr = "N/A";
            if (md.monthly && md.monthly.length >= 2) {
              const latestMonthObj = md.monthly[md.monthly.length - 1];
              const prevMonthObj = md.monthly[md.monthly.length - 2];
              const diff = latestMonthObj.avgPrice - prevMonthObj.avgPrice;
              const diffPct = ((diff / prevMonthObj.avgPrice) * 100).toFixed(1);
              recentMovementStr = `${latestMonthObj.month} avg ₹${latestMonthObj.avgPrice.toLocaleString("en-IN")}/q vs ${prevMonthObj.month} avg ₹${prevMonthObj.avgPrice.toLocaleString("en-IN")}/q (${diff >= 0 ? "+" : ""}${diffPct}%)`;
            }

            allCropsContext += `
### Commodity: ${crop}
- **Current Price**: ₹${fc.currentPrice.toLocaleString("en-IN")}/q
- **30-Day Forecast**: ₹${fc.summary.day30Price.toLocaleString("en-IN")}/q (${fc.summary.priceChangePct >= 0 ? "+" : ""}${fc.summary.priceChangePct}%)
- **Forecast Trend**: ${fc.trend.toUpperCase()}
- **Confidence Score**: ${fc.confidence}%
- **Volatility Score**: ${fc.volatilityScore}%
- **Opportunity Score**: ${fc.opportunityScore}%
- **Recent Price Movement**: ${recentMovementStr}
- **Top Markets**: ${md.mandis.slice(0, 2).map(m => `${m.mandi} (${m.state})`).join(", ")}
`;
          }
        } else if (md && md.records.length > 0) {
          const prices = md.records.map(r => r.modalPrice).filter(p => p > 0);
          const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
          const maxPrice = prices.length ? Math.max(...prices) : 0;
          const minPrice = prices.length ? Math.min(...prices) : 0;
          const totalVolume = md.records.reduce((sum, r) => sum + r.arrivalQty, 0);

          allCropsContext += `
### Commodity: ${crop} (Forecasting Locked)
- **Available Records**: ${md.records.length} records
- **Average Price**: ₹${avgPrice.toLocaleString("en-IN")}/q
- **Price Range**: ₹${minPrice.toLocaleString("en-IN")} to ₹${maxPrice.toLocaleString("en-IN")}/q
- **Total Volume**: ${totalVolume.toLocaleString("en-IN")} quintals
- **Top Markets**: ${md.mandis.slice(0, 2).map(m => `${m.mandi} (${m.state})`).join(", ")}
`;
        }
      }

      dynamicContext += `## LIVE SYSTEM MARKET DATA (All Monitored Commodities)
Use these exact real-time numbers to rank the highest opportunity crops, compare trends, and answer questions.
${allCropsContext}
`;
    }

    if (!isForecastReady) {
      dynamicContext += `
## CRITICAL SAFETY: FORECASTING SERVICE IS LOCKED/OFFLINE
- **Lock Reason**: The active dataset has insufficient history (${readiness.uniqueDates} unique dates in system). We require a minimum of 30 unique dates (Recommended: 180+ dates) to build sequential historical series for training OLS regression or Holt's double smoothing models.
- **Rules when Forecasting is Locked**:
  1. Inform the user directly in "executiveSummary" that forecasting, price forecasts, opportunity scanning/rankings, and scenario simulation cannot be generated or simulated due to limited historical data. Use clear, helpful, and professional language to explain that a single-day snapshot or insufficient time series coordinates lacks chronological structure to model trends.
  2. Still answer descriptive or historical questions using the available records in the dataset. For example, if they ask what crops are present, what states are covered, or what the current price or maximum/minimum price is in the dataset, you MUST answer accurately using the real-time record facts provided.
  3. Do NOT fabricate any forecasts, confidence scores, opportunity scores, risk severity, price targets, or decision signal metrics. Do not invent future prices.
  4. In the JSON schema response, you MUST return:
     - "sentiment": "neutral"
     - "confidenceScore": 0
     - "confidenceRationale": "Forecasting is disabled due to limited historical data (${readiness.uniqueDates}/30 unique dates)."
     - "recommendedAction": {
         "action": "MONITOR",
         "headline": "Upload historical dataset (min 30 dates)",
         "detail": "Please navigate to the Data Importer page and upload an AGMARKNET export file containing at least 30 separate historical date intervals (recommended 180+) to enable predictive forecasting and simulations."
       }
     - "keyDataPoints": Show descriptive metrics (e.g., "Active Commodities", "Monitored Mandis", "Available Records") using actual dataset facts, but do NOT include "30-Day Forecast", "Expected Change", "Opportunity Score", or future-facing metrics (set value to "Unavailable" or "N/A" if they must be shown, or omit them).
`;
    }

    // Add rules and formatting instructions
    dynamicContext += `
## CRITICAL INSTRUCTIONS

You MUST respond ONLY with a valid JSON object. No explanations, no markdown, no text outside the JSON.

Your JSON response must follow EXACTLY this schema:

{
  "executiveSummary": "2-3 sentence summary of the core market insight and outlook. Be direct and specific. You MUST explicitly cite the exact forecast values (e.g. Current Price, 30-Day Forecast, expected change %, confidence, volatility) if available. If forecasting is unavailable due to insufficient history, clearly explain that limitation.",
  "sentiment": "bullish" | "bearish" | "neutral",
  "keyDataPoints": [
    { "label": "string (e.g. Current Price)", "value": "string (e.g. ₹2,800/q)", "type": "price" | "forecast" | "volume" | "score" | "change" | "alert" }
  ],
  "confidenceScore": <integer 0-100>,
  "confidenceRationale": "1-2 sentences explaining the confidence level.",
  "riskFactors": [
    { "severity": "high" | "medium" | "low", "description": "string" }
  ],
  "recommendedAction": {
    "action": "BUY" | "SELL" | "HOLD" | "MONITOR",
    "headline": "Short imperative sentence (e.g. Sell 60% inventory within 7 days)",
    "detail": "2-3 sentences with specifics: quantities, mandis, timing, price targets."
  },
  "dataSourcesUsed": ["AGMARKNET Historical Data", "Forecast Engine", "Market Trend Analysis"]
}

## CRITICAL CITATION AND SCHEMA RULES:
1. **Cite actual forecast values**: If forecasting is available, you MUST explicitly cite and mention the exact forecast values used in your executiveSummary and recommendedAction details (e.g. 'Current Price of ₹2,800/q', '30-day forecast of ₹3,000/q (+6.9% expected change)', 'confidence score of 73%'). Do not invent numbers!
2. **keyDataPoints**: Include 4-6 items maximum. If forecasting is active, include:
   - "Current Price" (e.g., ₹2,800/q)
   - "30-Day Forecast" (e.g., ₹3,000/q)
   - "Expected Change" (e.g., +6.9%)
   - "Confidence Score" (e.g., 73%)
   - "Volatility Score" (e.g., 12%)
   - "Opportunity Score" (e.g., 85)
   If forecasting is locked, include descriptive metrics like "Active Commodities", "Monitored Mandis", "Total Records".
3. **dataSourcesUsed**: You MUST populate this array with appropriate sources. If analyzing monitored crops, use:
   - "AGMARKNET Historical Data"
   - "Forecast Engine"
   - "Market Trend Analysis"
   If analyzing an unsupported crop, include "Spelling & Match Engine" only.
4. **Unsupported Crops**: If asked about an unsupported crop, explicitly list the reason in the executiveSummary (lack of CSV records) and recommend the supported alternatives. Use a lower confidenceScore (30-45%) and make sure "dataSourcesUsed" is ["Spelling & Match Engine"].
5. **ALWAYS return valid JSON**. Never include trailing commas, comments, or non-JSON text.
`;

    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: dynamicContext,
        },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      temperature: 0.2,
      max_tokens: 1000,
      stream: false,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content || "{}";

    let structured: AnalystResponse;
    try {
      structured = JSON.parse(raw) as AnalystResponse;
    } catch {
      // Fallback: attempt to extract JSON from the raw string
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        structured = JSON.parse(jsonMatch[0]) as AnalystResponse;
      } else {
        throw new Error("AI returned malformed JSON. Please try again.");
      }
    }

    return NextResponse.json({
      structured,
      model: completion.model,
      usage: completion.usage,
    });
  } catch (error: unknown) {
    console.error("Groq API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to get analysis: ${message}` },
      { status: 500 }
    );
  }
}
