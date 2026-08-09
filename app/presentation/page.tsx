import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EstimateNotice } from "@/components/ui/EstimateNotice";
import { SlideGallery } from "@/components/presentation/SlideGallery";
import { getPresentation } from "@/lib/data";

export const metadata: Metadata = {
  title: "Presentation",
};

export default function PresentationPage() {
  const presentation = getPresentation();
  const slideCount = presentation.slides.length;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="City council briefing"
        title="Naples Hazards Assessment"
        description="The final presentation deck for the Naples, Italy Hazards Assessment. Click a slide to open a larger accessible view with previous/next controls."
      />

      <EstimateNotice />

      <section aria-labelledby="final-presentation-title" className="space-y-4">
        <div>
          <h2
            id="final-presentation-title"
            className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--brand-navy)]"
          >
            Final Presentation
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
            Gallery of the final presentation ({slideCount}{" "}
            {slideCount === 1 ? "slide" : "slides"}). Click a slide image to open
            a larger accessible modal with previous/next controls.
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
