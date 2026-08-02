"use client";

import { useMemo, useState } from "react";
import type { ChecklistItem } from "@/types/workflow";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { normalizeStatus, STATUS_FILTER_OPTIONS } from "@/lib/status";

export function ChecklistPanel({ items }: { items: ChecklistItem[] }) {
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTER_OPTIONS)[number]>("All");
  const [displayChecked, setDisplayChecked] = useState<Record<string, boolean>>(
    {},
  );

  const filtered = useMemo(() => {
    if (statusFilter === "All") return items;
    return items.filter(
      (item) => normalizeStatus(item.status) === statusFilter,
    );
  }, [items, statusFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    for (const item of filtered) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-[var(--brand-navy)]">
          Source data vs interactive display state
        </p>
        <p className="mt-1 leading-relaxed">
          Status badges and evidence slides come from the imported workbook.
          Checkboxes below are local display helpers only and do not change the
          source JSON or the original spreadsheet.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Showing {filtered.length} of {items.length} checklist items
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <span className="font-medium">Source status</span>
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
          <h2
            id={`checklist-${category}`}
            className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--brand-navy)]"
          >
            {category}
          </h2>
          <ul className="mt-4 space-y-4">
            {categoryItems.map((item) => {
              const key = `${item.category}::${item.checklistItem}`;
              const checked = Boolean(displayChecked[key]);
              return (
                <li
                  key={key}
                  className="rounded-lg border border-slate-100 bg-slate-50/70 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-[var(--brand-navy)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)]"
                        checked={checked}
                        onChange={(event) =>
                          setDisplayChecked((prev) => ({
                            ...prev,
                            [key]: event.target.checked,
                          }))
                        }
                        aria-describedby={`${key}-meta`}
                      />
                      <span className="text-sm leading-relaxed text-slate-800">
                        {item.checklistItem}
                      </span>
                    </label>
                    <StatusBadge status={item.status} />
                  </div>
                  <div
                    id={`${key}-meta`}
                    className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600"
                  >
                    <span>Owner: {item.owner}</span>
                    <span>Evidence: {item.evidenceSlides}</span>
                    {item.notesFixNeeded ? (
                      <span>Notes: {item.notesFixNeeded}</span>
                    ) : null}
                    <span>
                      Display mark: {checked ? "Reviewed locally" : "Unchecked"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
