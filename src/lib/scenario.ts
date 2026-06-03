import { generateForecast, calculateOpportunityScore, ForecastResult } from "./forecast";

export interface ScenarioInput {
  commodity: string;
  mandi?: string;
  arrivalChangePct: number; // e.g. 25 for +25%, -20 for -20%
  demandChangePct: number;  // e.g. 15 for +15%, -10 for -10%
}

export interface ScenarioResult {
  commodity: string;
  mandi: string | null;
  baselinePrice: number;
  baselineDay30Price: number;
  baselineTrend: string;
  baselineOpportunityScore: number;
  baselineConfidence: number;
  baselineRiskLevel: "Low" | "Medium" | "High";

  adjustedPrice: number; // current price (typically stays same as baseline)
  adjustedDay30Price: number;
  adjustedTrend: "bullish" | "bearish" | "neutral";
  adjustedOpportunityScore: number;
  adjustedConfidence: number;
  adjustedVolatility: number;
  adjustedRiskLevel: "Low" | "Medium" | "High";

  arrivalImpactPct: number; // supply change * -0.3
  demandImpactPct: number;  // demand change * 0.4
  priceImpactPct: number;   // net day 30 impact
  oppScoreChange: number;   // adjustedOpp - baselineOpp
  confidenceAdjustment: number; // adjustedConfidence - baselineConfidence

  chartData: Array<{
    date: string;
    baseline: number;
    adjusted: number;
  }>;

  recommendation: {
    action: "BUY" | "SELL" | "HOLD" | "MONITOR";
    headline: string;
    detail: string;
  };
}

export function runScenarioSimulation(input: ScenarioInput): ScenarioResult | null {
  const { commodity, mandi, arrivalChangePct, demandChangePct } = input;

  // 1. Fetch baseline forecast (always use 30 days as requested)
  const baseline = generateForecast({ commodity, mandi, days: 30 });
  if (!baseline) return null;

  // Elasticity constants
  const supplyElasticity = -0.3; // +10% arrivals -> -3% price
  const demandElasticity = 0.4;  // +10% demand -> +4% price

  // Day 30 impact factors
  const arrivalImpactPct = arrivalChangePct * supplyElasticity;
  const demandImpactPct = demandChangePct * demandElasticity;
  const netImpactPct = arrivalImpactPct + demandImpactPct;

  // Current price is the baseline current price
  const currentPrice = baseline.currentPrice;

  // 2. Generate adjusted prices for all 30 days
  const adjustedForecastPoints = baseline.forecast.map((p, idx) => {
    const h = idx + 1; // 1 to 30
    // Shocks ramp up gradually over time
    const dayImpactPct = netImpactPct * (h / 30);
    const adjustedPrice = Math.max(10, Math.round(p.predictedPrice * (1 + dayImpactPct / 100)));
    return {
      date: p.date,
      predictedPrice: adjustedPrice,
    };
  });

  const adjustedDay30Price = adjustedForecastPoints[adjustedForecastPoints.length - 1].predictedPrice;
  const baselineDay30Price = baseline.summary.day30Price;
  const priceImpactPct = parseFloat((((adjustedDay30Price - baselineDay30Price) / baselineDay30Price) * 100).toFixed(1));

  // Recalculate trend based on adjusted price trajectory
  const adjustedPriceChange = adjustedDay30Price - currentPrice;
  const adjustedPriceChangePct = parseFloat(((adjustedPriceChange / currentPrice) * 100).toFixed(1));

  // Determine trend
  let adjustedTrend: "bullish" | "bearish" | "neutral" = "neutral";
  if (adjustedPriceChangePct > 2.1) adjustedTrend = "bullish";
  else if (adjustedPriceChangePct < -2.1) adjustedTrend = "bearish";

  // Volatility increases with the magnitude of shocks
  const shockMagnitude = Math.abs(arrivalChangePct) + Math.abs(demandChangePct);
  const adjustedVolatility = Math.min(100, Math.round(baseline.volatilityScore + shockMagnitude * 0.4));

  // Confidence decreases slightly due to simulation uncertainty
  const confidenceAdjustment = -Math.round(shockMagnitude * 0.15);
  const adjustedConfidence = Math.max(30, baseline.confidence + confidenceAdjustment);

  // Recalculate opportunity score
  const adjustedOpportunityScore = calculateOpportunityScore(
    adjustedPriceChangePct,
    adjustedConfidence,
    adjustedVolatility,
    adjustedTrend
  );

  const oppScoreChange = adjustedOpportunityScore - baseline.opportunityScore;

  // Helper to determine risk level
  const getRiskLevel = (vol: number, changePct: number): "Low" | "Medium" | "High" => {
    if (vol > 60 || changePct < -8) return "High";
    if (vol > 40 || changePct < -3) return "Medium";
    return "Low";
  };

  const baselineRiskLevel = getRiskLevel(baseline.volatilityScore, baseline.summary.priceChangePct);
  const adjustedRiskLevel = getRiskLevel(adjustedVolatility, adjustedPriceChangePct);

  // 3. Build chart comparison data
  // We align chartData entries from baseline to show the visual curve before and after.
  const chartData = baseline.chartData.map((d) => {
    // If it's a historical record (actual is not null)
    if (d.actual !== null) {
      return {
        date: d.date,
        baseline: d.actual,
        adjusted: d.actual,
      };
    }

    // It's a forecast point. Map the forecast index proportionally.
    // Calculate fractional position along the forecast timeline.
    const fIdx = baseline.chartData.indexOf(d) - baseline.chartData.findIndex(item => item.actual === null);
    const fTotal = baseline.chartData.length - baseline.chartData.findIndex(item => item.actual === null);
    const ratio = fTotal > 1 ? fIdx / (fTotal - 1) : 1;
    
    // Scale ratio to forecast days
    const day = Math.max(1, Math.min(30, Math.round(ratio * 30)));
    const dayImpactPct = netImpactPct * (day / 30);
    const adjustedVal = d.forecast ? Math.round(d.forecast * (1 + dayImpactPct / 100)) : null;

    return {
      date: d.date,
      baseline: d.forecast || 0,
      adjusted: adjustedVal || 0,
    };
  });

  // 4. Generate dynamic recommendation
  let action: "BUY" | "SELL" | "HOLD" | "MONITOR" = "MONITOR";
  let headline = "Maintain current supply levels and monitor arrivals";
  let detail = `Market forces remain balanced. Price impact is stable at ${priceImpactPct >= 0 ? "+" : ""}${priceImpactPct}%. Maintain normal selling volumes and monitor next week's arrival reports.`;

  if (priceImpactPct > 4) {
    action = adjustedOpportunityScore > 75 ? "HOLD" : "BUY";
    headline = `Hold inventory to capitalize on projected ${priceImpactPct >= 0 ? "+" : ""}${priceImpactPct}% price growth`;
    detail = `Due to simulated ${arrivalChangePct < 0 ? `reduced arrivals of ${arrivalChangePct}%` : ""} ${demandChangePct > 0 ? `increased demand of +${demandChangePct}%` : ""}, supply pressures will push prices up to ₹${adjustedDay30Price.toLocaleString("en-IN")}/q. Holding your crop is highly recommended to capture maximum returns.`;
  } else if (priceImpactPct < -4) {
    action = "SELL";
    headline = `Sell immediately before simulated supply surge depresses prices by ${priceImpactPct}%`;
    detail = `The simulated ${arrivalChangePct > 0 ? `arrival surge of +${arrivalChangePct}%` : ""} ${demandChangePct < 0 ? `demand drop of ${demandChangePct}%` : ""} will drag prices down from ₹${currentPrice.toLocaleString("en-IN")}/q to ₹${adjustedDay30Price.toLocaleString("en-IN")}/q. Liquidate 70-80% of your crop stock immediately to lock in current market rates.`;
  } else if (adjustedTrend === "bullish") {
    action = "HOLD";
    headline = "Hold inventory for moderate price gains";
    detail = `Expected return remains bullish at ${adjustedPriceChangePct >= 0 ? "+" : ""}${adjustedPriceChangePct}% over 30 days. Maintain strategic reserves and release stock selectively as prices approach ₹${adjustedDay30Price.toLocaleString("en-IN")}/q.`;
  } else if (adjustedTrend === "bearish") {
    action = "SELL";
    headline = "Sell in-season stock to mitigate falling prices";
    detail = `Simulated prices exhibit a clear downward trend (-${Math.abs(adjustedPriceChangePct)}% expected). Plan to complete selling of stored stock within 7-10 days to avoid further price erosion.`;
  }

  return {
    commodity,
    mandi: mandi ?? null,
    baselinePrice: currentPrice,
    baselineDay30Price,
    baselineTrend: baseline.trend,
    baselineOpportunityScore: baseline.opportunityScore,
    baselineConfidence: baseline.confidence,
    baselineRiskLevel,

    adjustedPrice: currentPrice,
    adjustedDay30Price,
    adjustedTrend,
    adjustedOpportunityScore,
    adjustedConfidence,
    adjustedVolatility,
    adjustedRiskLevel,

    arrivalImpactPct,
    demandImpactPct,
    priceImpactPct,
    oppScoreChange,
    confidenceAdjustment,

    chartData,

    recommendation: {
      action,
      headline,
      detail,
    },
  };
}
