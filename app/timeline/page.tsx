import type { Metadata } from "next";
import { TimelinePanel } from "@/components/timeline/TimelinePanel";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Timeline",
};

export default function TimelinePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Schedule"
        title="Timeline & handoffs"
        description="Live ten-day workflow with dependencies, approvals, and handoffs from the shared Google Sheet. Day numbers are planning placeholders from the workbook."
      />

      <TimelinePanel />
    </div>
  );
}
