import { parse } from "csv-parse/sync";
import type { SourceItem } from "@/types/sources";

const SOURCE_FIELDS = [
  "section",
  "source_organization",
  "primary_use",
  "url",
  "assigned_to",
  "verification_status",
  "notes_image_credit",
] as const;

const REQUIRED_HEADER_FIELDS = [
  "section",
  "source_organization",
  "url",
  "verification_status",
] as const;

function asText(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

/** Lowercase snake_case, collapsing spaces and punctuation (e.g. "/"). */
export function normalizeSourceHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/\(s\)/g, "s")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isBlankCells(cells: string[]): boolean {
  return cells.every((cell) => asText(cell) === "");
}

function isBlankSourceItem(item: SourceItem): boolean {
  return SOURCE_FIELDS.every((field) => item[field] === "");
}

function rowHasRequiredHeaders(cells: string[]): boolean {
  const normalized = new Set(cells.map(normalizeSourceHeader).filter(Boolean));
  return REQUIRED_HEADER_FIELDS.every((field) => normalized.has(field));
}

function findHeaderRowIndex(rows: string[][]): number {
  return rows.findIndex((row) => rowHasRequiredHeaders(row));
}

function mapRowToSourceItem(headers: string[], cells: string[]): SourceItem {
  const record = new Map<string, string>();

  headers.forEach((header, index) => {
    if (!header || record.has(header)) return;
    record.set(header, asText(cells[index]));
  });

  return {
    section: record.get("section") ?? "",
    source_organization: record.get("source_organization") ?? "",
    primary_use: record.get("primary_use") ?? "",
    url: record.get("url") ?? "",
    assigned_to: record.get("assigned_to") ?? "",
    verification_status: record.get("verification_status") ?? "",
    notes_image_credit: record.get("notes_image_credit") ?? "",
  };
}

/**
 * Parse a Source Tracker CSV that may include decorative title rows before
 * the real header row containing Section, Source / Organization, URL, and
 * Verification Status.
 */
export function parseSourcesCsv(csvText: string): SourceItem[] {
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
      'Unable to locate sources header row containing "Section", "Source / Organization", "URL", and "Verification Status".',
    );
  }

  const headers = rows[headerIndex].map(normalizeSourceHeader);

  return rows
    .slice(headerIndex + 1)
    .filter((row) => !isBlankCells(row))
    .map((row) => mapRowToSourceItem(headers, row))
    .filter((item) => !isBlankSourceItem(item));
}
