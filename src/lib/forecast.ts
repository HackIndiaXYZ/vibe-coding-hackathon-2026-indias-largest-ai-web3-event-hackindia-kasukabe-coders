import { queryMarketData } from "./market-data";
import type { MarketRecord } from "./csv-parser";

// ─── Public Output Types ───────────────────────────────────────────────────────

export interface ForecastPoint {
  date: string;        // ISO "YYYY-MM-DD"
  dayIndex: number;    // 1-indexed from today
  predictedPrice: number;
}

export interface ForecastResult {
  commodity: string;
  mandi: string | null;
  trend: "bullish" | "bearish" | "neutral";
  currentPrice: number;
  baseDate: string;          // last date in historical data
  forecast: ForecastPoint[];
  confidence: number;        // 0-100
  lowerBound: number[];      // one per forecast day
  upperBound: number[];      // one per forecast day
  volatilityScore: number;   // 0-100 (higher = more volatile)
  opportunityScore: number;  // 0-100 (higher = better opportunity)
  dataPoints: number;        // historical records used
  method: string;
  summary: {
    expectedHigh: number;
    expectedLow: number;
    expectedAvg: number;
    day30Price: number;
    priceChange: number;     // day30 - current
    priceChangePct: number;  // %
  };
  // For chart rendering: merged historical + forecast
  chartData: ChartDataPoint[];
}

export interface ChartDataPoint {
  date: string;           // label for X-axis
  actual: number | null;  // historical price
  forecast: number | null;
  low: number | null;     // lower confidence bound
  high: number | null;    // upper confidence bound
}

// ─── Internal Types ────────────────────────────────────────────────────────────

interface TimeSeries {
  dates: Date[];
  prices: number[];
}

interface HoltsState {
  level: number;
  trend: number;
  fitted: number[];
  residuals: number[];
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function toIsoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

// ─── Statistics Helpers ───────────────────────────────────────────────────────

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length);
}

/**
 * Simple linear regression: y = a + b*x
 * Returns slope (b) and intercept (a).
 */
function linearRegression(xs: number[], ys: number[]): { slope: number; intercept: number; r2: number } {
  const n = xs.length;
  const xMean = mean(xs);
  const yMean = mean(ys);
  const ssxy = xs.reduce((sum, x, i) => sum + (x - xMean) * (ys[i] - yMean), 0);
  const ssxx = xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0);
  const slope = ssxx === 0 ? 0 : ssxy / ssxx;
  const intercept = yMean - slope * xMean;
  const yFitted = xs.map((x) => intercept + slope * x);
  const ssTot = ys.reduce((sum, y) => sum + (y - yMean) ** 2, 0);
  const ssRes = ys.reduce((sum, y, i) => sum + (y - yFitted[i]) ** 2, 0);
  const r2 = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);
  return { slope, intercept, r2 };
}

/**
 * Holt's Double Exponential Smoothing (trend-adjusted).
 * Works best on data with a consistent trend direction.
 * α (level) and β (trend) tuned for weekly agricultural price series.
 */
function holtsSmoothing(prices: number[], alpha = 0.35, beta = 0.12): HoltsState {
  if (prices.length < 2) {
    return {
      level: prices[0] ?? 0,
      trend: 0,
      fitted: prices.slice(),
      residuals: [0],
    };
  }

  let level = prices[0];
  let trend = prices[1] - prices[0];
  const fitted: number[] = [level];
  const residuals: number[] = [0]; // first residual undefined

  for (let t = 1; t < prices.length; t++) {
    const prevLevel = level;
    level = alpha * prices[t] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    fitted.push(level + trend);
    residuals.push(prices[t] - fitted[t]);
  }

  return { level, trend, fitted, residuals };
}

// ─── Data Preparation ─────────────────────────────────────────────────────────

/**
 * Aggregate records into a sorted daily time series.
 * If multiple mandis on the same date, average their prices.
 */
function buildTimeSeries(records: MarketRecord[]): TimeSeries {
  // Group by date string
  const byDate = new Map<string, number[]>();
  for (const r of records) {
    if (r.modalPrice <= 0) continue;
    const key = r.dateStr;
    const arr = byDate.get(key) ?? [];
    arr.push(r.modalPrice);
    byDate.set(key, arr);
  }

  // Sort dates and compute average price per date
  const sorted = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateStr, prices]) => ({
      date: new Date(dateStr + "T00:00:00Z"),
      price: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    }));

  return {
    dates: sorted.map((d) => d.date),
    prices: sorted.map((d) => d.price),
  };
}

// ─── Confidence & Volatility ──────────────────────────────────────────────────

/**
 * RMSE of model on training data.
 */
function rmse(actual: number[], fitted: number[]): number {
  const n = Math.min(actual.length, fitted.length);
  if (n === 0) return 0;
  return Math.sqrt(
    actual.slice(0, n).reduce((sum, val, i) => sum + (val - fitted[i]) ** 2, 0) / n
  );
}

/**
 * Confidence interval half-width at horizon h (days).
 * Grows proportionally to sqrt(h) — standard time-series practice.
 * z = 1.28 → 80% CI, which is a reasonable disclosure for agricultural markets.
 */
function ciHalfWidth(baseRmse: number, h: number, z = 1.28): number {
  return z * baseRmse * Math.sqrt(h / 7); // normalised by weekly observation period
}

/**
 * Overall confidence score (0-100).
 * Penalised by volatility, insufficient data, and high forecast RMSE.
 */
function computeConfidence(
  dataPoints: number,
  volatility: number,
  r2: number,
  rmseRatio: number // RMSE / currentPrice
): number {
  const dataScore = Math.min(40, (dataPoints / 26) * 40); // 26 obs = 6 months of weekly data → full 40pts
  const r2Score = r2 * 30; // R² up to 30pts
  const volPenalty = Math.min(20, volatility * 0.25);
  const rmsePenalty = Math.min(20, rmseRatio * 300);
  const raw = dataScore + r2Score - volPenalty - rmsePenalty + 10; // +10 base
  return Math.max(30, Math.min(95, Math.round(raw)));
}

/**
 * Volatility score 0-100 based on coefficient of variation.
 * CV = (std / mean) * 100
 * Agricultural prices typically have CV 5-25%. We map:
 *   CV ≤ 5%  → score 10
 *   CV = 15% → score 50
 *   CV ≥ 30% → score 100
 */
function volatilityScore(prices: number[]): number {
  if (prices.length < 3) return 50;
  const cv = (stdDev(prices) / mean(prices)) * 100;
  return Math.max(5, Math.min(100, Math.round((cv / 30) * 100)));
}

// ─── Trend Classification ─────────────────────────────────────────────────────

/**
 * Classify trend from the regression slope (per-week) relative to current price.
 * Bullish if slope > +0.5% per week, bearish if < -0.5%.
 */
function classifyTrend(
  weeklySlope: number,
  currentPrice: number
): "bullish" | "bearish" | "neutral" {
  const pctPerWeek = (weeklySlope / currentPrice) * 100;
  if (pctPerWeek > 0.5) return "bullish";
  if (pctPerWeek < -0.5) return "bearish";
  return "neutral";
}

/**
 * Calculate risk-adjusted opportunity score (0-100)
 */
export function calculateOpportunityScore(
  priceChangePct: number,
  confidence: number,
  volatility: number,
  trend: "bullish" | "bearish" | "neutral"
): number {
  let score = 50;

  // 1. Expected Return (weight: up to 30 points)
  score += priceChangePct * 2;

  // 2. Confidence (weight: up to 20 points)
  score += (confidence - 70) * 0.5;

  // 3. Volatility penalty (weight: up to -15 points)
  score -= (volatility - 30) * 0.3;

  // 4. Trend strength (weight: up to 15 points)
  if (trend === "bullish") score += 15;
  if (trend === "bearish") score -= 20;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ─── Forecast Cache ───────────────────────────────────────────────────────────

interface CacheEntry {
  timestamp: number;
  result: ForecastResult;
}

const forecastCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ─── Main Forecast Engine ─────────────────────────────────────────────────────

export interface ForecastInput {
  commodity: string;
  mandi?: string;
  state?: string;
  days?: number; // default 30
}

export function generateForecast(input: ForecastInput): ForecastResult | null {
  const { commodity, mandi, state, days = 30 } = input;

  // Check 10-minute cache
  const cacheKey = `${commodity.toLowerCase()}||${(mandi || "").toLowerCase()}||${(state || "").toLowerCase()}||${days}`;
  const cached = forecastCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[forecast-cache] Cache hit for ${cacheKey}`);
    return cached.result;
  }

  // ── 1. Fetch historical data ────────────────────────────────────────────
  const result = queryMarketData({
    commodity,
    mandi: mandi || undefined,
    state: state || undefined,
  });

  if (result.records.length < 4) {
    return null; // insufficient data
  }

  // ── 2. Build clean time series ──────────────────────────────────────────
  const ts = buildTimeSeries(result.records);
  const { prices } = ts;
  const n = prices.length;

  if (n < 2) return null;

  // ── 3. Linear regression (per-observation index, not per day) ──────────
  const xs = Array.from({ length: n }, (_, i) => i);
  const reg = linearRegression(xs, prices);
  const regressionFitted = xs.map((x) => reg.intercept + reg.slope * x);

  // ── 4. Holt's smoothing ─────────────────────────────────────────────────
  // Use alpha/beta tuned for weekly agricultural series
  const holts = holtsSmoothing(prices);

  // ── 5. Blend regression + Holt's (60/40 weight → Holt's more reactive) ─
  const blendedLevel =
    0.4 * (reg.intercept + reg.slope * n) + 0.6 * holts.level;
  const blendedTrend =
    0.4 * reg.slope + 0.6 * holts.trend;

  // ── 6. Estimate avg days between observations ───────────────────────────
  const firstDate = ts.dates[0];
  const lastDate = ts.dates[n - 1];
  const totalDays = (lastDate.getTime() - firstDate.getTime()) / 86_400_000;
  const avgDaysBetweenObs = totalDays / (n - 1) || 7; // default to weekly

  // Convert blended trend from per-observation to per-day
  const dailyTrend = blendedTrend / avgDaysBetweenObs;

  // ── 7. Current price = last actual price ────────────────────────────────
  const currentPrice = prices[n - 1];

  // ── 8. Model error metrics ──────────────────────────────────────────────
  // Blended RMSE from both components
  const rmseHolts = rmse(prices.slice(1), holts.fitted.slice(1));
  const rmseReg = rmse(prices, regressionFitted);
  const baseRmse = 0.6 * rmseHolts + 0.4 * rmseReg;
  const rmseRatio = currentPrice > 0 ? baseRmse / currentPrice : 0.05;

  // Volatility
  const volScore = volatilityScore(prices);

  // ── 9. Generate 30-day forecast ─────────────────────────────────────────
  const forecastPoints: ForecastPoint[] = [];
  const lowerBound: number[] = [];
  const upperBound: number[] = [];

  // Damping: reduce trend impact after ~2 weeks to avoid runaway forecasts
  const dampingFactor = 0.98; // compound per day

  let runningPrice = blendedLevel;
  let runningTrend = dailyTrend;

  for (let h = 1; h <= days; h++) {
    runningTrend *= dampingFactor;
    runningPrice = Math.max(0, blendedLevel + runningTrend * h);

    const hw = ciHalfWidth(baseRmse, h);
    const lo = Math.max(0, Math.round(runningPrice - hw));
    const hi = Math.round(runningPrice + hw);

    const date = addDays(lastDate, h);

    forecastPoints.push({
      date: toIsoDate(date),
      dayIndex: h,
      predictedPrice: Math.round(runningPrice),
    });
    lowerBound.push(lo);
    upperBound.push(hi);
  }

  // ── 10. Metrics ─────────────────────────────────────────────────────────
  const forecastPrices = forecastPoints.map((p) => p.predictedPrice);
  const trend = classifyTrend(blendedTrend, currentPrice);
  const confidence = computeConfidence(n, volScore, reg.r2, rmseRatio);
  const day30Price = forecastPoints[forecastPoints.length - 1].predictedPrice;
  const priceChange = day30Price - currentPrice;
  const priceChangePct = parseFloat(((priceChange / currentPrice) * 100).toFixed(1));
  const opportunityScore = calculateOpportunityScore(priceChangePct, confidence, volScore, trend);

  // ── 11. Chart data: historical + forecast merged ─────────────────────────
  // Show last 12 historical points (to keep chart readable)
  const histWindow = Math.min(n, 12);
  const chartData: ChartDataPoint[] = [];

  // Historical portion
  for (let i = n - histWindow; i < n; i++) {
    chartData.push({
      date: formatDateLabel(ts.dates[i]),
      actual: prices[i],
      forecast: i === n - 1 ? prices[i] : null, // connect at transition
      low: null,
      high: null,
    });
  }

  // Transition point already in historical — add a connector forecast point
  // Then forecast portion (every 3rd day to avoid crowding chart, max ~10 points)
  const step = Math.max(1, Math.floor(days / 10));
  for (let h = step; h <= days; h += step) {
    const idx = h - 1; // 0-indexed
    chartData.push({
      date: formatDateLabel(addDays(lastDate, h)),
      actual: null,
      forecast: forecastPoints[idx]?.predictedPrice ?? null,
      low: lowerBound[idx] ?? null,
      high: upperBound[idx] ?? null,
    });
  }
  // Always include day-30 endpoint
  if (days % step !== 0) {
    chartData.push({
      date: formatDateLabel(addDays(lastDate, days)),
      actual: null,
      forecast: forecastPoints[days - 1].predictedPrice,
      low: lowerBound[days - 1],
      high: upperBound[days - 1],
    });
  }

  const finalResult: ForecastResult = {
    commodity,
    mandi: mandi ?? null,
    trend,
    currentPrice,
    baseDate: toIsoDate(lastDate),
    forecast: forecastPoints,
    confidence,
    lowerBound,
    upperBound,
    volatilityScore: volScore,
    opportunityScore,
    dataPoints: n,
    method: "Blended Holt's Exponential Smoothing + Linear Regression (60/40) with damped trend",
    summary: {
      expectedHigh: Math.max(...forecastPrices),
      expectedLow: Math.min(...forecastPrices),
      expectedAvg: Math.round(forecastPrices.reduce((a, b) => a + b, 0) / forecastPrices.length),
      day30Price,
      priceChange,
      priceChangePct,
    },
    chartData,
  };

  // Cache it
  forecastCache.set(cacheKey, {
    timestamp: Date.now(),
    result: finalResult,
  });

  return finalResult;
}
