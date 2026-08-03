import { parse } from "csv-parse/sync";
import type { TimelineItem } from "@/types/timeline";

const TIMELINE_FIELDS = [
  "phase",
  "target_day",
  "owner",
  "action",
  "required_output",
  "depends_on",
  "approval_handoff",
  "status",
] as const;

const REQUIRED_HEADER_FIELDS = ["phase", "target_day", "owner", "action"] as const;

function asText(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

/** Lowercase snake_case, collapsing spaces and punctuation (e.g. "/"). */
export function normalizeTimelineHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isBlankCells(cells: string[]): boolean {
  return cells.every((cell) => asText(cell) === "");
}

function isBlankTimelineItem(item: TimelineItem): boolean {
  return TIMELINE_FIELDS.every((field) => item[field] === "");
}

function rowHasRequiredHeaders(cells: string[]): boolean {
  const normalized = new Set(cells.map(normalizeTimelineHeader).filter(Boolean));
  return REQUIRED_HEADER_FIELDS.every((field) => normalized.has(field));
}

function findHeaderRowIndex(rows: string[][]): number {
  return rows.findIndex((row) => rowHasRequiredHeaders(row));
}

function mapRowToTimelineItem(
  headers: string[],
  cells: string[],
): TimelineItem {
  const record = new Map<string, string>();

  headers.forEach((header, index) => {
    if (!header || record.has(header)) return;
    record.set(header, asText(cells[index]));
  });

  return {
    phase: record.get("phase") ?? "",
    target_day: record.get("target_day") ?? "",
    owner: record.get("owner") ?? "",
    action: record.get("action") ?? "",
    required_output: record.get("required_output") ?? "",
    depends_on: record.get("depends_on") ?? "",
    approval_handoff: record.get("approval_handoff") ?? "",
    status: record.get("status") ?? "",
  };
}

/**
 * Parse a Timeline & Handoffs CSV that may include decorative title rows
 * before the real header row containing Phase, Target Day, Owner, and Action.
 */
export function parseTimelineCsv(csvText: string): TimelineItem[] {
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
      'Unable to locate timeline header row containing "Phase", "Target Day", "Owner", and "Action".',
    );
  }

  const headers = rows[headerIndex].map(normalizeTimelineHeader);

  return rows
    .slice(headerIndex + 1)
    .filter((row) => !isBlankCells(row))
    .map((row) => mapRowToTimelineItem(headers, row))
    .filter((item) => !isBlankTimelineItem(item));
}
