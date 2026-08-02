"use client";

import { useMemo, useState } from "react";
import type { TaskAssignment } from "@/types/workflow";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  progressFromStatus,
  normalizeStatus,
  STATUS_FILTER_OPTIONS,
} from "@/lib/status";

export function AssignmentsPanel({
  assignments,
}: {
  assignments: TaskAssignment[];
}) {
  const [filter, setFilter] =
    useState<(typeof STATUS_FILTER_OPTIONS)[number]>("All");

  const filtered = useMemo(() => {
    if (filter === "All") return assignments;
    return assignments.filter(
      (item) => normalizeStatus(item.status) === filter,
    );
  }, [assignments, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Showing {filtered.length} of {assignments.length} assignments
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <span className="font-medium">Status</span>
          <select
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)]"
            value={filter}
            onChange={(event) =>
              setFilter(
                event.target.value as (typeof STATUS_FILTER_OPTIONS)[number],
              )
            }
          >
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-3 md:hidden">
        {filtered.map((assignment) => {
          const progress = progressFromStatus(assignment.status);
          return (
            <article
              key={`${assignment.member}-mobile`}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-[var(--brand-navy)]">
                    {assignment.member}
                  </h3>
                  <p className="mt-1 text-sm text-slate-700">
                    {assignment.section}
                  </p>
                </div>
                <StatusBadge status={assignment.status} />
              </div>
              <dl className="mt-3 space-y-2 text-sm text-slate-700">
                <div>
                  <dt className="font-medium text-slate-500">Slides</dt>
                  <dd>
                    Final {assignment.finalSlides}; draft{" "}
                    {assignment.draftSlidesToReuse}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Deliverable</dt>
                  <dd>{assignment.deliverable}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Priority</dt>
                  <dd>{assignment.priority}</dd>
                </div>
              </dl>
              <div className="mt-3">
                <ProgressBar
                  value={progress}
                  label={`${assignment.member} progress`}
                />
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="min-w-[920px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Member</th>
              <th className="px-4 py-3 font-semibold">Section</th>
              <th className="px-4 py-3 font-semibold">Slides</th>
              <th className="px-4 py-3 font-semibold">Deliverable</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Priority</th>
              <th className="min-w-40 px-4 py-3 font-semibold">Progress</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((assignment) => {
              const progress = progressFromStatus(assignment.status);
              return (
                <tr
                  key={assignment.member}
                  className="border-t border-slate-100 align-top"
                >
                  <td className="px-4 py-4 font-medium text-[var(--brand-navy)]">
                    {assignment.member}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {assignment.section}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-slate-700">
                    Final {assignment.finalSlides}
                    <div className="text-xs text-slate-600">
                      Draft {assignment.draftSlidesToReuse}
                    </div>
                  </td>
                  <td className="max-w-xs px-4 py-4 text-slate-700">
                    {assignment.deliverable}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={assignment.status} />
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-800">
                    {assignment.priority}
                  </td>
                  <td className="px-4 py-4">
                    <ProgressBar
                      value={progress}
                      label={`${assignment.member} progress`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((assignment) => (
          <article
            key={`${assignment.member}-handoff`}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--brand-navy)]">
                {assignment.member} handoff
              </h3>
              <StatusBadge status={assignment.status} />
            </div>
            <p className="mt-2 text-sm text-slate-600">{assignment.section}</p>
            <p className="mt-4 text-sm leading-relaxed text-slate-800">
              {assignment.dependenciesHandoff}
            </p>
            <p className="mt-3 text-xs text-slate-600">
              Visuals required: {assignment.visualsRequired}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
