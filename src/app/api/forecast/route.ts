import { NextRequest, NextResponse } from "next/server";
import { generateForecast } from "@/lib/forecast";

/**
 * GET /api/forecast
 *
 * Query Parameters:
 *   commodity  (required) – commodity name, e.g. "Onion"
 *   mandi      (optional) – filter to a specific mandi, e.g. "Lasalgaon"
 *   days       (optional) – forecast horizon in days (default: 30, max: 90)
 *
 * Response: ForecastResult (see src/lib/forecast.ts)
 *
 * Error (400): missing commodity param
 * Error (404): insufficient historical data for the requested commodity/mandi
 * Error (500): unexpected server error
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const commodity = searchParams.get("commodity");
    if (!commodity) {
      return NextResponse.json(
        { error: "commodity parameter is required. Example: /api/forecast?commodity=Onion" },
        { status: 400 }
      );
    }

    const mandi = searchParams.get("mandi") ?? undefined;
    const daysParam = parseInt(searchParams.get("days") ?? "30", 10);
    const days = Math.max(7, Math.min(90, isNaN(daysParam) ? 30 : daysParam));

    const result = generateForecast({ commodity, mandi, days });

    if (!result) {
      return NextResponse.json(
        {
          error: `Insufficient historical data for ${commodity}${mandi ? ` at ${mandi}` : ""}. ` +
            `Need at least 4 data points. Add more CSV records to /data/agmarknet/.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(result, {
      headers: {
        // Cache for 10 minutes — forecasts don't change minute-to-minute
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=120",
      },
    });
  } catch (error: unknown) {
    console.error("[api/forecast]", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
