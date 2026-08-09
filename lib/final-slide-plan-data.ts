import { parse } from "csv-parse/sync";
import type { FinalSlidePlanItem } from "@/types/final-slide-plan";

const FINAL_NUMBER_HEADER_ALIASES = [
  "final_number",
  "final_slide_number",
  "final_slide",
  "final",
] as const;

function asText(value: unknown): string {
  if (value == null) return "";
  return String(value).replace(/\uFEFF/g, "").trim();
}

/** Lowercase snake_case, collapsing spaces and punctuation (e.g. "#", "/"). */
export function normalizeFinalSlidePlanHeader(header: string): string {
  return asText(header)
    .toLowerCase()
    .replace(/\(s\)/g, "s")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isBlankCells(cells: string[]): boolean {
  return cells.every((cell) => asText(cell) === "");
}

function isBlankSlideItem(item: FinalSlidePlanItem): boolean {
  return (
    item.final_number === 0 &&
    item.slide_title === "" &&
    item.owner === "" &&
    item.required_content_takeaway === "" &&
    item.suggested_visual === "" &&
    item.existing_draft_slides === "" &&
    item.citation_source_check === "" &&
    item.status === ""
  );
}

function isFinalNumberHeader(header: string): boolean {
  return (FINAL_NUMBER_HEADER_ALIASES as readonly string[]).includes(header);
}

function rowHasRequiredHeaders(cells: string[]): boolean {
  const normalized = cells
    .map(normalizeFinalSlidePlanHeader)
    .filter(Boolean);
  const headers = new Set(normalized);

  return (
    normalized.some(isFinalNumberHeader) &&
    headers.has("slide_title") &&
    headers.has("owner") &&
    headers.has("status")
  );
}

function findHeaderRowIndex(rows: string[][]): number {
  return rows.findIndex((row) => rowHasRequiredHeaders(row));
}

function parseFinalNumber(value: string): number {
  const parsed = Number.parseInt(asText(value), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function readFinalNumber(record: Map<string, string>): number {
  for (const alias of FINAL_NUMBER_HEADER_ALIASES) {
    if (record.has(alias)) {
      return parseFinalNumber(record.get(alias) ?? "");
    }
  }
  return 0;
}

function mapRowToSlideItem(
  headers: string[],
  cells: string[],
): FinalSlidePlanItem {
  const record = new Map<string, string>();

  headers.forEach((header, index) => {
    if (!header || record.has(header)) return;
    record.set(header, asText(cells[index]));
  });

  return {
    final_number: readFinalNumber(record),
    slide_title: record.get("slide_title") ?? "",
    owner: record.get("owner") ?? "",
    required_content_takeaway: record.get("required_content_takeaway") ?? "",
    suggested_visual: record.get("suggested_visual") ?? "",
    existing_draft_slides: record.get("existing_draft_slides") ?? "",
    citation_source_check: record.get("citation_source_check") ?? "",
    status: record.get("status") ?? "",
  };
}

/**
 * Parse a Final Slide Plan CSV that may include decorative title rows before
 * the real header row containing Final # / Final Number, Slide Title, Owner,
 * and Status.
 */
export function parseFinalSlidePlanCsv(csvText: string): FinalSlidePlanItem[] {
  const rows = parse(csvText, {
    columns: false,
    skip_empty_lines: false,
    trim: true,
    relax_column_count: true,
    bom: true,
  }) as string[][];

  const headerIndex = findHeaderRowIndex(rows);

  if (headerIndex === -1) {
    throw new Error(
      'Unable to locate final slide plan header row containing a final slide number field, "Slide Title", "Owner", and "Status".',
    );
  }

  const headers = rows[headerIndex].map(normalizeFinalSlidePlanHeader);

  return rows
    .slice(headerIndex + 1)
    .filter((row) => !isBlankCells(row))
    .map((row) => mapRowToSlideItem(headers, row))
    .filter((item) => !isBlankSlideItem(item));
}
