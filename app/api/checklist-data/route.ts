import { NextResponse } from "next/server";
import { parseChecklistCsv } from "@/lib/checklist-data";
import type {
  ChecklistDataErrorResponse,
  ChecklistDataResponse,
} from "@/types/checklist";

export const dynamic = "force-dynamic";

function errorResponse(message: string, status: number) {
  const body: ChecklistDataErrorResponse = { error: message };
  return NextResponse.json(body, { status });
}

export async function GET() {
  const csvUrl = process.env.GOOGLE_CHECKLIST_CSV_URL?.trim();

  if (!csvUrl) {
    return errorResponse(
      "Checklist data is not configured on the server.",
      500,
    );
  }

  let response: Response;

  try {
    response = await fetch(csvUrl, { cache: "no-store" });
  } catch {
    return errorResponse("Unable to reach the checklist data source.", 502);
  }

  if (!response.ok) {
    return errorResponse(
      `Unable to load checklist data (status ${response.status}).`,
      502,
    );
  }

  let csvText: string;

  try {
    csvText = await response.text();
  } catch {
    return errorResponse(
      "Unable to read checklist data from the source.",
      502,
    );
  }

  if (!csvText.trim()) {
    return errorResponse("Checklist data source returned an empty file.", 502);
  }

  try {
    const checklist = parseChecklistCsv(csvText);
    const body: ChecklistDataResponse = { checklist };
    return NextResponse.json(body);
  } catch (parseError) {
    const message =
      parseError instanceof Error
        ? parseError.message
        : "Unable to parse checklist data.";
    return errorResponse(message, 500);
  }
}
