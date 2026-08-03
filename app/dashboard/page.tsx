import type { Metadata } from "next";
import { ProjectOverview } from "@/components/dashboard/ProjectOverview";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Project overview"
        title="Team project dashboard"
        description="High-level progress for the Naples Hazards Assessment group project. Use Workflow for member-by-member assignment details."
      />

      <ProjectOverview />
    </div>
  );
}
