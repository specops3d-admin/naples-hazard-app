import { NextResponse } from "next/server";
import { parseFinalSlidePlanCsv } from "@/lib/final-slide-plan-data";
import type {
  FinalSlidePlanDataErrorResponse,
  FinalSlidePlanDataResponse,
} from "@/types/final-slide-plan";

export const dynamic = "force-dynamic";

function errorResponse(message: string, status: number) {
  const body: FinalSlidePlanDataErrorResponse = { error: message };
  return NextResponse.json(body, { status });
}

export async function GET() {
  const csvUrl = process.env.GOOGLE_FINAL_SLIDE_PLAN_CSV_URL?.trim();

  if (!csvUrl) {
    return errorResponse(
      "Final slide plan data is not configured on the server.",
      500,
    );
  }

  let response: Response;

  try {
    response = await fetch(csvUrl, { cache: "no-store" });
  } catch {
    return errorResponse(
      "Unable to reach the final slide plan data source.",
      502,
    );
  }

  if (!response.ok) {
    return errorResponse(
      `Unable to load final slide plan data (status ${response.status}).`,
      502,
    );
  }

  let csvText: string;

  try {
    csvText = await response.text();
  } catch {
    return errorResponse(
      "Unable to read final slide plan data from the source.",
      502,
    );
  }

  if (!csvText.trim()) {
    return errorResponse(
      "Final slide plan data source returned an empty file.",
      502,
    );
  }

  try {
    const slides = parseFinalSlidePlanCsv(csvText);
    const body: FinalSlidePlanDataResponse = { slides };
    return NextResponse.json(body);
  } catch (parseError) {
    const message =
      parseError instanceof Error
        ? parseError.message
        : "Unable to parse final slide plan data.";
    return errorResponse(message, 500);
  }
}
