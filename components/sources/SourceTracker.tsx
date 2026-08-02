"use client";

import { useMemo, useState } from "react";
import type { SourceRecord } from "@/types/workflow";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { isValidHttpUrl } from "@/lib/slides";
import { normalizeStatus, STATUS_FILTER_OPTIONS } from "@/lib/status";

export function SourceTracker({
  sources,
  verificationNote,
}: {
  sources: SourceRecord[];
  verificationNote: string;
}) {
  const [query, setQuery] = useState("");
  const [memberFilter, setMemberFilter] = useState("All");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTER_OPTIONS)[number]>("All");

  const memberOptions = useMemo(() => {
    const values = new Set<string>();
    for (const source of sources) {
      if (source.assignedTo) values.add(source.assignedTo);
    }
    return ["All", ...[...values].sort()];
  }, [sources]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sources.filter((source) => {
      if (memberFilter !== "All" && source.assignedTo !== memberFilter) {
        return false;
      }
      if (
        statusFilter !== "All" &&
        normalizeStatus(source.verificationStatus) !== statusFilter
      ) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        source.sourceOrganization,
        source.section,
        source.primaryUse,
        source.notesImageCredit,
        source.assignedTo,
        source.url,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [sources, query, memberFilter, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="block text-sm md:col-span-1">
          <span className="mb-1 block font-medium text-slate-700">Search</span>
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
        {filtered.map((source) => (
          <article
            key={`${source.sourceOrganization}-${source.url}-mobile`}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-[var(--brand-navy)]">
                {source.sourceOrganization}
              </h3>
              <StatusBadge status={source.verificationStatus} />
            </div>
            <p className="mt-2 text-sm text-slate-700">{source.section}</p>
            <p className="mt-2 text-sm text-slate-700">{source.primaryUse}</p>
            <p className="mt-2 text-xs text-slate-600">
              Assigned to: {source.assignedTo}
            </p>
            {source.notesImageCredit ? (
              <p className="mt-2 text-xs text-slate-600">
                {source.notesImageCredit}
              </p>
            ) : null}
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
                <span className="text-sm text-slate-600">No valid URL</span>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="min-w-[960px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Section</th>
              <th className="px-4 py-3 font-semibold">Source / organization</th>
              <th className="px-4 py-3 font-semibold">Primary use</th>
              <th className="px-4 py-3 font-semibold">Assigned to</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">URL</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((source) => (
              <tr
                key={`${source.sourceOrganization}-${source.url}`}
                className="border-t border-slate-100 align-top"
              >
                <td className="px-4 py-4 text-slate-700">{source.section}</td>
                <td className="px-4 py-4">
                  <div className="font-medium text-[var(--brand-navy)]">
                    {source.sourceOrganization}
                  </div>
                  {source.notesImageCredit ? (
                    <p className="mt-1 text-xs text-slate-600">
                      {source.notesImageCredit}
                    </p>
                  ) : null}
                </td>
                <td className="max-w-xs px-4 py-4 text-slate-700">
                  {source.primaryUse}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-slate-700">
                  {source.assignedTo}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={source.verificationStatus} />
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
                    <span className="text-slate-600">No valid URL</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {verificationNote ? (
        <aside className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
          {verificationNote}
        </aside>
      ) : null}
    </div>
  );
}
