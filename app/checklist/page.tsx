import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ChecklistPanel } from "@/components/checklist/ChecklistPanel";
import { getWorkflow } from "@/lib/data";
import { averageProgressFromStatuses } from "@/lib/status";

export const metadata: Metadata = {
  title: "Checklist",
};

export default function ChecklistPage() {
  const workflow = getWorkflow();
  const items = workflow.mergeChecklist.items;
  const progress = averageProgressFromStatuses(
    items.map((item) => item.status),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Quality review"
        title={workflow.mergeChecklist.title}
        description="Merge and rubric checklist items grouped by category, with evidence slide references from the workbook."
      />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--brand-navy)]">
            Source checklist progress
          </h2>
          <p className="text-sm font-semibold text-[var(--brand-navy)]">
            {progress}%
          </p>
        </div>
        <div className="mt-4 max-w-md">
          <ProgressBar value={progress} label="Checklist progress from source status" />
        </div>
      </section>

      <ChecklistPanel items={items} />
    </div>
  );
}
