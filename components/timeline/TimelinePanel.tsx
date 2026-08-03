"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { progressFromStatus } from "@/lib/status";
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

export function TimelinePanel() {
  const headingId = useId();
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  async function loadTimelineData(options?: { manual?: boolean }) {
    if (options?.manual) {
      setRefreshing(true);
    }

    try {
      const response = await fetch("/api/timeline-data", {
        cache: "no-store",
      });
      const payload = (await response.json()) as
        | TimelineDataResponse
        | TimelineDataErrorResponse;

      if (!response.ok) {
        const message =
          "error" in payload ? payload.error : "Unable to load timeline data.";
        throw new Error(message);
      }

      if (!("timeline" in payload)) {
        throw new Error("Unable to load timeline data.");
      }

      if (!mountedRef.current) return;

      setTimeline(payload.timeline);
      setError(null);
      setLastUpdated(new Date());
    } catch (loadError) {
      if (!mountedRef.current) return;
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load timeline data.",
      );
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true;

    void loadTimelineData();
    const intervalId = window.setInterval(() => {
      void loadTimelineData();
    }, REFRESH_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      window.clearInterval(intervalId);
    };
    // Initial load + interval only; manual refresh calls loadTimelineData directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && timeline.length === 0) {
    return (
      <section
        aria-busy="true"
        aria-live="polite"
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <p className="text-sm text-slate-600">Loading live timeline data…</p>
      </section>
    );
  }

  if (error && timeline.length === 0) {
    return (
      <section
        role="alert"
        className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm"
      >
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-red-950">
            Unable to load timeline data
          </h2>
          <p className="mt-2 text-sm text-red-900">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => void loadTimelineData({ manual: true })}
          disabled={refreshing}
          className="inline-flex rounded-md bg-[var(--brand-navy)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-steel)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-6" aria-labelledby={headingId}>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2
              id={headingId}
              className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--brand-navy)]"
            >
              Live timeline & handoffs
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Data refreshes automatically from the shared Google Sheet every 60
              seconds.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <button
              type="button"
              onClick={() => void loadTimelineData({ manual: true })}
              disabled={refreshing}
              className="inline-flex rounded-md bg-[var(--brand-navy)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-steel)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <p className="text-xs text-slate-600" aria-live="polite">
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
      </div>

      {!loading && timeline.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--brand-navy)]">
            No timeline phases found
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            The Timeline & Handoffs sheet did not return any phase rows after the
            header.
          </p>
        </section>
      ) : (
        <ol className="relative space-y-4 border-l-2 border-slate-300 pl-6 sm:pl-8">
          {timeline.map((phase, index) => {
            const progress = progressFromStatus(phase.status);
            const key = `${phase.phase}-${phase.target_day}-${index}`;

            return (
              <li key={key} className="relative">
                <span
                  className="absolute -left-[1.95rem] top-5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--brand-navy)] bg-white text-xs font-bold text-[var(--brand-navy)] sm:-left-[2.45rem]"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-accent)]">
                        {phase.target_day || "Day not set"}
                      </p>
                      <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--brand-navy)]">
                        {phase.phase || "Untitled phase"}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Owner: {phase.owner || "Unassigned"}
                      </p>
                    </div>
                    <StatusBadge status={phase.status} />
                  </div>

                  <dl className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                    <div>
                      <dt className="font-medium text-slate-500">Action</dt>
                      <dd className="mt-1 leading-relaxed">
                        {phase.action || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">
                        Required output
                      </dt>
                      <dd className="mt-1 leading-relaxed">
                        {phase.required_output || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Depends on</dt>
                      <dd className="mt-1 leading-relaxed">
                        {phase.depends_on || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">
                        Approval / handoff
                      </dt>
                      <dd className="mt-1 leading-relaxed">
                        {phase.approval_handoff || "—"}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 max-w-md">
                    <ProgressBar
                      value={progress}
                      label={`${phase.phase || "Phase"} progress`}
                    />
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
