"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { summarizeProject } from "@/lib/project-summary";
import type {
  ProjectDataErrorResponse,
  ProjectDataResponse,
  ProjectMember,
} from "@/types/project";

const REFRESH_INTERVAL_MS = 60_000;

const QUICK_LINKS = [
  { href: "/workflow", label: "Workflow" },
  { href: "/presentation", label: "Presentation" },
  { href: "/checklist", label: "Checklist" },
  { href: "/sources", label: "Sources" },
] as const;

function formatTimestamp(date: Date): string {
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ProjectOverview() {
  const headingId = useId();
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProjectData() {
      try {
        const response = await fetch("/api/project-data", {
          cache: "no-store",
        });
        const payload = (await response.json()) as
          | ProjectDataResponse
          | ProjectDataErrorResponse;

        if (!response.ok) {
          const message =
            "error" in payload
              ? payload.error
              : "Unable to load project data.";
          throw new Error(message);
        }

        if (!("members" in payload)) {
          throw new Error("Unable to load project data.");
        }

        if (cancelled) return;

        setMembers(payload.members);
        setError(null);
        setLastUpdated(new Date());
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load project data.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProjectData();
    const intervalId = window.setInterval(() => {
      void loadProjectData();
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  if (loading && members.length === 0) {
    return (
      <section
        aria-busy="true"
        aria-live="polite"
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <p className="text-sm text-slate-600">Loading project overview…</p>
      </section>
    );
  }

  if (error && members.length === 0) {
    return (
      <section
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm"
      >
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-red-950">
          Unable to load project data
        </h2>
        <p className="mt-2 text-sm text-red-900">{error}</p>
      </section>
    );
  }

  if (!loading && members.length === 0) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--brand-navy)]">
          No project data found
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          The shared Google Sheet did not return any assignment rows.
        </p>
        {lastUpdated ? (
          <p className="mt-4 text-xs text-slate-500">
            Last updated {formatTimestamp(lastUpdated)}
          </p>
        ) : null}
      </section>
    );
  }

  const summary = summarizeProject(members);

  return (
    <section className="space-y-6" aria-labelledby={headingId}>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <h2
              id={headingId}
              className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--brand-navy)]"
            >
              Project overview
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              High-level progress from a single live pull of the shared Google
              Sheet.
            </p>
          </div>
          <p className="text-sm text-slate-600" aria-live="polite">
            {lastUpdated
              ? `Last updated ${formatTimestamp(lastUpdated)}`
              : "Waiting for first update"}
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          >
            Live refresh issue: {error}. Showing the last successful update.
          </p>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-lg bg-slate-50 px-4 py-4 sm:col-span-2 xl:col-span-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Overall project progress
            </h3>
            <p className="mt-2 text-3xl font-semibold text-[var(--brand-navy)]">
              {summary.overallProgress}%
            </p>
            <div className="mt-3">
              <ProgressBar
                value={summary.overallProgress}
                label="Overall project progress"
              />
            </div>
          </article>

          <article className="rounded-lg bg-slate-50 px-4 py-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Team members
            </h3>
            <p className="mt-2 text-3xl font-semibold text-[var(--brand-navy)]">
              {summary.teamMemberCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Across {summary.assignmentCount} assignment
              {summary.assignmentCount === 1 ? "" : "s"}
            </p>
          </article>

          <article className="rounded-lg bg-slate-50 px-4 py-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nearest upcoming due date
            </h3>
            {summary.nearestUpcomingDueDate ? (
              <>
                <p className="mt-2 text-xl font-semibold text-[var(--brand-navy)]">
                  {summary.nearestUpcomingDueDate.label}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {summary.nearestUpcomingDueDate.assignmentCount} assignment
                  {summary.nearestUpcomingDueDate.assignmentCount === 1
                    ? ""
                    : "s"}{" "}
                  due
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-600">
                No upcoming due dates in the current sheet.
              </p>
            )}
          </article>
        </div>
      </div>

      <div className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        Project data is managed in the shared Google Sheet. This dashboard is a
        read-only overview and refreshes automatically every 60 seconds.
      </div>

      <section aria-labelledby="status-counts-heading">
        <h3
          id="status-counts-heading"
          className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--brand-navy)]"
        >
          Assignments by status
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {summary.statusCounts.map((item) => (
            <article
              key={item.status}
              className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
            >
              <StatusBadge status={item.status} />
              <p className="mt-3 text-3xl font-semibold text-[var(--brand-navy)]">
                {item.count}
              </p>
              <p className="mt-1 text-xs text-slate-500">{item.status}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="section-progress-heading">
        <h3
          id="section-progress-heading"
          className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--brand-navy)]"
        >
          Progress by section
        </h3>
        <div className="mt-4 space-y-3">
          {summary.sectionProgress.map((item) => (
            <article
              key={item.section}
              className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <h4 className="font-semibold text-[var(--brand-navy)]">
                  {item.section}
                </h4>
                <p className="text-xs text-slate-500">
                  {item.assignmentCount} assignment
                  {item.assignmentCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="mt-3">
                <ProgressBar
                  value={item.averageProgress}
                  label={`${item.section} progress`}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      {summary.activeAssignments.length > 0 ? (
        <section aria-labelledby="active-assignments-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3
                id="active-assignments-heading"
                className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--brand-navy)]"
              >
                Active assignments
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Compact list of work currently in progress, under revision, or
                ready for review.
              </p>
            </div>
            <Link
              href="/workflow"
              className="text-sm font-semibold text-[var(--brand-accent)] underline decoration-amber-300 underline-offset-2 hover:text-amber-950"
            >
              Open full workflow
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
            {summary.activeAssignments.map((assignment) => (
              <li
                key={assignment.member_id || assignment.task_title}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[var(--brand-navy)]">
                    {assignment.task_title}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {assignment.member_name} · {assignment.section}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <StatusBadge status={assignment.status} />
                  <p className="text-xs text-slate-500">
                    {assignment.progress}% complete
                    {assignment.due_date
                      ? ` · Due ${assignment.due_date}`
                      : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav aria-label="Quick links">
        <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--brand-navy)]">
          Quick links
        </h3>
        <div className="mt-4 flex flex-wrap gap-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex rounded-md bg-[var(--brand-navy)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-steel)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </section>
  );
}
