import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EstimateNotice } from "@/components/ui/EstimateNotice";
import { SlideGallery } from "@/components/presentation/SlideGallery";
import { getPresentation, getWorkflow } from "@/lib/data";
import {
  progressFromStatus,
  averageProgressFromStatuses,
} from "@/lib/status";
import { parseSlideReferences } from "@/lib/slides";

export const metadata: Metadata = {
  title: "Presentation",
};

export default function PresentationPage() {
  const workflow = getWorkflow();
  const presentation = getPresentation();
  const slides = workflow.finalSlidePlan.slides;
  const availableWorkingSlides = new Set(
    presentation.slides.map((slide) => slide.slideNumber),
  );
  const planProgress = averageProgressFromStatuses(
    slides.map((slide) => slide.status),
  );

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Final briefing plan"
        title={workflow.finalSlidePlan.title}
        description="The 18-slide city-council plan from the workbook, plus a gallery of the extracted working-deck slides."
      />

      <EstimateNotice />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--brand-navy)]">
              18-slide final plan
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Owner, required content, suggested visual, source check, and status
              for each final slide.
            </p>
          </div>
          <p className="text-sm font-semibold text-[var(--brand-navy)]">
            Plan progress: {planProgress}%
          </p>
        </div>
        <div className="mt-4 max-w-md">
          <ProgressBar value={planProgress} label="Final slide plan progress" />
        </div>
      </section>

      <ol className="space-y-4">
        {slides.map((slide) => {
          const draftRefs = parseSlideReferences(slide.existingDraftSlides);
          return (
            <li key={slide.finalNumber}>
              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-accent)]">
                      Final slide {slide.finalNumber}
                    </p>
                    <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--brand-navy)]">
                      {slide.slideTitle}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Owner: {slide.owner}
                    </p>
                  </div>
                  <StatusBadge status={slide.status} />
                </div>

                <dl className="mt-4 grid gap-4 text-sm text-slate-700 md:grid-cols-2">
                  <div>
                    <dt className="font-medium text-slate-500">
                      Required content / takeaway
                    </dt>
                    <dd className="mt-1 leading-relaxed">
                      {slide.requiredContentTakeaway}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">
                      Suggested visual
                    </dt>
                    <dd className="mt-1 leading-relaxed">
                      {slide.suggestedVisual}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">
                      Citation / source check
                    </dt>
                    <dd className="mt-1 leading-relaxed">
                      {slide.citationSourceCheck}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">
                      Existing draft slides
                    </dt>
                    <dd className="mt-1 leading-relaxed">
                      {slide.existingDraftSlides}
                      {draftRefs.length > 0 ? (
                        <span className="mt-2 flex flex-wrap gap-2">
                          {draftRefs.map((number) =>
                            availableWorkingSlides.has(number) ? (
                              <a
                                key={number}
                                href={`#gallery-slide-${number}`}
                                className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-[var(--brand-navy)] hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)]"
                              >
                                Working {number}
                              </a>
                            ) : (
                              <span
                                key={number}
                                className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500"
                                title="Not present in the extracted working deck"
                              >
                                Working {number} (not in export)
                              </span>
                            ),
                          )}
                        </span>
                      ) : null}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 max-w-sm">
                  <ProgressBar
                    value={progressFromStatus(slide.status)}
                    label={`Final slide ${slide.finalNumber} progress`}
                  />
                </div>
              </article>
            </li>
          );
        })}
      </ol>

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
