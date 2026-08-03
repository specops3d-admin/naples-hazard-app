export function canEditAssignment(
  assignment: { assignee_email: string },
  context: { email: string; isProjectLead: boolean },
): boolean {
  if (context.isProjectLead) {
    return true;
  }

  return assignment.assignee_email.toLowerCase() === context.email.toLowerCase();
}
