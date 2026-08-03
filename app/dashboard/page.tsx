import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { RealtimeAssignmentsDashboard } from "@/components/workflow/RealtimeAssignmentsDashboard";
import { requireUser } from "@/lib/auth";
import { fetchAssignments } from "@/lib/assignments-server";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requireUser();
  const { assignments, error } = await fetchAssignments();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Project tracker"
        title="Team assignment dashboard"
        description="Live assignment progress for the Naples Hazards Assessment group project. Updates appear automatically when team members save changes."
      />
      <RealtimeAssignmentsDashboard
        initialAssignments={assignments}
        loadError={error}
      />
    </div>
  );
}
