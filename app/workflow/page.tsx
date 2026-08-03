import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { RealtimeWorkflowEditor } from "@/components/workflow/RealtimeWorkflowEditor";
import { requireUser } from "@/lib/auth";
import { fetchAssignments } from "@/lib/assignments-server";
import { getWorkflow } from "@/lib/data";

export const metadata: Metadata = {
  title: "Workflow",
};

export const dynamic = "force-dynamic";

export default async function WorkflowPage() {
  const auth = await requireUser();
  const { assignments, error } = await fetchAssignments();
  const workflow = getWorkflow();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Team operations"
        title="Assignment workflow"
        description="Update your assignment status and notes. Members may edit only rows matching their email; project leads may edit all assignments."
      />

      <RealtimeWorkflowEditor
        initialAssignments={assignments}
        userEmail={auth.email}
        isProjectLead={auth.isProjectLead}
        isKnownMember={auth.isKnownMember}
        loadError={error}
      />

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
