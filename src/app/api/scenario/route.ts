import { NextRequest, NextResponse } from "next/server";
import { runScenarioSimulation } from "@/lib/scenario";

/**
 * GET /api/scenario
 *
 * Query Parameters:
 *   commodity  (required) – e.g. "Onion"
 *   mandi      (optional) – e.g. "Lasalgaon"
 *   arrival    (optional) – supply change percent, e.g. 25
 *   demand     (optional) – demand change percent, e.g. -10
 *
 * Response: ScenarioResult (JSON)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const commodity = searchParams.get("commodity");
    if (!commodity) {
      return NextResponse.json(
        { error: "commodity parameter is required" },
        { status: 400 }
      );
    }

    const mandi = searchParams.get("mandi") ?? undefined;
    const arrivalChange = parseInt(searchParams.get("arrival") ?? "0", 10);
    const demandChange = parseInt(searchParams.get("demand") ?? "0", 10);

    const result = runScenarioSimulation({
      commodity,
      mandi: mandi || undefined,
      arrivalChangePct: isNaN(arrivalChange) ? 0 : arrivalChange,
      demandChangePct: isNaN(demandChange) ? 0 : demandChange,
    });

    if (!result) {
      return NextResponse.json(
        { error: `Insufficient forecast data for commodity: ${commodity}` },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[api/scenario] Error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
