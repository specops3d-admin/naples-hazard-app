"use client";

import { useCallback, useEffect, useState } from "react";
import type { AssignmentRow } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { canEditAssignment } from "@/lib/permissions";
import { AssignmentEditor } from "@/components/workflow/AssignmentEditor";

export function RealtimeWorkflowEditor({
  initialAssignments,
  userEmail,
  isProjectLead,
  isKnownMember,
  loadError,
}: {
  initialAssignments: AssignmentRow[];
  userEmail: string;
  isProjectLead: boolean;
  isKnownMember: boolean;
  loadError: string | null;
}) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const authContext = {
    email: userEmail,
    isProjectLead,
  };

  const refreshAssignments = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .order("display_name", { ascending: true });

    if (error) {
      setRefreshError(error.message);
      return;
    }

    setRefreshError(null);
    setAssignments(data ?? []);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("assignments-workflow")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assignments" },
        () => {
          void refreshAssignments();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refreshAssignments]);

  function handleUpdated(updated: AssignmentRow) {
    setAssignments((current) =>
      current.map((assignment) =>
        assignment.id === updated.id ? updated : assignment,
      ),
    );
  }

  if (loadError) {
    return (
      <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        Unable to load assignments: {loadError}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {refreshError ? (
        <p
          role="alert"
          className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          Live updates paused: {refreshError}
        </p>
      ) : null}

      {!isKnownMember ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Your signed-in email is not linked to a team assignment. You can review
          progress here, but editing is disabled until your address matches an
          assignee record or a project lead role.
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {assignments.map((assignment) => (
          <AssignmentEditor
            key={`${assignment.id}-${assignment.updated_at}`}
            assignment={assignment}
            canEdit={
              isKnownMember && canEditAssignment(assignment, authContext)
            }
            onUpdated={handleUpdated}
          />
        ))}
      </div>
    </div>
  );
}
