"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { isValidHttpUrl } from "@/lib/slides";
import { normalizeStatus, STATUS_FILTER_OPTIONS } from "@/lib/status";
import type {
  SourceItem,
  SourcesDataErrorResponse,
  SourcesDataResponse,
} from "@/types/sources";

const REFRESH_INTERVAL_MS = 60_000;

function formatTimestamp(date: Date): string {
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function isVerifiedStatus(status: string): boolean {
  const normalized = normalizeStatus(status);
  return (
    normalized === "Complete" || normalized.toLowerCase() === "verified"
  );
}

export function SourceTracker() {
  const headingId = useId();
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [query, setQuery] = useState("");
  const [memberFilter, setMemberFilter] = useState("All");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTER_OPTIONS)[number]>("All");
  const mountedRef = useRef(true);

  async function loadSourcesData(options?: { manual?: boolean }) {
    if (options?.manual) {
      setRefreshing(true);
    }

    try {
      const response = await fetch("/api/sources-data", {
        cache: "no-store",
      });
      const payload = (await response.json()) as
        | SourcesDataResponse
        | SourcesDataErrorResponse;

      if (!response.ok) {
        const message =
          "error" in payload ? payload.error : "Unable to load sources data.";
        throw new Error(message);
      }

      if (!("sources" in payload)) {
        throw new Error("Unable to load sources data.");
      }

      if (!mountedRef.current) return;

      setSources(payload.sources);
      setError(null);
      setLastUpdated(new Date());
    } catch (loadError) {
      if (!mountedRef.current) return;
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load sources data.",
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

    void loadSourcesData();
    const intervalId = window.setInterval(() => {
      void loadSourcesData();
    }, REFRESH_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      window.clearInterval(intervalId);
    };
    // Initial load + interval only; manual refresh calls loadSourcesData directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const memberOptions = useMemo(() => {
    const values = new Set<string>();
    for (const source of sources) {
      if (source.assigned_to) values.add(source.assigned_to);
    }
    return ["All", ...[...values].sort()];
  }, [sources]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sources.filter((source) => {
      if (memberFilter !== "All" && source.assigned_to !== memberFilter) {
        return false;
      }
      if (
        statusFilter !== "All" &&
        normalizeStatus(source.verification_status) !== statusFilter
      ) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        source.source_organization,
        source.section,
        source.primary_use,
        source.notes_image_credit,
        source.assigned_to,
        source.url,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [sources, query, memberFilter, statusFilter]);

  const verifiedCount = sources.filter((source) =>
    isVerifiedStatus(source.verification_status),
  ).length;
  const needingVerification = Math.max(sources.length - verifiedCount, 0);
  const verificationPercentage =
    sources.length === 0
      ? 0
      : Math.round((verifiedCount / sources.length) * 100);

  if (loading && sources.length === 0) {
    return (
      <section
        aria-busy="true"
        aria-live="polite"
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <p className="text-sm text-slate-600">Loading live source tracker…</p>
      </section>
    );
  }

  if (error && sources.length === 0) {
    return (
      <section
        role="alert"
        className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm"
      >
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-red-950">
            Unable to load sources data
          </h2>
          <p className="mt-2 text-sm text-red-900">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => void loadSourcesData({ manual: true })}
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
              Live source tracker
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Read-only verification tracker from the shared Google Sheet.
              Refreshes automatically every 60 seconds.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <button
              type="button"
              onClick={() => void loadSourcesData({ manual: true })}
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

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-lg bg-slate-50 px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total sources
            </h3>
            <p className="mt-2 text-2xl font-semibold text-[var(--brand-navy)]">
              {sources.length}
            </p>
          </article>
          <article className="rounded-lg bg-slate-50 px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Verified sources
            </h3>
            <p className="mt-2 text-2xl font-semibold text-[var(--brand-navy)]">
              {verifiedCount}
            </p>
          </article>
          <article className="rounded-lg bg-slate-50 px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Needing verification
            </h3>
            <p className="mt-2 text-2xl font-semibold text-[var(--brand-navy)]">
              {needingVerification}
            </p>
          </article>
          <article className="rounded-lg bg-slate-50 px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Verification percentage
            </h3>
            <p className="mt-2 text-2xl font-semibold text-[var(--brand-navy)]">
              {verificationPercentage}%
            </p>
          </article>
        </div>

        <div className="mt-4 max-w-md">
          <ProgressBar
            value={verificationPercentage}
            label="Source verification percentage"
          />
        </div>
      </section>

      <div className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        Source verification is managed in the shared Google Sheet.
      </div>

      {!loading && sources.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--brand-navy)]">
            No sources found
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            The Source Tracker sheet did not return any rows after the header.
          </p>
        </section>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block text-sm md:col-span-1">
              <span className="mb-1 block font-medium text-slate-700">
                Search
              </span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Author, organization, section, or use"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)]"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Assigned member
              </span>
              <select
                value={memberFilter}
                onChange={(event) => setMemberFilter(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)]"
              >
                {memberOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                Verification status
              </span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as (typeof STATUS_FILTER_OPTIONS)[number],
                  )
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)]"
              >
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="text-sm text-slate-600">
            Showing {filtered.length} of {sources.length} sources
          </p>

          <div className="space-y-3 md:hidden">
            {filtered.map((source, index) => (
              <article
                key={`${source.source_organization}-${source.url}-mobile-${index}`}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-[var(--brand-navy)]">
                    {source.source_organization || "Untitled source"}
                  </h3>
                  <StatusBadge status={source.verification_status} />
                </div>
                <dl className="mt-3 space-y-2 text-sm text-slate-700">
                  <div>
                    <dt className="font-medium text-slate-500">Section</dt>
                    <dd className="mt-0.5">{source.section || "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Primary use</dt>
                    <dd className="mt-0.5">{source.primary_use || "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Assigned to</dt>
                    <dd className="mt-0.5">{source.assigned_to || "Unassigned"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">
                      Notes / Image Credit
                    </dt>
                    <dd className="mt-0.5">
                      {source.notes_image_credit || "No notes"}
                    </dd>
                  </div>
                </dl>
                <div className="mt-3">
                  {isValidHttpUrl(source.url) ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-sm font-semibold text-[var(--brand-accent)] underline decoration-amber-300 underline-offset-2 hover:text-amber-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)]"
                    >
                      {source.url}
                    </a>
                  ) : (
                    <span className="text-sm text-slate-600">
                      {source.url || "No valid URL"}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="min-w-[1080px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Section</th>
                  <th className="px-4 py-3 font-semibold">
                    Source / Organization
                  </th>
                  <th className="px-4 py-3 font-semibold">Primary Use</th>
                  <th className="px-4 py-3 font-semibold">URL</th>
                  <th className="px-4 py-3 font-semibold">Assigned To</th>
                  <th className="px-4 py-3 font-semibold">
                    Verification Status
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    Notes / Image Credit
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((source, index) => (
                  <tr
                    key={`${source.source_organization}-${source.url}-${index}`}
                    className="border-t border-slate-100 align-top"
                  >
                    <td className="px-4 py-4 text-slate-700">
                      {source.section || "—"}
                    </td>
                    <td className="px-4 py-4 font-medium text-[var(--brand-navy)]">
                      {source.source_organization || "Untitled source"}
                    </td>
                    <td className="max-w-xs px-4 py-4 text-slate-700">
                      {source.primary_use || "—"}
                    </td>
                    <td className="px-4 py-4">
                      {isValidHttpUrl(source.url) ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all font-medium text-[var(--brand-accent)] underline decoration-amber-300 underline-offset-2 hover:text-amber-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)]"
                        >
                          {source.url}
                        </a>
                      ) : (
                        <span className="text-slate-600">
                          {source.url || "No valid URL"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-slate-700">
                      {source.assigned_to || "Unassigned"}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={source.verification_status} />
                    </td>
                    <td className="max-w-xs px-4 py-4 text-slate-700">
                      {source.notes_image_credit || "No notes"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
