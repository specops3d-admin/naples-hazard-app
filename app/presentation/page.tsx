import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EstimateNotice } from "@/components/ui/EstimateNotice";
import { LiveFinalSlidePlan } from "@/components/presentation/LiveFinalSlidePlan";
import { SlideGallery } from "@/components/presentation/SlideGallery";
import { getPresentation, getWorkflow } from "@/lib/data";

export const metadata: Metadata = {
  title: "Presentation",
};

export default function PresentationPage() {
  const workflow = getWorkflow();
  const presentation = getPresentation();
  const availableWorkingSlideNumbers = presentation.slides.map(
    (slide) => slide.slideNumber,
  );

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Final briefing plan"
        title={workflow.finalSlidePlan.title}
        description="The 18-slide city-council plan from the workbook, plus a gallery of the extracted working-deck slides."
      />

      <EstimateNotice />

      <LiveFinalSlidePlan
        availableWorkingSlideNumbers={availableWorkingSlideNumbers}
      />

      <section aria-labelledby="working-gallery-title" className="space-y-4">
        <div>
          <h2
            id="working-gallery-title"
            className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--brand-navy)]"
          >
            Working slide gallery
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
            Gallery of the extracted working deck (
            {presentation.meta.slideCount} slides). The workbook references draft
            slide 31 for final slide 18, but slide 31 is not in the current
            export. Click a slide image to open a larger accessible modal with
            previous/next controls.
          </p>
          <p className="mt-2 text-sm">
            <Link
              href="/hazards"
              className="font-semibold text-[var(--brand-accent)] underline decoration-amber-300 underline-offset-2 hover:text-amber-900"
            >
              Read hazard content by section
            </Link>
          </p>
        </div>

        <SlideGallery slides={presentation.slides} />
      </section>
    </div>
  );
}
