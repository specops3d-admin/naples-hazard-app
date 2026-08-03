import type { Metadata } from "next";
import { MemberAssignmentSelector } from "@/components/MemberAssignmentSelector";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Project tracker"
        title="Team assignment dashboard"
        description="Live assignment progress for the Naples Hazards Assessment group project. Project data is edited in the shared Google Sheet."
      />

      <MemberAssignmentSelector />
    </div>
  );
}
