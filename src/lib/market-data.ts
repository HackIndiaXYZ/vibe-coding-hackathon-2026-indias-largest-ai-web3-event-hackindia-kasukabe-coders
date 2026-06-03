import { loadAllCsvFiles, type MarketRecord } from "./csv-parser";

// ─── In-Memory Cache ──────────────────────────────────────────────────────────

let _cache: MarketRecord[] | null = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getRecords(): MarketRecord[] {
  const now = Date.now();
  if (_cache && now - _cacheTime < CACHE_TTL_MS) return _cache;
  _cache = loadAllCsvFiles();
  _cacheTime = now;
  return _cache;
}

// ─── Filter Params ────────────────────────────────────────────────────────────

export interface MarketDataFilter {
  commodity?: string; // partial, case-insensitive
  mandi?: string; // partial, case-insensitive
  state?: string; // partial, case-insensitive
  startDate?: string; // ISO "YYYY-MM-DD"
  endDate?: string; // ISO "YYYY-MM-DD"
}

// ─── Output Types ─────────────────────────────────────────────────────────────

export interface MonthlyAggregate {
  month: string; // "Jan", "Feb", ...
  year: number;
  monthKey: string; // "2024-01" for sorting
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  totalVolume: number;
  recordCount: number;
}

export interface MandiAggregate {
  mandi: string;
  state: string;
  commodity: string;
  avgPrice: number;
  totalVolume: number;
  latestPrice: number;
  latestDate: string;
  recordCount: number;
}

export interface MarketDataResult {
  records: MarketRecord[];
  monthly: MonthlyAggregate[];
  mandis: MandiAggregate[];
  summary: {
    count: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    totalVolume: number;
    commodities: string[];
    states: string[];
    dateRange: { start: string; end: string } | null;
  };
}

// ─── Month helpers ────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

// ─── Core query function ──────────────────────────────────────────────────────

export function queryMarketData(filter: MarketDataFilter): MarketDataResult {
  let records = getRecords();

  // Filter: commodity
  if (filter.commodity) {
    const q = filter.commodity.toLowerCase();
    records = records.filter((r) => r.commodity.toLowerCase().includes(q));
  }

  // Filter: mandi
  if (filter.mandi) {
    const q = filter.mandi.toLowerCase();
    records = records.filter((r) => r.mandi.toLowerCase().includes(q));
  }

  // Filter: state
  if (filter.state) {
    const q = filter.state.toLowerCase();
    records = records.filter((r) => r.state.toLowerCase().includes(q));
  }

  // Filter: date range
  if (filter.startDate) {
    const start = new Date(filter.startDate + "T00:00:00Z");
    records = records.filter((r) => r.date >= start);
  }
  if (filter.endDate) {
    const end = new Date(filter.endDate + "T23:59:59Z");
    records = records.filter((r) => r.date <= end);
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  const prices = records.map((r) => r.modalPrice).filter((p) => p > 0);
  const volumes = records.map((r) => r.arrivalQty);
  const commodities = [...new Set(records.map((r) => r.commodity))];
  const states = [...new Set(records.map((r) => r.state))];

  const sortedDates = records.map((r) => r.dateStr).sort();
  const dateRange =
    sortedDates.length > 0
      ? { start: sortedDates[0], end: sortedDates[sortedDates.length - 1] }
      : null;

  const summary = {
    count: records.length,
    avgPrice: prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0,
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
    totalVolume: volumes.reduce((a, b) => a + b, 0),
    commodities,
    states,
    dateRange,
  };

  // ── Monthly Aggregates ────────────────────────────────────────────────────
  const monthMap = new Map<string, { prices: number[]; volume: number; year: number; month: number }>();

  for (const r of records) {
    if (r.modalPrice <= 0) continue;
    const key = monthKey(r.date);
    if (!monthMap.has(key)) {
      monthMap.set(key, {
        prices: [],
        volume: 0,
        year: r.date.getUTCFullYear(),
        month: r.date.getUTCMonth(),
      });
    }
    const entry = monthMap.get(key)!;
    entry.prices.push(r.modalPrice);
    entry.volume += r.arrivalQty;
  }

  const monthly: MonthlyAggregate[] = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entry]) => ({
      month: MONTH_NAMES[entry.month],
      year: entry.year,
      monthKey: key,
      avgPrice: Math.round(entry.prices.reduce((a, b) => a + b, 0) / entry.prices.length),
      minPrice: Math.min(...entry.prices),
      maxPrice: Math.max(...entry.prices),
      totalVolume: entry.volume,
      recordCount: entry.prices.length,
    }));

  // ── Per-Mandi Aggregates ──────────────────────────────────────────────────
  const mandiMap = new Map<
    string,
    { prices: number[]; volume: number; state: string; commodity: string; latestDate: string; latestPrice: number }
  >();

  for (const r of records) {
    if (r.modalPrice <= 0) continue;
    const key = `${r.mandi}||${r.commodity}`;
    if (!mandiMap.has(key)) {
      mandiMap.set(key, {
        prices: [],
        volume: 0,
        state: r.state,
        commodity: r.commodity,
        latestDate: r.dateStr,
        latestPrice: r.modalPrice,
      });
    }
    const entry = mandiMap.get(key)!;
    entry.prices.push(r.modalPrice);
    entry.volume += r.arrivalQty;
    if (r.dateStr > entry.latestDate) {
      entry.latestDate = r.dateStr;
      entry.latestPrice = r.modalPrice;
    }
  }

  const mandis: MandiAggregate[] = Array.from(mandiMap.entries())
    .map(([key, entry]) => ({
      mandi: key.split("||")[0],
      state: entry.state,
      commodity: entry.commodity,
      avgPrice: Math.round(entry.prices.reduce((a, b) => a + b, 0) / entry.prices.length),
      totalVolume: entry.volume,
      latestPrice: entry.latestPrice,
      latestDate: entry.latestDate,
      recordCount: entry.prices.length,
    }))
    .sort((a, b) => b.avgPrice - a.avgPrice);

  return { records, monthly, mandis, summary };
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

/**
 * Get all distinct commodity names in the dataset.
 */
export function getAllCommodities(): string[] {
  const records = getRecords();
  return [...new Set(records.map((r) => r.commodity))].sort();
}

/**
 * Get all distinct mandis, optionally filtered by commodity.
 */
export function getAllMandis(commodity?: string): string[] {
  let records = getRecords();
  if (commodity) {
    records = records.filter((r) => r.commodity.toLowerCase() === commodity.toLowerCase());
  }
  return [...new Set(records.map((r) => r.mandi))].sort();
}

/**
 * Get all distinct states, optionally filtered by commodity.
 */
export function getAllStates(commodity?: string): string[] {
  let records = getRecords();
  if (commodity) {
    records = records.filter((r) => r.commodity.toLowerCase() === commodity.toLowerCase());
  }
  return [...new Set(records.map((r) => r.state))].sort();
}

/**
 * Get the latest price for a commodity from the CSV dataset.
 */
export function getLatestPrice(commodity: string): number | null {
  const records = getRecords()
    .filter((r) => r.commodity.toLowerCase() === commodity.toLowerCase() && r.modalPrice > 0)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  return records[0]?.modalPrice ?? null;
}

/**
 * Force invalidate the cache (call after uploading new CSV files).
 */
export function invalidateCache(): void {
  _cache = null;
  _cacheTime = 0;
}
