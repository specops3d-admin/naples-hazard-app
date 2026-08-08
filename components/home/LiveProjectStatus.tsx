"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { summarizeProject } from "@/lib/project-summary";
import {
  averageProgressFromStatuses,
  normalizeStatus,
} from "@/lib/status";
import type {
  ProjectDataErrorResponse,
  ProjectDataResponse,
  ProjectMember,
} from "@/types/project";
import type {
  TimelineDataErrorResponse,
  TimelineDataResponse,
  TimelineItem,
} from "@/types/timeline";

const REFRESH_INTERVAL_MS = 60_000;

function formatTimestamp(date: Date): string {
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getFirstIncompletePhase(
  timeline: TimelineItem[],
): TimelineItem | null {
  return (
    timeline.find(
      (item) => normalizeStatus(item.status) !== "Complete",
    ) ?? null
  );
}

async function fetchProjectMembers(): Promise<ProjectMember[]> {
  const response = await fetch("/api/project-data", { cache: "no-store" });
  const payload = (await response.json()) as
    | ProjectDataResponse
    | ProjectDataErrorResponse;

  if (!response.ok) {
    throw new Error(
      "error" in payload ? payload.error : "Unable to load project data.",
    );
  }

  if (!("members" in payload)) {
    throw new Error("Unable to load project data.");
  }

  return payload.members;
}

async function fetchTimelineItems(): Promise<TimelineItem[]> {
  const response = await fetch("/api/timeline-data", { cache: "no-store" });
  const payload = (await response.json()) as
    | TimelineDataResponse
    | TimelineDataErrorResponse;

  if (!response.ok) {
    throw new Error(
      "error" in payload ? payload.error : "Unable to load timeline data.",
    );
  }

  if (!("timeline" in payload)) {
    throw new Error("Unable to load timeline data.");
  }

  return payload.timeline;
}

export function LiveProjectStatus() {
  const headingId = useId();
  const [members, setMembers] = useState<ProjectMember[] | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    async function loadLiveStatus() {
      const [projectResult, timelineResult] = await Promise.all([
        fetchProjectMembers().then(
          (value) => ({ ok: true as const, value }),
          (reason: unknown) => ({
            ok: false as const,
            error:
              reason instanceof Error
                ? reason.message
                : "Unable to load project data.",
          }),
        ),
        fetchTimelineItems().then(
          (value) => ({ ok: true as const, value }),
          (reason: unknown) => ({
            ok: false as const,
            error:
              reason instanceof Error
                ? reason.message
                : "Unable to load timeline data.",
          }),
        ),
      ]);

      if (!mountedRef.current) return;

      const errors: string[] = [];

      if (projectResult.ok) {
        setMembers(projectResult.value);
      } else {
        errors.push(projectResult.error);
      }

      if (timelineResult.ok) {
        setTimeline(timelineResult.value);
      } else {
        errors.push(timelineResult.error);
      }

      if (errors.length === 0) {
        setError(null);
        setLastUpdated(new Date());
      } else if (projectResult.ok || timelineResult.ok) {
        // Keep whatever loaded; failed endpoint retains its previous data.
        setError(errors.join(" "));
        setLastUpdated(new Date());
      } else {
        setError(errors.join(" "));
      }

      setLoading(false);
    }

    void loadLiveStatus();
    const intervalId = window.setInterval(() => {
      void loadLiveStatus();
    }, REFRESH_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const hasData = members !== null || timeline !== null;

  if (loading && !hasData) {
    return (
      <section
        aria-busy="true"
        aria-live="polite"
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <p className="text-sm text-slate-600">Loading live project status…</p>
      </section>
    );
  }

  if (error && !hasData) {
    return (
      <section
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm"
      >
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-red-950">
          Unable to load live project status
        </h2>
        <p className="mt-2 text-sm text-red-900">{error}</p>
      </section>
    );
  }

  const projectSummary = members ? summarizeProject(members) : null;
  const overallProgress = projectSummary?.overallProgress ?? 0;
  const timelineCompletion = timeline
    ? averageProgressFromStatuses(timeline.map((item) => item.status))
    : 0;
  const currentPhase = timeline ? getFirstIncompletePhase(timeline) : null;

  return (
    <div className="space-y-8">
      <section
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        aria-labelledby={headingId}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id={headingId}
              className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--brand-navy)]"
            >
              Live project status
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Overall member progress from App Data, plus the current timeline
              handoff from the shared Google Sheet.
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-semibold text-[var(--brand-navy)]">
              {overallProgress}%
            </p>
            <p className="mt-1 text-xs text-slate-500" aria-live="polite">
              {lastUpdated
                ? `Last updated ${formatTimestamp(lastUpdated)}`
                : "Waiting for first update"}
            </p>
          </div>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          >
            Live refresh issue: {error}. Showing the last successful update.
          </p>
        ) : null}

        <div className="mt-5">
          <ProgressBar
            value={overallProgress}
            label="Overall member progress"
          />
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
            <dt className="text-slate-500">Timeline completion</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--brand-navy)]">
              {timelineCompletion}%
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
            <dt className="text-slate-500">Current incomplete phase</dt>
            <dd className="mt-1 text-lg font-semibold text-[var(--brand-navy)]">
              {currentPhase?.phase ||
                (timeline && timeline.length > 0
                  ? "All phases complete"
                  : "Unavailable")}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
            <dt className="text-slate-500">Next incomplete action</dt>
            <dd className="mt-1 leading-relaxed text-[var(--brand-navy)]">
              {currentPhase?.action ||
                (timeline && timeline.length > 0
                  ? "No incomplete actions"
                  : "Unavailable")}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
            <dt className="text-slate-500">Next approval / handoff</dt>
            <dd className="mt-1 leading-relaxed text-[var(--brand-navy)]">
              {currentPhase?.approval_handoff ||
                (timeline && timeline.length > 0
                  ? "No pending handoff"
                  : "Unavailable")}
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap gap-4 text-sm">
          <Link
            href="/dashboard"
            className="font-semibold text-[var(--brand-accent)] underline decoration-amber-300 underline-offset-2 hover:text-amber-950"
          >
            Open dashboard
          </Link>
          <Link
            href="/timeline"
            className="font-semibold text-[var(--brand-accent)] underline decoration-amber-300 underline-offset-2 hover:text-amber-950"
          >
            View timeline
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--brand-navy)]">
            Team member status
          </h2>
          <Link
            href="/workflow"
            className="text-sm font-semibold text-[var(--brand-accent)] underline decoration-amber-300 underline-offset-2 hover:text-amber-950"
          >
            View workflow
          </Link>
        </div>

        {!members || members.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-600">
              {members
                ? "No team members were returned from App Data."
                : "Team member status is temporarily unavailable."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => {
              const name =
                member.member_name || member.member_id || "Unnamed member";
              return (
                <article
                  key={member.member_id || name}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-[var(--brand-navy)]">
                      {name}
                    </h3>
                    <StatusBadge status={member.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-700">
                    {member.section || "Section not assigned"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Final slides {member.slides || "—"}
                  </p>
                  <div className="mt-4">
                    <ProgressBar
                      value={member.progress}
                      label={`${name} progress`}
                    />
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">
                    Task: {member.task_title || "No task title"}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
