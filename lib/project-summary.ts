import type { ProjectMember } from "@/types/project";
import { countByStatus, normalizeStatus } from "@/lib/status";

export const KNOWN_STATUS_LABELS = [
  "Not Started",
  "Needs Revision",
  "In Progress",
  "Ready for Review",
  "Complete",
] as const;

export type KnownStatusLabel = (typeof KNOWN_STATUS_LABELS)[number];

export interface StatusCountItem {
  status: KnownStatusLabel;
  count: number;
}

export interface SectionProgressItem {
  section: string;
  assignmentCount: number;
  averageProgress: number;
}

export interface ActiveAssignmentItem {
  member_id: string;
  member_name: string;
  section: string;
  task_title: string;
  status: string;
  progress: number;
  due_date: string;
}

export interface UpcomingDueDate {
  dueDate: string;
  label: string;
  assignmentCount: number;
  assignments: Array<{
    member_name: string;
    task_title: string;
  }>;
}

export interface ProjectSummary {
  overallProgress: number;
  teamMemberCount: number;
  assignmentCount: number;
  statusCounts: StatusCountItem[];
  sectionProgress: SectionProgressItem[];
  nearestUpcomingDueDate: UpcomingDueDate | null;
  activeAssignments: ActiveAssignmentItem[];
}

const ACTIVE_STATUSES = new Set([
  "Needs Revision",
  "In Progress",
  "Ready for Review",
]);

function averageProgress(members: ProjectMember[]): number {
  if (members.length === 0) return 0;
  const total = members.reduce((sum, member) => sum + member.progress, 0);
  return Math.round(total / members.length);
}

/** Parse common due-date strings into a local calendar day, or null if unusable. */
export function parseDueDate(value: string): Date | null {
  const text = value.trim();
  if (!text) return null;

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date;
    }
    return null;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatDueDateLabel(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function countUniqueTeamMembers(members: ProjectMember[]): number {
  const ids = new Set(
    members
      .map((member) => member.member_id.trim() || member.member_name.trim())
      .filter(Boolean),
  );
  return ids.size;
}

export function getStatusCounts(members: ProjectMember[]): StatusCountItem[] {
  const counts = countByStatus(members.map((member) => member.status));
  return [
    { status: "Not Started", count: counts.notStarted },
    { status: "Needs Revision", count: counts.needsRevision },
    { status: "In Progress", count: counts.inProgress },
    { status: "Ready for Review", count: counts.readyForReview },
    { status: "Complete", count: counts.complete },
  ];
}

export function getSectionProgress(
  members: ProjectMember[],
): SectionProgressItem[] {
  const bySection = new Map<string, ProjectMember[]>();

  for (const member of members) {
    const section = member.section.trim() || "Unassigned section";
    const group = bySection.get(section);
    if (group) {
      group.push(member);
    } else {
      bySection.set(section, [member]);
    }
  }

  return Array.from(bySection.entries())
    .map(([section, group]) => ({
      section,
      assignmentCount: group.length,
      averageProgress: averageProgress(group),
    }))
    .sort((left, right) => left.section.localeCompare(right.section));
}

export function getNearestUpcomingDueDate(
  members: ProjectMember[],
): UpcomingDueDate | null {
  const today = startOfToday();
  let nearestKey: string | null = null;
  let nearestDate: Date | null = null;
  const matching: ProjectMember[] = [];

  for (const member of members) {
    const date = parseDueDate(member.due_date);
    if (!date || date < today) continue;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    if (!nearestDate || date < nearestDate) {
      nearestDate = date;
      nearestKey = key;
      matching.length = 0;
      matching.push(member);
    } else if (key === nearestKey) {
      matching.push(member);
    }
  }

  if (!nearestDate || !nearestKey) return null;

  return {
    dueDate: nearestKey,
    label: formatDueDateLabel(nearestDate),
    assignmentCount: matching.length,
    assignments: matching.map((member) => ({
      member_name: member.member_name || member.member_id || "Unnamed member",
      task_title: member.task_title || "Untitled task",
    })),
  };
}

/**
 * Compact “active work” list. The sheet has no updated-at column, so this
 * surfaces assignments that are currently in motion by status.
 */
const ACTIVE_STATUS_RANK: Record<string, number> = {
  "Needs Revision": 0,
  "In Progress": 1,
  "Ready for Review": 2,
};

export function getActiveAssignments(
  members: ProjectMember[],
  limit = 5,
): ActiveAssignmentItem[] {
  return members
    .filter((member) => ACTIVE_STATUSES.has(normalizeStatus(member.status)))
    .sort((left, right) => {
      const leftStatus = normalizeStatus(left.status);
      const rightStatus = normalizeStatus(right.status);
      const statusRank =
        (ACTIVE_STATUS_RANK[leftStatus] ?? 99) -
        (ACTIVE_STATUS_RANK[rightStatus] ?? 99);
      if (statusRank !== 0) return statusRank;

      if (right.progress !== left.progress) {
        return right.progress - left.progress;
      }

      const leftDue =
        parseDueDate(left.due_date)?.getTime() ?? Number.POSITIVE_INFINITY;
      const rightDue =
        parseDueDate(right.due_date)?.getTime() ?? Number.POSITIVE_INFINITY;
      return leftDue - rightDue;
    })
    .slice(0, limit)
    .map((member) => ({
      member_id: member.member_id,
      member_name: member.member_name || member.member_id || "Unnamed member",
      section: member.section || "Section not assigned",
      task_title: member.task_title || "Untitled task",
      status: normalizeStatus(member.status),
      progress: member.progress,
      due_date: member.due_date,
    }));
}

export function summarizeProject(members: ProjectMember[]): ProjectSummary {
  return {
    overallProgress: averageProgress(members),
    teamMemberCount: countUniqueTeamMembers(members),
    assignmentCount: members.length,
    statusCounts: getStatusCounts(members),
    sectionProgress: getSectionProgress(members),
    nearestUpcomingDueDate: getNearestUpcomingDueDate(members),
    activeAssignments: getActiveAssignments(members),
  };
}
