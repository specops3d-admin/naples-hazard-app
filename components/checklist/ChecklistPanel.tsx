"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  averageProgressFromStatuses,
  countByStatus,
  normalizeStatus,
  STATUS_FILTER_OPTIONS,
} from "@/lib/status";
import type {
  ChecklistDataErrorResponse,
  ChecklistDataResponse,
  ChecklistItem,
} from "@/types/checklist";

const REFRESH_INTERVAL_MS = 60_000;

function formatTimestamp(date: Date): string {
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ChecklistPanel() {
  const headingId = useId();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTER_OPTIONS)[number]>("All");
  const mountedRef = useRef(true);

  async function loadChecklistData(options?: { manual?: boolean }) {
    if (options?.manual) {
      setRefreshing(true);
    }

    try {
      const response = await fetch("/api/checklist-data", {
        cache: "no-store",
      });
      const payload = (await response.json()) as
        | ChecklistDataResponse
        | ChecklistDataErrorResponse;

      if (!response.ok) {
        const message =
          "error" in payload
            ? payload.error
            : "Unable to load checklist data.";
        throw new Error(message);
      }

      if (!("checklist" in payload)) {
        throw new Error("Unable to load checklist data.");
      }

      if (!mountedRef.current) return;

      setChecklist(payload.checklist);
      setError(null);
      setLastUpdated(new Date());
    } catch (loadError) {
      if (!mountedRef.current) return;
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load checklist data.",
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

    void loadChecklistData();
    const intervalId = window.setInterval(() => {
      void loadChecklistData();
    }, REFRESH_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      window.clearInterval(intervalId);
    };
    // Initial load + interval only; manual refresh calls loadChecklistData directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "All") return checklist;
    return checklist.filter(
      (item) => normalizeStatus(item.status) === statusFilter,
    );
  }, [checklist, statusFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    for (const item of filtered) {
      const category = item.category || "Uncategorized";
      const list = map.get(category) ?? [];
      list.push(item);
      map.set(category, list);
    }
    return [...map.entries()];
  }, [filtered]);

  const statusCounts = countByStatus(checklist.map((item) => item.status));
  const overallCompletion = averageProgressFromStatuses(
    checklist.map((item) => item.status),
  );

  if (loading && checklist.length === 0) {
    return (
      <section
        aria-busy="true"
        aria-live="polite"
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <p className="text-sm text-slate-600">Loading live checklist data…</p>
      </section>
    );
  }

  if (error && checklist.length === 0) {
    return (
      <section
        role="alert"
        className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm"
      >
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-red-950">
            Unable to load checklist data
          </h2>
          <p className="mt-2 text-sm text-red-900">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => void loadChecklistData({ manual: true })}
          disabled={refreshing}
          className="inline-flex rounded-md bg-[var(--brand-navy)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-steel)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        aria-labelledby={headingId}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2
              id={headingId}
              className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--brand-navy)]"
            >
              Live merge checklist
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Read-only checklist progress from the shared Google Sheet.
              Refreshes automatically every 60 seconds.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <button
              type="button"
              onClick={() => void loadChecklistData({ manual: true })}
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

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <article className="rounded-lg bg-slate-50 px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total items
            </h3>
            <p className="mt-2 text-2xl font-semibold text-[var(--brand-navy)]">
              {checklist.length}
            </p>
          </article>
          <article className="rounded-lg bg-slate-50 px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Complete
            </h3>
            <p className="mt-2 text-2xl font-semibold text-[var(--brand-navy)]">
              {statusCounts.complete}
            </p>
          </article>
          <article className="rounded-lg bg-slate-50 px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              In Progress
            </h3>
            <p className="mt-2 text-2xl font-semibold text-[var(--brand-navy)]">
              {statusCounts.inProgress}
            </p>
          </article>
          <article className="rounded-lg bg-slate-50 px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Needs Revision
            </h3>
            <p className="mt-2 text-2xl font-semibold text-[var(--brand-navy)]">
              {statusCounts.needsRevision}
            </p>
          </article>
          <article className="rounded-lg bg-slate-50 px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Not Started
            </h3>
            <p className="mt-2 text-2xl font-semibold text-[var(--brand-navy)]">
              {statusCounts.notStarted}
            </p>
          </article>
          <article className="rounded-lg bg-slate-50 px-4 py-3 sm:col-span-2 lg:col-span-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Overall completion
            </h3>
            <p className="mt-2 text-2xl font-semibold text-[var(--brand-navy)]">
              {overallCompletion}%
            </p>
          </article>
        </div>

        <div className="mt-4 max-w-md">
          <ProgressBar
            value={overallCompletion}
            label="Overall checklist completion"
          />
        </div>
      </section>

      <div className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        Checklist status is managed in the shared Google Sheet.
      </div>

      {!loading && checklist.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--brand-navy)]">
            No checklist items found
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            The Merge Checklist sheet did not return any rows after the header.
          </p>
        </section>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Showing {filtered.length} of {checklist.length} checklist items
            </p>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <span className="font-medium">Status</span>
              <select
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)]"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
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

          {grouped.map(([category, categoryItems]) => (
            <section
              key={category}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              aria-labelledby={`checklist-${category}`}
            >
              <h3
                id={`checklist-${category}`}
                className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--brand-navy)]"
              >
                {category}
              </h3>
              <ul className="mt-4 space-y-4">
                {categoryItems.map((item, index) => {
                  const key = `${item.category}::${item.checklist_item}::${index}`;
                  return (
                    <li
                      key={key}
                      className="rounded-lg border border-slate-100 bg-slate-50/70 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <p className="text-sm font-medium leading-relaxed text-slate-800">
                          {item.checklist_item || "Untitled checklist item"}
                        </p>
                        <StatusBadge status={item.status} />
                      </div>
                      <dl className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                        <div>
                          <dt className="font-medium text-slate-500">Owner</dt>
                          <dd className="mt-0.5">{item.owner || "Unassigned"}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-slate-500">
                            Evidence / Slide(s)
                          </dt>
                          <dd className="mt-0.5">
                            {item.evidence_slides || "—"}
                          </dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="font-medium text-slate-500">
                            Notes / Fix Needed
                          </dt>
                          <dd className="mt-0.5">
                            {item.notes_fix_needed || "No notes"}
                          </dd>
                        </div>
                      </dl>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
