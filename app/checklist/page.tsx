import type { Metadata } from "next";
import { ChecklistPanel } from "@/components/checklist/ChecklistPanel";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Checklist",
};

export default function ChecklistPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Quality review"
        title="Merge checklist"
        description="Live merge and rubric checklist items from the shared Google Sheet, grouped by category with evidence slide references."
      />

      <ChecklistPanel />
    </div>
  );
}
