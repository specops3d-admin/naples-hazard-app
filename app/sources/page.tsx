import type { Metadata } from "next";
import { SourceTracker } from "@/components/sources/SourceTracker";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Sources",
};

export default function SourcesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Citations"
        title="Source tracker"
        description="Live searchable source and image-credit tracker from the shared Google Sheet. External links open in a new tab with noopener and noreferrer."
      />

      <SourceTracker />
    </div>
  );
}
