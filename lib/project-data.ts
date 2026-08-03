import { parse } from "csv-parse/sync";
import type { ProjectMember } from "@/types/project";

const PROJECT_COLUMNS = [
  "member_id",
  "member_name",
  "section",
  "slides",
  "task_title",
  "status",
  "progress",
  "notes",
  "due_date",
  "display_order",
] as const;

type ProjectCsvColumn = (typeof PROJECT_COLUMNS)[number];
type ProjectCsvRow = Record<ProjectCsvColumn, string>;

function asText(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number.parseFloat(asText(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampProgress(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function isBlankRow(row: ProjectCsvRow): boolean {
  return PROJECT_COLUMNS.every((column) => asText(row[column]) === "");
}

export function parseProjectCsv(csvText: string): ProjectMember[] {
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
    bom: true,
  }) as ProjectCsvRow[];

  return records
    .filter((row) => !isBlankRow(row))
    .map((row) => ({
      member_id: asText(row.member_id),
      member_name: asText(row.member_name),
      section: asText(row.section),
      slides: asText(row.slides),
      task_title: asText(row.task_title),
      status: asText(row.status),
      progress: clampProgress(toNumber(row.progress)),
      notes: asText(row.notes),
      due_date: asText(row.due_date),
      display_order: toNumber(row.display_order),
    }))
    .sort((left, right) => left.display_order - right.display_order);
}
