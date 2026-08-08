import { parse } from "csv-parse/sync";
import type { ChecklistItem } from "@/types/checklist";

const CHECKLIST_FIELDS = [
  "category",
  "checklist_item",
  "owner",
  "evidence_slides",
  "status",
  "notes_fix_needed",
] as const;

const REQUIRED_HEADER_FIELDS = [
  "category",
  "checklist_item",
  "owner",
  "status",
] as const;

function asText(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

/** Lowercase snake_case, collapsing spaces/punctuation and plural markers like (s). */
export function normalizeChecklistHeader(header: string): string {
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

function isBlankChecklistItem(item: ChecklistItem): boolean {
  return CHECKLIST_FIELDS.every((field) => item[field] === "");
}

function rowHasRequiredHeaders(cells: string[]): boolean {
  const normalized = new Set(
    cells.map(normalizeChecklistHeader).filter(Boolean),
  );
  return REQUIRED_HEADER_FIELDS.every((field) => normalized.has(field));
}

function findHeaderRowIndex(rows: string[][]): number {
  return rows.findIndex((row) => rowHasRequiredHeaders(row));
}

function mapRowToChecklistItem(
  headers: string[],
  cells: string[],
): ChecklistItem {
  const record = new Map<string, string>();

  headers.forEach((header, index) => {
    if (!header || record.has(header)) return;
    record.set(header, asText(cells[index]));
  });

  return {
    category: record.get("category") ?? "",
    checklist_item: record.get("checklist_item") ?? "",
    owner: record.get("owner") ?? "",
    evidence_slides: record.get("evidence_slides") ?? "",
    status: record.get("status") ?? "",
    notes_fix_needed: record.get("notes_fix_needed") ?? "",
  };
}

/**
 * Parse a Merge Checklist CSV that may include decorative title rows before
 * the real header row containing Category, Checklist Item, Owner, and Status.
 */
export function parseChecklistCsv(csvText: string): ChecklistItem[] {
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
      'Unable to locate checklist header row containing "Category", "Checklist Item", "Owner", and "Status".',
    );
  }

  const headers = rows[headerIndex].map(normalizeChecklistHeader);

  return rows
    .slice(headerIndex + 1)
    .filter((row) => !isBlankCells(row))
    .map((row) => mapRowToChecklistItem(headers, row))
    .filter((item) => !isBlankChecklistItem(item));
}
