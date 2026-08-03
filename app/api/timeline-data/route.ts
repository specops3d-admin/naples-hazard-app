import { NextResponse } from "next/server";
import { parseTimelineCsv } from "@/lib/timeline-data";
import type {
  TimelineDataErrorResponse,
  TimelineDataResponse,
} from "@/types/timeline";

export const dynamic = "force-dynamic";

function errorResponse(message: string, status: number) {
  const body: TimelineDataErrorResponse = { error: message };
  return NextResponse.json(body, { status });
}

export async function GET() {
  const csvUrl = process.env.GOOGLE_TIMELINE_CSV_URL?.trim();

  if (!csvUrl) {
    return errorResponse(
      "Timeline data is not configured on the server.",
      500,
    );
  }

  let response: Response;

  try {
    response = await fetch(csvUrl, { cache: "no-store" });
  } catch {
    return errorResponse("Unable to reach the timeline data source.", 502);
  }

  if (!response.ok) {
    return errorResponse(
      `Unable to load timeline data (status ${response.status}).`,
      502,
    );
  }

  let csvText: string;

  try {
    csvText = await response.text();
  } catch {
    return errorResponse("Unable to read timeline data from the source.", 502);
  }

  if (!csvText.trim()) {
    return errorResponse("Timeline data source returned an empty file.", 502);
  }

  try {
    const timeline = parseTimelineCsv(csvText);
    const body: TimelineDataResponse = { timeline };
    return NextResponse.json(body);
  } catch (parseError) {
    const message =
      parseError instanceof Error
        ? parseError.message
        : "Unable to parse timeline data.";
    return errorResponse(message, 500);
  }
}
