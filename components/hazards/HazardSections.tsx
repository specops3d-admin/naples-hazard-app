import type { PresentationSlide } from "@/types/presentation";
import { glossaryEntriesForText } from "@/lib/glossary";
import { EstimateNotice } from "@/components/ui/EstimateNotice";

function containsEstimateLanguage(text: string) {
  const lower = text.toLowerCase();
  return (
    lower.includes("planning estimate") ||
    lower.includes("classroom") ||
    lower.includes("scenario-based") ||
    lower.includes("planning range") ||
    lower.includes("planning tool") ||
    lower.includes("not an official")
  );
}

function containsGeneralizedLanguage(text: string) {
  return text.toLowerCase().includes("generalized");
}

export function HazardSections({
  sections,
}: {
  sections: Array<{
    id: string;
    title: string;
    sectionLabel: string;
    slides: PresentationSlide[];
  }>;
}) {
  return (
    <div className="space-y-10">
      <nav
        aria-label="Hazard sections"
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <ul className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-[var(--brand-navy)] hover:border-[var(--brand-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)]"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          aria-labelledby={`${section.id}-title`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-accent)]">
            {section.sectionLabel}
          </p>
          <h2
            id={`${section.id}-title`}
            className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--brand-navy)]"
          >
            {section.title}
          </h2>

          <div className="mt-6 space-y-8">
            {section.slides.map((slide) => {
              const combined = [
                slide.title,
                slide.subtitle ?? "",
                ...slide.textBlocks,
                slide.sourceOrCitationText ?? "",
              ].join("\n");
              const terms = glossaryEntriesForText(combined);
              const showEstimate =
                containsEstimateLanguage(combined) ||
                section.id === "prioritization";
              const showGeneralized = containsGeneralizedLanguage(combined);

              return (
                <article
                  key={slide.slideNumber}
                  className="border-t border-slate-100 pt-6 first:border-t-0 first:pt-0"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-lg font-semibold text-[var(--brand-navy)]">
                      {slide.title}
                    </h3>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      Working slide {slide.slideNumber}
                    </span>
                  </div>
                  {slide.subtitle ? (
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {slide.subtitle}
                    </p>
                  ) : null}

                  <ul className="mt-4 space-y-2 text-sm leading-relaxed text-slate-800">
                    {slide.textBlocks.map((block, index) => (
                      <li
                        key={`${slide.slideNumber}-${index}`}
                        className="whitespace-pre-line"
                      >
                        {block}
                      </li>
                    ))}
                  </ul>

                  {showGeneralized ? (
                    <p className="mt-4 inline-flex rounded-md bg-slate-800 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                      Generalized map / figure
                    </p>
                  ) : null}

                  {showEstimate ? (
                    <EstimateNotice className="mt-4">
                      Values and ranges on this slide that are labeled as
                      planning estimates, scenario ranges, or classroom
                      assumptions are not official forecasts.
                    </EstimateNotice>
                  ) : null}

                  {terms.length > 0 ? (
                    <dl className="mt-4 rounded-lg bg-slate-50 p-4">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Plain-language terms
                      </dt>
                      {terms.map(([term, definition]) => (
                        <div key={term} className="mt-3">
                          <dt className="text-sm font-semibold text-[var(--brand-navy)]">
                            {term}
                          </dt>
                          <dd className="mt-1 text-sm leading-relaxed text-slate-700">
                            {definition}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}

                  {slide.sourceOrCitationText ? (
                    <p className="mt-4 text-xs leading-relaxed text-slate-500">
                      {slide.sourceOrCitationText}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
