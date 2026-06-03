import { NextRequest, NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/dashboard-helpers";

export async function GET(request: NextRequest) {
  try {
    const summary = getDashboardSummary();
    return NextResponse.json(summary, {
      headers: {
        // Cache for 2 minutes to keep response times fast but react quickly to uploads
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=30",
      },
    });
  } catch (error: unknown) {
    console.error("[api/dashboard/summary] GET error:", error);
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
