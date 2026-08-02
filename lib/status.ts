import type { WorkflowStatus } from "@/types/workflow";

/**
 * Single source of truth for project status labels and progress percentages.
 * Components should import from this module instead of mapping statuses locally.
 */
export const STATUS_PROGRESS = {
  "Not Started": 0,
  "Needs Revision": 35,
  "In Progress": 50,
  "Ready for Review": 85,
  Complete: 100,
} as const;

export type KnownStatus = keyof typeof STATUS_PROGRESS;

export const STATUS_FILTER_OPTIONS = [
  "All",
  "Not Started",
  "Needs Revision",
  "In Progress",
  "Ready for Review",
  "Complete",
] as const;

const STATUS_ALIASES: Record<string, KnownStatus> = {
  "not started": "Not Started",
  "needs revision": "Needs Revision",
  "in progress": "In Progress",
  "ready for review": "Ready for Review",
  complete: "Complete",
  completed: "Complete",
};

export function normalizeStatus(status: WorkflowStatus | string): string {
  const text = String(status ?? "").trim();
  if (!text) return "Not Started";
  return STATUS_ALIASES[text.toLowerCase()] ?? text;
}

export function progressFromStatus(status: WorkflowStatus | string): number {
  const normalized = normalizeStatus(status);
  if (normalized in STATUS_PROGRESS) {
    return STATUS_PROGRESS[normalized as KnownStatus];
  }
  return 0;
}

/** Average progress derived from a list of status values. */
export function averageProgressFromStatuses(
  statuses: Array<WorkflowStatus | string>,
): number {
  if (statuses.length === 0) return 0;
  const total = statuses.reduce(
    (sum, status) => sum + progressFromStatus(status),
    0,
  );
  return Math.round(total / statuses.length);
}

/**
 * Overall project completion = average of the five team-member progress values.
 */
export function overallCompletionFromMembers(
  members: Array<{ status: WorkflowStatus | string }>,
): number {
  return averageProgressFromStatuses(members.map((member) => member.status));
}

export function countByStatus(statuses: Array<WorkflowStatus | string>) {
  const counts = {
    notStarted: 0,
    needsRevision: 0,
    inProgress: 0,
    readyForReview: 0,
    complete: 0,
  };

  for (const status of statuses) {
    const normalized = normalizeStatus(status);
    if (normalized === "Not Started") counts.notStarted += 1;
    else if (normalized === "Needs Revision") counts.needsRevision += 1;
    else if (normalized === "In Progress") counts.inProgress += 1;
    else if (normalized === "Ready for Review") counts.readyForReview += 1;
    else if (normalized === "Complete") counts.complete += 1;
  }

  return counts;
}
