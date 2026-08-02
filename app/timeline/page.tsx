import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getWorkflow } from "@/lib/data";
import { progressFromStatus } from "@/lib/status";

export const metadata: Metadata = {
  title: "Timeline",
};

export default function TimelinePage() {
  const workflow = getWorkflow();
  const phases = workflow.timelineAndHandoffs.phases;

  return (
    <div>
      <PageHeader
        eyebrow="Schedule"
        title={workflow.timelineAndHandoffs.title}
        description="Ten-day workflow with dependencies, approvals, and handoffs. Day numbers are planning placeholders from the workbook."
      />

      <ol className="relative space-y-4 border-l-2 border-slate-300 pl-6 sm:pl-8">
        {phases.map((phase, index) => {
          const progress = progressFromStatus(phase.status);
          return (
            <li key={phase.phase} className="relative">
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
                      {phase.targetDay}
                    </p>
                    <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--brand-navy)]">
                      {phase.phase}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Owner: {phase.owner}
                    </p>
                  </div>
                  <StatusBadge status={phase.status} />
                </div>

                <dl className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-slate-500">Action</dt>
                    <dd className="mt-1 leading-relaxed">{phase.action}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">
                      Required output
                    </dt>
                    <dd className="mt-1 leading-relaxed">
                      {phase.requiredOutput}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Depends on</dt>
                    <dd className="mt-1 leading-relaxed">{phase.dependsOn}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">
                      Approval / handoff
                    </dt>
                    <dd className="mt-1 leading-relaxed">
                      {phase.approvalHandoff}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 max-w-md">
                  <ProgressBar
                    value={progress}
                    label={`${phase.phase} progress`}
                  />
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
