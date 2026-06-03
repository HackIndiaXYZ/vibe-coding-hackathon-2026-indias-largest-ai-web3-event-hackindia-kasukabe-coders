import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  getDatasetConfig,
  setDatasetConfig,
  parseCsvFile,
  MarketRecord,
} from "@/lib/csv-parser";
import { invalidateCache, queryMarketData } from "@/lib/market-data";
import { getDashboardSummary } from "@/lib/dashboard-helpers";

/**
 * Standardize filename to prevent path traversal
 */
function cleanFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "");
}

/**
 * Parse a raw date string to DD/MM/YYYY format or YYYY-MM-DD
 */
function standardizeDate(raw: string): string | null {
  const str = raw.trim();
  const ddmmyyyy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  }
  const yyyymmdd = str.match(/^(\d{4})[/-](\d{2})[/-](\d{2})$/);
  if (yyyymmdd) {
    const [, y, m, d] = yyyymmdd;
    return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
  }
  return null;
}

/**
 * GET /api/market-data/upload
 * Returns current configuration status and details about demo and uploaded data files.
 */
export async function GET(request: NextRequest) {
  try {
    const config = getDatasetConfig();
    const demoDir = path.join(process.cwd(), "data", "demo");
    const uploadDir = path.join(process.cwd(), "data", "uploaded");

    if (!fs.existsSync(demoDir)) fs.mkdirSync(demoDir, { recursive: true });
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // Read Demo files
    const demoFiles = fs.readdirSync(demoDir).filter((f) => f.endsWith(".csv"));
    let demoRecordCount = 0;
    const demoDetails = demoFiles.map((file) => {
      const filePath = path.join(demoDir, file);
      const records = parseCsvFile(filePath);
      demoRecordCount += records.length;
      return {
        filename: file,
        size: fs.statSync(filePath).size,
        records: records.length,
      };
    });

    // Read Uploaded files
    const uploadedFiles = fs.readdirSync(uploadDir).filter((f) => f.endsWith(".csv"));
    let uploadedRecordCount = 0;
    const uploadedCommodities = new Set<string>();
    const uploadedMandis = new Set<string>();
    const uploadedDates = new Set<string>();
    let uploadedDateMin: string | null = null;
    let uploadedDateMax: string | null = null;

    const uploadedDetails = uploadedFiles.map((file) => {
      const filePath = path.join(uploadDir, file);
      const records = parseCsvFile(filePath);
      uploadedRecordCount += records.length;
      
      for (const r of records) {
        uploadedCommodities.add(r.commodity);
        uploadedMandis.add(r.mandi);
        uploadedDates.add(r.dateStr);
        if (!uploadedDateMin || r.dateStr < uploadedDateMin) uploadedDateMin = r.dateStr;
        if (!uploadedDateMax || r.dateStr > uploadedDateMax) uploadedDateMax = r.dateStr;
      }

      return {
        filename: file,
        size: fs.statSync(filePath).size,
        records: records.length,
      };
    });

    const uploadedDiagnostics = {
      recordCount: uploadedRecordCount,
      uniqueDates: uploadedDates.size,
      uniqueCommodities: uploadedCommodities.size,
      uniqueMandis: uploadedMandis.size,
      dateRange: uploadedDateMin && uploadedDateMax ? { start: uploadedDateMin, end: uploadedDateMax } : null,
      readinessStatus: uploadedDates.size >= 30 ? "ready" : uploadedDates.size >= 4 ? "limited" : "unavailable",
      readinessLabel: uploadedDates.size >= 30 ? "Forecast Ready" : uploadedDates.size >= 4 ? "Limited Historical Data" : "Forecasting Unavailable",
    };

    // Check if fallback is active
    const actualRecords = queryMarketData({});
    const totalRecords = actualRecords.records.length;
    const fallbackActive = config.activeDataset === "uploaded" && uploadedRecordCount < 4;
    const effectiveMode = fallbackActive ? "demo" : config.activeDataset;

    // Get readiness of active dataset
    const summary = getDashboardSummary();

    return NextResponse.json({
      activeDataset: config.activeDataset,
      effectiveDataset: effectiveMode,
      label: effectiveMode === "uploaded" ? "AGMARKNET Upload" : "Demo Dataset",
      recordCount: totalRecords,
      fallbackActive,
      readiness: summary.readiness,
      demo: {
        files: demoDetails,
        recordCount: demoRecordCount,
      },
      uploaded: {
        files: uploadedDetails,
        recordCount: uploadedRecordCount,
        diagnostics: uploadedDiagnostics,
      },
    }, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: unknown) {
    console.error("[api/market-data/upload] GET error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/market-data/upload
 * Handles file importing with column mapping OR toggling active dataset mode.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Mode Toggle Action
    if (action === "toggle") {
      const { activeDataset } = body;
      if (activeDataset !== "demo" && activeDataset !== "uploaded") {
        return NextResponse.json({ error: "Invalid dataset mode." }, { status: 400 });
      }
      setDatasetConfig({ activeDataset });
      invalidateCache();
      return NextResponse.json({ success: true, activeDataset });
    }

    // CSV File Import Action
    if (action === "upload") {
      const { filename, content, mappings } = body;
      if (!filename || !content || !mappings) {
        return NextResponse.json({ error: "Missing filename, CSV content, or mappings." }, { status: 400 });
      }

      const cleanName = cleanFilename(filename);
      if (!cleanName.endsWith(".csv")) {
        return NextResponse.json({ error: "Only CSV files are supported." }, { status: 400 });
      }

      // Parse csv records
      const lines = content.split(/\r?\n/).filter((l: string) => l.trim());
      if (lines.length < 2) {
        return NextResponse.json({ error: "CSV file is empty or has insufficient rows." }, { status: 400 });
      }

      // Parse headers
      const csvHeaders = lines[0].split(",").map((h: string) => {
        // Strip quotes and trim
        return h.replace(/^["']|["']$/g, "").trim();
      });

      const mappingsObj = mappings as Record<string, string>;
      const indices = {
        date: csvHeaders.indexOf(mappingsObj.dateCol),
        commodity: csvHeaders.indexOf(mappingsObj.commodityCol),
        mandi: csvHeaders.indexOf(mappingsObj.mandiCol),
        state: csvHeaders.indexOf(mappingsObj.stateCol),
        arrivalQty: csvHeaders.indexOf(mappingsObj.arrivalCol),
        modalPrice: csvHeaders.indexOf(mappingsObj.priceCol),
      };

      // Verify that all mappings were matched to column index
      for (const [key, idx] of Object.entries(indices)) {
        if (idx === -1) {
          return NextResponse.json({ error: `Could not find column mapping for: ${key}` }, { status: 400 });
        }
      }

      // Re-map rows to standard output header
      const standardRows = ["Date,Commodity,Mandi,State,ArrivalQty,ModalPrice"];
      
      const commoditiesDetected = new Set<string>();
      const statesDetected = new Set<string>();
      const mandisDetected = new Set<string>();
      const datesDetected = new Set<string>();
      let dateMin: string | null = null;
      let dateMax: string | null = null;
      
      let parsedCount = 0;
      let skippedCount = 0;

      for (let i = 1; i < lines.length; i++) {
        // Parse CSV fields supporting potential quoted fields
        const line = lines[i];
        const fields: string[] = [];
        let cur = "";
        let inQ = false;
        for (let charIdx = 0; charIdx < line.length; charIdx++) {
          const ch = line[charIdx];
          if (ch === '"' || ch === "'") {
            inQ = !inQ;
          } else if (ch === "," && !inQ) {
            fields.push(cur.replace(/^["']|["']$/g, "").trim());
            cur = "";
          } else {
            cur += ch;
          }
        }
        fields.push(cur.replace(/^["']|["']$/g, "").trim());

        if (fields.length <= Math.max(...Object.values(indices))) {
          skippedCount++;
          continue;
        }

        const dateRaw = fields[indices.date];
        const stdDate = standardizeDate(dateRaw);
        if (!stdDate) {
          skippedCount++;
          continue;
        }

        const commodity = fields[indices.commodity];
        const mandi = fields[indices.mandi];
        const state = fields[indices.state];
        const arrivalRaw = fields[indices.arrivalQty].replace(/,/g, "");
        const priceRaw = fields[indices.modalPrice].replace(/,/g, "");

        const arrivalQty = parseFloat(arrivalRaw);
        const modalPrice = parseFloat(priceRaw);

        if (!commodity || !mandi || isNaN(arrivalQty) || isNaN(modalPrice) || modalPrice <= 0) {
          skippedCount++;
          continue;
        }

        // Track stats
        commoditiesDetected.add(commodity);
        statesDetected.add(state || "N/A");
        mandisDetected.add(mandi);
        datesDetected.add(stdDate);
        
        // Date tracking (compare ISO dates)
        const dateMatch = stdDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (dateMatch) {
          const [, d, m, y] = dateMatch;
          const iso = `${y}-${m}-${d}`;
          if (!dateMin || iso < dateMin) dateMin = iso;
          if (!dateMax || iso > dateMax) dateMax = iso;
        }

        // Generate line
        const standardLine = `"${stdDate}","${commodity}","${mandi}","${state || ""}","${arrivalQty}","${modalPrice}"`;
        standardRows.push(standardLine);
        parsedCount++;
      }

      if (parsedCount === 0) {
        return NextResponse.json({ error: `Zero records parsed successfully (skipped ${skippedCount} bad rows). Verify mappings.` }, { status: 400 });
      }

      // Write parsed CSV
      const uploadDir = path.join(process.cwd(), "data", "uploaded");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const outPath = path.join(uploadDir, cleanName);
      fs.writeFileSync(outPath, standardRows.join("\n"), "utf-8");

      // Switch to uploaded dataset automatically
      setDatasetConfig({ activeDataset: "uploaded" });
      invalidateCache();

      // Determine readiness status for the newly uploaded file
      let readinessStatus: "ready" | "limited" | "unavailable" = "unavailable";
      let readinessLabel = "Forecasting Unavailable";
      let readinessColor: "green" | "yellow" | "red" = "red";
      let readinessReason = "The uploaded dataset contains less than 4 unique dates (e.g., a single-day snapshot). Sequential historical dates are required to train OLS regression and Holt's linear trend models.";

      const uniqueDatesCount = datesDetected.size;
      if (uniqueDatesCount >= 30) {
        readinessStatus = "ready";
        readinessLabel = "Forecast Ready";
        readinessColor = "green";
        readinessReason = "The uploaded dataset contains sufficient historical dates to power OLS regression, Holt's linear trend forecasts, opportunities, and risk anomaly detection.";
      } else if (uniqueDatesCount >= 4) {
        readinessStatus = "limited";
        readinessLabel = "Limited Historical Data";
        readinessColor = "yellow";
        readinessReason = "The uploaded dataset contains between 4 and 29 unique dates. OLS regression models will run with degraded accuracy. Upload at least 30 days of sequential historical data for reliable forecasts.";
      }

      return NextResponse.json({
        success: true,
        stats: {
          recordCount: parsedCount,
          skippedCount,
          commodities: Array.from(commoditiesDetected),
          states: Array.from(statesDetected),
          mandis: Array.from(mandisDetected),
          dateRange: dateMin && dateMax ? { start: dateMin, end: dateMax } : null,
          uniqueDatesCount,
          readiness: {
            status: readinessStatus,
            label: readinessLabel,
            color: readinessColor,
            reason: readinessReason,
          },
        },
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: unknown) {
    console.error("[api/market-data/upload] POST error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/market-data/upload
 * Deletes a specific uploaded CSV file or deletes all uploaded files.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const file = searchParams.get("file");
    const uploadDir = path.join(process.cwd(), "data", "uploaded");

    if (file) {
      // Delete specific file
      const cleanName = cleanFilename(file);
      const filePath = path.join(uploadDir, cleanName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } else {
      // Clear all files
      if (fs.existsSync(uploadDir)) {
        const files = fs.readdirSync(uploadDir).filter((f) => f.endsWith(".csv"));
        for (const f of files) {
          fs.unlinkSync(path.join(uploadDir, f));
        }
      }
    }

    // If uploaded directory is empty, switch config back to "demo"
    const filesLeft = fs.existsSync(uploadDir)
      ? fs.readdirSync(uploadDir).filter((f) => f.endsWith(".csv")).length
      : 0;

    if (filesLeft === 0) {
      setDatasetConfig({ activeDataset: "demo" });
    }

    invalidateCache();
    return NextResponse.json({ success: true, filesLeft });
  } catch (error: unknown) {
    console.error("[api/market-data/upload] DELETE error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
