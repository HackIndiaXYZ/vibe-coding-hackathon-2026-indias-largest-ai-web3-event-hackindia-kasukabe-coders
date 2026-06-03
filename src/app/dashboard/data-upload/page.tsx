"use client";

import { useState, useEffect } from "react";
import {
  Upload,
  Database,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Play,
  Activity,
  Table,
  Sliders,
  ChevronRight,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DataFile {
  filename: string;
  size: number;
  records: number;
}

interface UploadStatus {
  activeDataset: "demo" | "uploaded";
  effectiveDataset: "demo" | "uploaded";
  label: string;
  recordCount: number;
  fallbackActive: boolean;
  readiness?: {
    totalRecords: number;
    uniqueDates: number;
    uniqueCommodities: number;
    uniqueMandis: number;
    dateRange: { start: string; end: string } | null;
    status: "ready" | "limited" | "unavailable";
    label: string;
    color: "green" | "yellow" | "red";
    reason: string;
  };
  demo: {
    files: DataFile[];
    recordCount: number;
  };
  uploaded: {
    files: DataFile[];
    recordCount: number;
    diagnostics?: {
      recordCount: number;
      uniqueDates: number;
      uniqueCommodities: number;
      uniqueMandis: number;
      dateRange: { start: string; end: string } | null;
      readinessStatus: "ready" | "limited" | "unavailable";
      readinessLabel: string;
    };
  };
}

interface ImportStats {
  recordCount: number;
  skippedCount: number;
  commodities: string[];
  states: string[];
  mandis: string[];
  dateRange: { start: string; end: string } | null;
  uniqueDatesCount: number;
  readiness: {
    status: "ready" | "limited" | "unavailable";
    label: string;
    color: "green" | "yellow" | "red";
    reason: string;
  };
}

export default function DataUploadPage() {
  const [status, setStatus] = useState<UploadStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // File Upload State
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [rawCsvText, setRawCsvText] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  
  // Mappings
  const [mappings, setMappings] = useState({
    dateCol: "",
    commodityCol: "",
    mandiCol: "",
    stateCol: "",
    arrivalCol: "",
    priceCol: "",
  });

  // Success stats
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Fetch status of current active datasets
  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/market-data/upload");
      if (!res.ok) throw new Error("Failed to load data importer status.");
      const data = await res.json();
      setStatus(data);
    } catch (err: any) {
      setError(err.message || "Failed to load database stats.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setRawFile(file);
    setImportStats(null);
    setImportError(null);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawCsvText(text);
      
      // Parse preview rows (first 6 rows)
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length === 0) {
        setImportError("Selected CSV file is empty.");
        return;
      }
      
      // Parse header columns
      const cols = lines[0].split(",").map((h) => h.replace(/^["']|["']$/g, "").trim());
      setHeaders(cols);
      
      // Parse up to 5 data rows for preview
      const preview: string[][] = [];
      const totalPreview = Math.min(lines.length, 6);
      for (let i = 1; i < totalPreview; i++) {
        const line = lines[i];
        // simple csv parse
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
        preview.push(fields);
      }
      setPreviewRows(preview);
      
      // Guess columns
      const guesses = {
        dateCol: cols.find((c) => /date|time/i.test(c)) || cols[0] || "",
        commodityCol: cols.find((c) => /commodity|crop|name|item/i.test(c)) || cols[1] || "",
        mandiCol: cols.find((c) => /mandi|market|apmc|location|center/i.test(c)) || cols[2] || "",
        stateCol: cols.find((c) => /state|region|province/i.test(c)) || cols[3] || "",
        arrivalCol: cols.find((c) => /arrival|qty|quantity|volume|weight|tonne/i.test(c)) || cols[4] || "",
        priceCol: cols.find((c) => /price|modal|rate|cost|value/i.test(c)) || cols[5] || "",
      };
      setMappings(guesses);
    };
    reader.readAsText(file);
  };

  // Handle switching database active datasets
  const handleToggleDataset = async (mode: "demo" | "uploaded") => {
    setLoading(true);
    try {
      const res = await fetch("/api/market-data/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", activeDataset: mode }),
      });
      if (!res.ok) throw new Error("Failed to switch database modes.");
      await fetchStatus();
      window.dispatchEvent(new CustomEvent("dataset-changed"));
    } catch (err: any) {
      setError(err.message || "Failed to switch active dataset.");
      setLoading(false);
    }
  };

  // Handle deleting uploaded files
  const handleDeleteFile = async (filename?: string) => {
    setLoading(true);
    try {
      const url = filename
        ? `/api/market-data/upload?file=${encodeURIComponent(filename)}`
        : "/api/market-data/upload";
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete selected data file.");
      await fetchStatus();
      window.dispatchEvent(new CustomEvent("dataset-changed"));
    } catch (err: any) {
      setError(err.message || "Failed to delete files.");
      setLoading(false);
    }
  };

  // Submit and Standardize Import
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawFile || !rawCsvText) return;
    
    setImporting(true);
    setImportError(null);
    setImportStats(null);
    
    try {
      const res = await fetch("/api/market-data/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload",
          filename: rawFile.name,
          content: rawCsvText,
          mappings,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to import mapped CSV file.");
      }
      
      setImportStats(data.stats);
      setRawFile(null);
      setPreviewRows([]);
      setHeaders([]);
      
      // Refresh database stats
      await fetchStatus();
      window.dispatchEvent(new CustomEvent("dataset-changed"));
    } catch (err: any) {
      setImportError(err.message || "Standardization parsing failed.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Database Controls
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1 bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500 font-space-grotesk">
            AGMARKNET Data Importer
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Replace synthetic datasets with official AGMARKNET price exports. Upload, preview, and map columns dynamically.
          </p>
        </div>
      </div>

      {status && (
        <>
          {/* Active Data Source Summary Badge */}
          <div className="bg-gradient-to-r from-amber-500/10 via-zinc-900/60 to-emerald-500/10 border border-zinc-800 rounded-2xl p-5 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "p-3 rounded-xl border shrink-0 font-black text-center tracking-widest text-xs uppercase shadow-md min-w-[120px]",
                  status.effectiveDataset === "uploaded"
                    ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                    : "bg-amber-500/20 border-amber-500/30 text-amber-400"
                )}>
                  {status.effectiveDataset === "uploaded" ? "LIVE UPLOAD" : "DEMO DATASET"}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-extrabold text-white text-base">
                      Active System Source: {status.label}
                    </h3>
                    {status.readiness && (
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider",
                        status.readiness.status === "ready"
                          ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                          : status.readiness.status === "limited"
                          ? "bg-amber-500/10 border-amber-500/25 text-amber-400"
                          : "bg-rose-500/10 border-rose-500/25 text-rose-400"
                      )}>
                        {status.readiness.label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 mt-0.5">
                    Currently utilizing {status.recordCount.toLocaleString("en-IN")} total market records to compute opportunity scores, forecasts, and AI insights.
                  </p>
                  {status.fallbackActive && (
                    <div className="flex items-center gap-2 mt-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-3 py-1 rounded-lg w-fit">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Fallback active: Uploaded folder is empty or invalid. Running Demo dataset to preserve reliability.
                    </div>
                  )}
                </div>
              </div>

              {/* Switches */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleDataset("demo")}
                  className={cn(
                    "px-4 py-2 text-xs font-bold rounded-xl border transition-all active:scale-95",
                    status.activeDataset === "demo"
                      ? "bg-zinc-800 border-zinc-700 text-amber-400 shadow-md"
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-750"
                  )}
                >
                  Use Demo Mode
                </button>
                <button
                  onClick={() => handleToggleDataset("uploaded")}
                  disabled={status.uploaded.recordCount === 0}
                  className={cn(
                    "px-4 py-2 text-xs font-bold rounded-xl border transition-all active:scale-95",
                    status.uploaded.recordCount === 0 && "opacity-40 cursor-not-allowed",
                    status.activeDataset === "uploaded" && !status.fallbackActive
                      ? "bg-zinc-800 border-zinc-700 text-emerald-400 shadow-md"
                      : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-750"
                  )}
                >
                  Use Real Uploads
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: List files & file upload dropzone */}
            <div className="lg:col-span-5 space-y-6">
              {/* Uploader Dropzone */}
              <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl space-y-4 shadow-xl">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <Upload className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-bold">Import AGMARKNET CSV</h2>
                </div>

                <div className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl p-6 text-center transition-all bg-zinc-950 relative">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-850">
                      <Upload className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-zinc-200">
                        Click to upload AGMARKNET export
                      </span>
                      <p className="text-xs text-zinc-500 mt-1">
                        Accepts only standard .csv data dumps
                      </p>
                    </div>
                  </div>
                </div>

                {importError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-semibold">
                    Error: {importError}
                  </div>
                )}

                {/* Import Statistics Success Card */}
                {importStats && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-200 p-5 rounded-xl space-y-3 shadow-md animate-fade-in">
                    <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-2 text-emerald-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-black uppercase tracking-wider">Import Successful</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-zinc-300 font-medium border-b border-zinc-800/60 pb-3">
                      <div className="flex justify-between">
                        <span>Records Processed</span>
                        <span className="font-extrabold text-white">{importStats.recordCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Invalid Rows Skipped</span>
                        <span className="font-extrabold text-amber-400">{importStats.skippedCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Commodities Detected</span>
                        <span className="font-extrabold text-white">{importStats.commodities.join(", ")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>States Detected</span>
                        <span className="font-extrabold text-white">{importStats.states.join(", ")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date Range</span>
                        <span className="font-extrabold text-white">
                          {importStats.dateRange ? `${importStats.dateRange.start} to ${importStats.dateRange.end}` : "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Dataset Readiness Badge */}
                    <div className={cn(
                      "p-3 rounded-xl border flex items-start gap-2.5 mt-2",
                      importStats.readiness.status === "ready"
                        ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                        : importStats.readiness.status === "limited"
                        ? "bg-amber-500/10 border-amber-500/25 text-amber-300"
                        : "bg-red-500/10 border-red-500/25 text-red-300"
                    )}>
                      <div className="mt-0.5 shrink-0">
                        {importStats.readiness.status === "ready" ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertTriangle className={cn("w-4 h-4", importStats.readiness.status === "limited" ? "text-amber-400" : "text-red-400")} />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black uppercase tracking-wide">
                            {importStats.readiness.label}
                          </span>
                          <span className="text-[10px] opacity-60">
                            ({importStats.uniqueDatesCount} unique dates)
                          </span>
                        </div>
                        <p className="text-[11px] leading-normal opacity-85">
                          {importStats.readiness.reason}
                        </p>
                        <div className="flex gap-4 text-[10px] opacity-60 pt-1 font-bold">
                          <span>Min: 30 dates</span>
                          <span>Rec: 180+ dates</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Data Files Manager */}
              <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl space-y-4 shadow-xl">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  <h2 className="text-lg font-bold">Database File Inventory</h2>
                </div>

                {/* Uploaded Dataset files list */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                      Custom Uploaded Files ({status.uploaded.files.length})
                    </span>
                    {status.uploaded.files.length > 0 && (
                      <button
                        onClick={() => handleDeleteFile()}
                        className="text-[10px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 uppercase tracking-wider"
                      >
                        <Trash2 className="w-3 h-3" /> Clear All Uploads
                      </button>
                    )}
                  </div>

                  {status.uploaded.files.length === 0 ? (
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-center text-xs text-zinc-500 font-semibold">
                      No custom uploads detected. Drop files above.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                      {status.uploaded.files.map((file) => (
                        <div
                          key={file.filename}
                          className="flex justify-between items-center bg-zinc-950 p-2.5 rounded-xl border border-zinc-900 text-xs font-medium text-zinc-300"
                        >
                          <div className="truncate pr-4">
                            <span className="font-extrabold text-white block truncate">{file.filename}</span>
                            <span className="text-[10px] text-zinc-500">
                              {file.records} records • {(file.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteFile(file.filename)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all active:scale-90"
                            aria-label={`Delete ${file.filename}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Uploaded Dataset Diagnostics Panel */}
                  {status.uploaded.files.length > 0 && status.uploaded.diagnostics && (
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3 mt-3 shadow-inner">
                      <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2">
                        <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-zinc-300 uppercase tracking-wide font-space-grotesk">
                          Uploaded Dataset Diagnostics
                        </span>
                      </div>
                      
                      {/* Readiness status banner inside diagnostic panel */}
                      <div className={cn(
                        "text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider text-center",
                        status.uploaded.diagnostics.readinessStatus === "ready"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : status.uploaded.diagnostics.readinessStatus === "limited"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          : "bg-red-500/10 border-red-500/20 text-red-400"
                      )}>
                        Status: {status.uploaded.diagnostics.readinessLabel}
                      </div>

                      <div className="space-y-1.5 text-xs text-zinc-400 font-medium">
                        <div className="flex justify-between">
                          <span>Total Records</span>
                          <span className="font-extrabold text-white">{status.uploaded.diagnostics.recordCount.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Unique Dates</span>
                          <span className="font-extrabold text-white">{status.uploaded.diagnostics.uniqueDates}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Unique Commodities</span>
                          <span className="font-extrabold text-white">{status.uploaded.diagnostics.uniqueCommodities}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Unique Mandis</span>
                          <span className="font-extrabold text-white">{status.uploaded.diagnostics.uniqueMandis}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Date Range</span>
                          <span className="font-extrabold text-white text-[10px] truncate max-w-[160px]">
                            {status.uploaded.diagnostics.dateRange
                              ? `${status.uploaded.diagnostics.dateRange.start} to ${status.uploaded.diagnostics.dateRange.end}`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Demo dataset files list */}
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">
                    Demo Dataset Files ({status.demo.files.length})
                  </span>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                    {status.demo.files.map((file) => (
                      <div
                        key={file.filename}
                        className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-900/50 text-xs font-medium text-zinc-400"
                      >
                        <div>
                          <span className="font-bold text-zinc-300 block">{file.filename}</span>
                          <span className="text-[10px] text-zinc-500">
                            {file.records} records • {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <span className="text-[10px] bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded text-zinc-500 font-bold uppercase tracking-wider">
                          Read-Only
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Mapping & preview table */}
            <div className="lg:col-span-7 space-y-6">
              {rawFile ? (
                <form
                  onSubmit={handleImportSubmit}
                  className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl space-y-6 shadow-xl animate-fade-in"
                >
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Table className="w-5 h-5 text-amber-400" />
                      <h2 className="text-lg font-bold">Standardize Custom File</h2>
                    </div>
                    <span className="text-xs font-bold bg-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-full border border-zinc-700">
                      {rawFile.name}
                    </span>
                  </div>

                  {/* CSV Field Selectors */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" /> Configure Column Mapping Mappings
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Date */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500">Date Column</label>
                        <select
                          value={mappings.dateCol}
                          onChange={(e) => setMappings({ ...mappings, dateCol: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 outline-none focus:border-zinc-700 font-medium"
                        >
                          <option value="">-- Choose Column --</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Commodity */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500">Commodity Name Column</label>
                        <select
                          value={mappings.commodityCol}
                          onChange={(e) => setMappings({ ...mappings, commodityCol: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 outline-none focus:border-zinc-700 font-medium"
                        >
                          <option value="">-- Choose Column --</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Mandi */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500">Mandi (Market) Column</label>
                        <select
                          value={mappings.mandiCol}
                          onChange={(e) => setMappings({ ...mappings, mandiCol: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 outline-none focus:border-zinc-700 font-medium"
                        >
                          <option value="">-- Choose Column --</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* State */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500">State Column</label>
                        <select
                          value={mappings.stateCol}
                          onChange={(e) => setMappings({ ...mappings, stateCol: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 outline-none focus:border-zinc-700 font-medium"
                        >
                          <option value="">-- Choose Column --</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Arrival Qty */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500">Arrival Quantity Column</label>
                        <select
                          value={mappings.arrivalCol}
                          onChange={(e) => setMappings({ ...mappings, arrivalCol: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 outline-none focus:border-zinc-700 font-medium"
                        >
                          <option value="">-- Choose Column --</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Modal Price */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500">Modal Price (Rs/q) Column</label>
                        <select
                          value={mappings.priceCol}
                          onChange={(e) => setMappings({ ...mappings, priceCol: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 outline-none focus:border-zinc-700 font-medium"
                        >
                          <option value="">-- Choose Column --</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* CSV First Rows Preview */}
                  <div className="space-y-2 border-t border-zinc-800 pt-4">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                      CSV File Preview (First 5 Rows)
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950 max-h-[220px]">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-zinc-900 border-b border-zinc-800 font-extrabold text-zinc-300">
                          <tr>
                            {headers.map((h, i) => (
                              <th key={i} className="px-3 py-2 border-r border-zinc-800 select-none whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900">
                          {previewRows.map((row, rowIdx) => (
                            <tr key={rowIdx}>
                              {row.map((cell, colIdx) => (
                                <td key={colIdx} className="px-3 py-2 border-r border-zinc-900 text-zinc-400 whitespace-nowrap max-w-[150px] truncate">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Validate and submit button */}
                  <div className="flex gap-3 justify-end border-t border-zinc-800 pt-4">
                    <button
                      type="button"
                      onClick={() => setRawFile(null)}
                      className="px-4 py-2 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-xs font-bold text-zinc-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={importing}
                      className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white text-xs font-black px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-md shadow-emerald-500/10"
                    >
                      {importing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Mappings Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" /> Validate & Import Standardized Data
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-zinc-900/60 border border-zinc-800 p-8 rounded-2xl text-center text-zinc-500 text-sm font-semibold h-[400px] flex flex-col items-center justify-center space-y-4 shadow-xl">
                  <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl text-zinc-600">
                    <Table className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-zinc-300 font-bold">Standardization Mapping Panel</h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                      Drop any AGMARKNET export CSV in the left dropzone. The system will preview details and let you map columns.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
