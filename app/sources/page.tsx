import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SourceTracker } from "@/components/sources/SourceTracker";
import { getWorkflow } from "@/lib/data";
import { averageProgressFromStatuses } from "@/lib/status";

export const metadata: Metadata = {
  title: "Sources",
};

export default function SourcesPage() {
  const workflow = getWorkflow();
  const sources = workflow.sourceTracker.sources;
  const progress = averageProgressFromStatuses(
    sources.map((source) => source.verificationStatus),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Citations"
        title={workflow.sourceTracker.title}
        description="Searchable source and image-credit tracker from the workbook. External links open in a new tab with noopener and noreferrer."
      />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--brand-navy)]">
            Verification progress
          </h2>
          <p className="text-sm font-semibold text-[var(--brand-navy)]">
            {progress}%
          </p>
        </div>
        <div className="mt-4 max-w-md">
          <ProgressBar
            value={progress}
            label="Source verification progress"
          />
        </div>
      </section>

      <SourceTracker
        sources={sources}
        verificationNote={workflow.sourceTracker.verificationNote}
      />
    </div>
  );
}
