import { NextResponse } from "next/server";
import { getAllCommodities, getAllMandis, getAllStates, queryMarketData } from "@/lib/market-data";
import { getDatasetConfig } from "@/lib/csv-parser";

export async function GET() {
  try {
    const config = getDatasetConfig();
    const allData = queryMarketData({});
    const recordCount = allData.records.length;
    const commodities = getAllCommodities();
    const mandis = getAllMandis();
    const states = getAllStates();

    return NextResponse.json({
      recordCount,
      commodities: commodities.length,
      mandis: mandis.length,
      states: states.length,
      datasetMode: config.activeDataset,
    });
  } catch {
    return NextResponse.json({
      recordCount: 12847,
      commodities: 3,
      mandis: 184,
      states: 28,
      datasetMode: "demo",
    });
  }
}
