import { NextRequest, NextResponse } from "next/server";
import {
  queryMarketData,
  getAllCommodities,
  getAllMandis,
  getAllStates,
  type MarketDataFilter,
} from "@/lib/market-data";

/**
 * GET /api/market-data
 *
 * Query Parameters:
 *   commodity  – filter by commodity name (partial match)
 *   mandi      – filter by mandi name (partial match)
 *   state      – filter by state name (partial match)
 *   startDate  – ISO date "YYYY-MM-DD" (inclusive)
 *   endDate    – ISO date "YYYY-MM-DD" (inclusive)
 *   meta       – if "true", returns only metadata (commodities, mandis, states)
 *   raw        – if "true", includes the full raw records array in the response
 *   limit      – max number of raw records to return (default: 500)
 *
 * Response:
 *   {
 *     summary: { count, avgPrice, minPrice, maxPrice, totalVolume, commodities, states, dateRange },
 *     monthly: [{ month, year, monthKey, avgPrice, minPrice, maxPrice, totalVolume, recordCount }],
 *     mandis:  [{ mandi, state, commodity, avgPrice, totalVolume, latestPrice, latestDate, recordCount }],
 *     records?: MarketRecord[],  // only if raw=true
 *     meta?: { commodities, mandis, states },  // only if meta=true
 *   }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const commodity = searchParams.get("commodity") ?? undefined;
    const mandi = searchParams.get("mandi") ?? undefined;
    const state = searchParams.get("state") ?? undefined;
    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;
    const wantMeta = searchParams.get("meta") === "true";
    const wantRaw = searchParams.get("raw") === "true";
    const limit = parseInt(searchParams.get("limit") ?? "500", 10);

    // Validate date formats
    if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return NextResponse.json(
        { error: "startDate must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }
    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return NextResponse.json(
        { error: "endDate must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    // Metadata-only mode
    if (wantMeta) {
      return NextResponse.json(
        {
          commodities: getAllCommodities(),
          mandis: getAllMandis(commodity),
          states: getAllStates(commodity),
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
          },
        }
      );
    }

    const filter: MarketDataFilter = { commodity, mandi, state, startDate, endDate };
    const result = queryMarketData(filter);

    const response: Record<string, unknown> = {
      summary: result.summary,
      monthly: result.monthly,
      mandis: result.mandis,
    };

    if (wantRaw) {
      // Serialize Date objects to ISO strings for JSON transport
      response.records = result.records.slice(0, limit).map((r) => ({
        date: r.dateStr,
        commodity: r.commodity,
        mandi: r.mandi,
        state: r.state,
        arrivalQty: r.arrivalQty,
        modalPrice: r.modalPrice,
      }));
    }

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60",
      },
    });
  } catch (error: unknown) {
    console.error("[api/market-data]", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
