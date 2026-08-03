import type { AssignmentRow } from "@/types/database";

export function calculateOverallProgress(assignments: AssignmentRow[]): number {
  if (assignments.length === 0) {
    return 0;
  }

  const total = assignments.reduce(
    (sum, assignment) => sum + (assignment.progress ?? 0),
    0,
  );

  return Math.round(total / assignments.length);
}

export function getRecentlyUpdatedAssignments(
  assignments: AssignmentRow[],
  limit = 5,
): AssignmentRow[] {
  return [...assignments]
    .sort(
      (left, right) =>
        new Date(right.updated_at).getTime() -
        new Date(left.updated_at).getTime(),
    )
    .slice(0, limit);
}
