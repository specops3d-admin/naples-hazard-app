import { NextResponse } from "next/server";
import { parseSourcesCsv } from "@/lib/sources-data";
import type {
  SourcesDataErrorResponse,
  SourcesDataResponse,
} from "@/types/sources";

export const dynamic = "force-dynamic";

function errorResponse(message: string, status: number) {
  const body: SourcesDataErrorResponse = { error: message };
  return NextResponse.json(body, { status });
}

export async function GET() {
  const csvUrl = process.env.GOOGLE_SOURCES_CSV_URL?.trim();

  if (!csvUrl) {
    return errorResponse(
      "Sources data is not configured on the server.",
      500,
    );
  }

  let response: Response;

  try {
    response = await fetch(csvUrl, { cache: "no-store" });
  } catch {
    return errorResponse("Unable to reach the sources data source.", 502);
  }

  if (!response.ok) {
    return errorResponse(
      `Unable to load sources data (status ${response.status}).`,
      502,
    );
  }

  let csvText: string;

  try {
    csvText = await response.text();
  } catch {
    return errorResponse("Unable to read sources data from the source.", 502);
  }

  if (!csvText.trim()) {
    return errorResponse("Sources data source returned an empty file.", 502);
  }

  try {
    const sources = parseSourcesCsv(csvText);
    const body: SourcesDataResponse = { sources };
    return NextResponse.json(body);
  } catch (parseError) {
    const message =
      parseError instanceof Error
        ? parseError.message
        : "Unable to parse sources data.";
    return errorResponse(message, 500);
  }
}
