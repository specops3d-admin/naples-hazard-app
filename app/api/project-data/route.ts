import { NextResponse } from "next/server";
import { parseProjectCsv } from "@/lib/project-data";
import type {
  ProjectDataErrorResponse,
  ProjectDataResponse,
} from "@/types/project";

export const dynamic = "force-dynamic";

function errorResponse(message: string, status: number) {
  const body: ProjectDataErrorResponse = { error: message };
  return NextResponse.json(body, { status });
}

export async function GET() {
  const csvUrl = process.env.GOOGLE_SHEET_CSV_URL?.trim();

  if (!csvUrl) {
    return errorResponse(
      "Project data is not configured on the server.",
      500,
    );
  }

  let response: Response;

  try {
    response = await fetch(csvUrl, { cache: "no-store" });
  } catch {
    return errorResponse("Unable to reach the project data source.", 502);
  }

  if (!response.ok) {
    return errorResponse(
      `Unable to load project data (status ${response.status}).`,
      502,
    );
  }

  let csvText: string;

  try {
    csvText = await response.text();
  } catch {
    return errorResponse("Unable to read project data from the source.", 502);
  }

  if (!csvText.trim()) {
    return errorResponse("Project data source returned an empty file.", 502);
  }

  try {
    const members = parseProjectCsv(csvText);
    const body: ProjectDataResponse = { members };
    return NextResponse.json(body);
  } catch {
    return errorResponse("Unable to parse project data.", 500);
  }
}
