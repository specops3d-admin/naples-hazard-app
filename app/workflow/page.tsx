import type { Metadata } from "next";
import { MemberAssignmentSelector } from "@/components/MemberAssignmentSelector";
import { PageHeader } from "@/components/ui/PageHeader";
import { getWorkflow } from "@/lib/data";

export const metadata: Metadata = {
  title: "Workflow",
};

export default function WorkflowPage() {
  const workflow = getWorkflow();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Team operations"
        title="Assignment workflow"
        description="Live read-only view of team assignments from the shared Google Sheet. Select a member to focus the tracker or share a direct link."
      />

      <MemberAssignmentSelector />

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
