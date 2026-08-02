import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { EstimateNotice } from "@/components/ui/EstimateNotice";
import { HazardSections } from "@/components/hazards/HazardSections";
import { getHazardSections } from "@/lib/data";

export const metadata: Metadata = {
  title: "Hazards",
};

export default function HazardsPage() {
  const sections = getHazardSections();

  return (
    <div>
      <PageHeader
        eyebrow="Hazard briefing"
        title="Naples multi-hazard assessment"
        description="Content is drawn only from the extracted working deck in presentation.json. Slide numbers refer to that working PowerPoint, not the condensed 18-slide plan."
      />
      <EstimateNotice className="mb-8" />
      <HazardSections sections={sections} />
    </div>
  );
}
