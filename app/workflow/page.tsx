import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AssignmentsPanel } from "@/components/workflow/AssignmentsPanel";
import { getWorkflow, getOverallCompletion } from "@/lib/data";
import { progressFromStatus } from "@/lib/status";

export const metadata: Metadata = {
  title: "Workflow",
};

export default function WorkflowPage() {
  const workflow = getWorkflow();
  const completion = getOverallCompletion(workflow);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Team operations"
        title={workflow.taskAssignments.title}
        description="Assignments, status, and handoffs from the Team Dashboard and Task Assignments workbook sheets."
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--brand-navy)]">
            Assignment progress
          </h2>
          <p className="mt-2 text-3xl font-semibold text-[var(--brand-navy)]">
            {completion.assignments}%
          </p>
          <div className="mt-4">
            <ProgressBar value={completion.assignments} label="Assignments complete" />
          </div>
          <ul className="mt-4 space-y-1 text-sm text-slate-600">
            <li>Complete: {completion.counts.assignments.complete}</li>
            <li>Ready for review: {completion.counts.assignments.readyForReview}</li>
            <li>In progress: {completion.counts.assignments.inProgress}</li>
            <li>Needs revision: {completion.counts.assignments.needsRevision}</li>
            <li>Not started: {completion.counts.assignments.notStarted}</li>
          </ul>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--brand-navy)]">
            Team dashboard
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {workflow.teamDashboard.members.map((member) => (
              <div
                key={member.member}
                className="rounded-lg border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-[var(--brand-navy)]">
                    {member.member}
                  </p>
                  <StatusBadge status={member.status} />
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {member.naplesSection}
                </p>
                <div className="mt-3">
                  <ProgressBar
                    value={progressFromStatus(member.status)}
                    label={`${member.member} progress`}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section>
        <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--brand-navy)]">
          Task assignments
        </h2>
        <AssignmentsPanel assignments={workflow.taskAssignments.assignments} />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--brand-navy)]">
          Team working rules
        </h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
          {workflow.teamDashboard.teamWorkingRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
