import fs from "fs";
import path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MarketRecord {
  date: Date;
  dateStr: string; // ISO: "2024-01-01"
  commodity: string; // Normalized canonical name
  rawCommodity: string; // As it appears in CSV
  mandi: string;
  state: string;
  arrivalQty: number; // quintals
  modalPrice: number; // ₹/quintal
}

// ─── Commodity Name Normalization ─────────────────────────────────────────────

/**
 * Maps raw AGMARKNET commodity names (including regional/variant spellings)
 * to canonical names used across the dashboard.
 */
const COMMODITY_ALIASES: Record<string, string> = {
  // Onion
  onion: "Onion",
  "onion big": "Onion",
  "big onion": "Onion",
  pyaz: "Onion",
  kanda: "Onion",
  "pyaz (market)": "Onion",
  vengayam: "Onion",
  "small onion": "Onion",
  "dry onion": "Onion",

  // Tomato
  tomato: "Tomato",
  tamatar: "Tomato",
  thakkali: "Tomato",
  "tomato(deshi)": "Tomato",
  "tomato (local)": "Tomato",

  // Potato
  potato: "Potato",
  aloo: "Potato",
  batata: "Potato",
  "urulaikizhangu": "Potato",
  "potato (desi)": "Potato",

  // Garlic
  garlic: "Garlic",
  lahsun: "Garlic",
  poondu: "Garlic",
  "garlic green": "Garlic",
  "dry garlic": "Garlic",

  // Wheat
  wheat: "Wheat",
  gehun: "Wheat",
  "wheat (107)": "Wheat",
  "wheat (dara)": "Wheat",

  // Rice / Paddy
  rice: "Rice",
  paddy: "Rice",
  chawal: "Rice",
  "paddy (non-basmati)": "Rice",
  "paddy(deshwal)": "Rice",

  // Mustard
  mustard: "Mustard",
  sarson: "Mustard",
  "mustard (black)": "Mustard",
  "rape seed": "Mustard",
  rapeseed: "Mustard",

  // Chilli
  chilli: "Chilli",
  "dry chilly": "Chilli",
  "red chilli": "Chilli",
  lal_mirch: "Chilli",
  "green chilli": "Chilli",

  // Maize
  maize: "Maize",
  corn: "Maize",
  "makki": "Maize",

  // Soybean
  soybean: "Soybean",
  "soya bean": "Soybean",
  soyabean: "Soybean",
};

/**
 * Normalize a raw commodity string to the canonical name.
 * Falls back to title-casing the original if no alias found.
 */
export function normalizeCommodity(raw: string): string {
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  return COMMODITY_ALIASES[key] ?? raw.trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

/**
 * Parse a single CSV line, handling quoted fields.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Parse a date string in DD/MM/YYYY or YYYY-MM-DD format.
 * Returns a Date object (UTC midnight).
 */
function parseDate(raw: string): Date | null {
  const str = raw.trim();

  // DD/MM/YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    return new Date(Date.UTC(+y, +m - 1, +d));
  }

  // YYYY-MM-DD
  const yyyymmdd = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yyyymmdd) {
    const [, y, m, d] = yyyymmdd;
    return new Date(Date.UTC(+y, +m - 1, +d));
  }

  return null;
}

/**
 * Convert a Date to ISO date string "YYYY-MM-DD".
 */
function toIsoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Parse a single AGMARKNET CSV file and return MarketRecord[].
 * Expected header: Date,Commodity,Mandi,State,ArrivalQty,ModalPrice
 */
export function parseCsvFile(filePath: string): MarketRecord[] {
  const records: MarketRecord[] = [];

  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    console.warn(`[csv-parser] Cannot read file: ${filePath}`);
    return records;
  }

  const lines = content.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
  if (lines.length < 2) return records;

  // Parse header to get column indices dynamically
  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "").replace(/[()]/g, ""));
  const idx = {
    date: header.findIndex((h) => h.includes("date")),
    commodity: header.findIndex((h) => h.includes("commodity")),
    mandi: header.findIndex((h) => h.includes("mandi") || h.includes("market")),
    state: header.findIndex((h) => h.includes("state")),
    arrivalQty: header.findIndex((h) => h.includes("arrival")),
    modalPrice: header.findIndex((h) => h.includes("modal") || h.includes("price")),
  };

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    if (fields.length < 4) continue;

    const dateRaw = idx.date >= 0 ? fields[idx.date] : "";
    const parsedDate = parseDate(dateRaw);
    if (!parsedDate) continue;

    const rawCommodity = idx.commodity >= 0 ? fields[idx.commodity] : "";
    const mandiRaw = idx.mandi >= 0 ? fields[idx.mandi] : "";
    const stateRaw = idx.state >= 0 ? fields[idx.state] : "";
    const arrivalRaw = idx.arrivalQty >= 0 ? fields[idx.arrivalQty] : "0";
    const priceRaw = idx.modalPrice >= 0 ? fields[idx.modalPrice] : "0";

    const arrivalQty = parseFloat(arrivalRaw.replace(/,/g, "")) || 0;
    const modalPrice = parseFloat(priceRaw.replace(/,/g, "")) || 0;

    if (!rawCommodity || !mandiRaw) continue;

    records.push({
      date: parsedDate,
      dateStr: toIsoDate(parsedDate),
      commodity: normalizeCommodity(rawCommodity),
      rawCommodity: rawCommodity.trim(),
      mandi: mandiRaw.trim(),
      state: stateRaw.trim(),
      arrivalQty,
      modalPrice,
    });
  }

  return records;
}

export type DatasetMode = "demo" | "uploaded";

export interface DatasetConfig {
  activeDataset: DatasetMode;
}

const CONFIG_PATH = path.join(process.cwd(), "data", "dataset-config.json");

export function getDatasetConfig(): DatasetConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("[csv-parser] Error reading dataset config:", e);
  }
  return { activeDataset: "demo" };
}

export function setDatasetConfig(config: DatasetConfig) {
  try {
    const dataDir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
  } catch (e) {
    console.error("[csv-parser] Error writing dataset config:", e);
  }
}

/**
 * Load all CSV files from the selected data directory.
 * Falls back to demo if uploaded folder is empty or invalid.
 * Returns a flat array of MarketRecord[].
 */
export function loadAllCsvFiles(): MarketRecord[] {
  const config = getDatasetConfig();
  let mode = config.activeDataset;
  
  let dataDir = mode === "uploaded"
    ? path.join(process.cwd(), "data", "uploaded")
    : path.join(process.cwd(), "data", "demo");
  
  // Verify if uploaded directory is valid
  let fallback = false;
  if (mode === "uploaded") {
    if (!fs.existsSync(dataDir)) {
      fallback = true;
    } else {
      const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".csv"));
      if (files.length === 0) {
        fallback = true;
      }
    }
  }

  if (fallback) {
    console.warn(`[csv-parser] Uploaded dataset is empty or missing. Falling back to Demo Dataset.`);
    mode = "demo";
    dataDir = path.join(process.cwd(), "data", "demo");
  }

  if (!fs.existsSync(dataDir)) {
    console.warn(`[csv-parser] Selected dataset directory not found: ${dataDir}`);
    return [];
  }

  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".csv"));
  const all: MarketRecord[] = [];

  for (const file of files) {
    const records = parseCsvFile(path.join(dataDir, file));
    all.push(...records);
    console.log(`[csv-parser] Loaded ${records.length} records from ${file} (${mode} mode)`);
  }

  // Double check if we actually loaded sufficient records from uploaded mode.
  if (mode === "uploaded" && all.length < 4) {
    console.warn(`[csv-parser] Uploaded dataset contains only ${all.length} records. Falling back to Demo Dataset.`);
    const demoDir = path.join(process.cwd(), "data", "demo");
    const demoFiles = fs.readdirSync(demoDir).filter((f) => f.endsWith(".csv"));
    const demoRecords: MarketRecord[] = [];
    for (const file of demoFiles) {
      const records = parseCsvFile(path.join(demoDir, file));
      demoRecords.push(...records);
    }
    return demoRecords;
  }

  console.log(`[csv-parser] Total: ${all.length} records across ${files.length} files in ${mode} mode`);
  return all;
}
