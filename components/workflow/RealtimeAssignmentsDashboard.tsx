"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AssignmentRow } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  calculateOverallProgress,
  getRecentlyUpdatedAssignments,
} from "@/lib/assignments";

export function RealtimeAssignmentsDashboard({
  initialAssignments,
  loadError,
}: {
  initialAssignments: AssignmentRow[];
  loadError: string | null;
}) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const refreshAssignments = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .order("updated_at", { ascending: false });

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
      .channel("assignments-dashboard")
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

  const overallProgress = useMemo(
    () => calculateOverallProgress(assignments),
    [assignments],
  );
  const recentAssignments = useMemo(
    () => getRecentlyUpdatedAssignments(assignments),
    [assignments],
  );

  if (loadError) {
    return (
      <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        Unable to load assignments: {loadError}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {refreshError ? (
        <p
          role="alert"
          className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          Live updates paused: {refreshError}
        </p>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--brand-navy)]">
              Overall progress
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Calculated from stored assignment progress values in Supabase.
            </p>
          </div>
          <p className="text-4xl font-semibold text-[var(--brand-navy)]">
            {overallProgress}%
          </p>
        </div>
        <div className="mt-5">
          <ProgressBar value={overallProgress} label="Overall assignment progress" />
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--brand-navy)]">
          Most recently updated
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {recentAssignments.map((assignment) => (
            <article
              key={assignment.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-[var(--brand-navy)]">
                    {assignment.display_name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{assignment.section}</p>
                </div>
                <StatusBadge status={assignment.status} />
              </div>
              <dl className="mt-4 space-y-2 text-sm text-slate-700">
                <div>
                  <dt className="font-medium text-slate-500">Slides</dt>
                  <dd>{assignment.slides}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Task</dt>
                  <dd>{assignment.task_title}</dd>
                </div>
                {assignment.notes ? (
                  <div>
                    <dt className="font-medium text-slate-500">Notes</dt>
                    <dd>{assignment.notes}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="mt-4">
                <ProgressBar
                  value={assignment.progress}
                  label={`${assignment.display_name} progress`}
                />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Updated {new Date(assignment.updated_at).toLocaleString()}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--brand-navy)]">
          All assignments
        </h2>

        <div className="space-y-3 md:hidden">
          {assignments.map((assignment) => (
            <article
              key={`${assignment.id}-mobile`}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-[var(--brand-navy)]">
                    {assignment.display_name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-700">{assignment.section}</p>
                </div>
                <StatusBadge status={assignment.status} />
              </div>
              <dl className="mt-3 space-y-2 text-sm text-slate-700">
                <div>
                  <dt className="font-medium text-slate-500">Slides</dt>
                  <dd>{assignment.slides}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Task</dt>
                  <dd>{assignment.task_title}</dd>
                </div>
                {assignment.notes ? (
                  <div>
                    <dt className="font-medium text-slate-500">Notes</dt>
                    <dd>{assignment.notes}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="mt-3">
                <ProgressBar
                  value={assignment.progress}
                  label={`${assignment.display_name} progress`}
                />
              </div>
            </article>
          ))}
        </div>

        <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
          <table className="min-w-[920px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Member</th>
                <th className="px-4 py-3 font-semibold">Section</th>
                <th className="px-4 py-3 font-semibold">Slides</th>
                <th className="px-4 py-3 font-semibold">Task</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Notes</th>
                <th className="min-w-40 px-4 py-3 font-semibold">Progress</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr
                  key={assignment.id}
                  className="border-t border-slate-100 align-top"
                >
                  <td className="px-4 py-4 font-medium text-[var(--brand-navy)]">
                    {assignment.display_name}
                  </td>
                  <td className="px-4 py-4 text-slate-700">{assignment.section}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-slate-700">
                    {assignment.slides}
                  </td>
                  <td className="max-w-xs px-4 py-4 text-slate-700">
                    {assignment.task_title}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={assignment.status} />
                  </td>
                  <td className="max-w-xs px-4 py-4 text-slate-700">
                    {assignment.notes || "—"}
                  </td>
                  <td className="px-4 py-4">
                    <ProgressBar
                      value={assignment.progress}
                      label={`${assignment.display_name} progress`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
