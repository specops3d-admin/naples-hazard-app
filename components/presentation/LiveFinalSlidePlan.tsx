"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { parseSlideReferences } from "@/lib/slides";
import {
  averageProgressFromStatuses,
  progressFromStatus,
} from "@/lib/status";
import type {
  FinalSlidePlanDataErrorResponse,
  FinalSlidePlanDataResponse,
  FinalSlidePlanItem,
} from "@/types/final-slide-plan";

const REFRESH_INTERVAL_MS = 60_000;

function formatTimestamp(date: Date): string {
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type LiveFinalSlidePlanProps = {
  availableWorkingSlideNumbers: number[];
};

export function LiveFinalSlidePlan({
  availableWorkingSlideNumbers,
}: LiveFinalSlidePlanProps) {
  const headingId = useId();
  const [slides, setSlides] = useState<FinalSlidePlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mountedRef = useRef(true);
  const availableWorkingSlides = new Set(availableWorkingSlideNumbers);

  async function loadFinalSlidePlanData(options?: { manual?: boolean }) {
    if (options?.manual) {
      setRefreshing(true);
    }

    try {
      const response = await fetch("/api/final-slide-plan-data", {
        cache: "no-store",
      });
      const payload = (await response.json()) as
        | FinalSlidePlanDataResponse
        | FinalSlidePlanDataErrorResponse;

      if (!response.ok) {
        const message =
          "error" in payload
            ? payload.error
            : "Unable to load final slide plan data.";
        throw new Error(message);
      }

      if (!("slides" in payload)) {
        throw new Error("Unable to load final slide plan data.");
      }

      if (!mountedRef.current) return;

      setSlides(payload.slides);
      setError(null);
      setLastUpdated(new Date());
    } catch (loadError) {
      if (!mountedRef.current) return;
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load final slide plan data.",
      );
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true;

    void loadFinalSlidePlanData();
    const intervalId = window.setInterval(() => {
      void loadFinalSlidePlanData();
    }, REFRESH_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      window.clearInterval(intervalId);
    };
    // Initial load + interval only; manual refresh calls loadFinalSlidePlanData directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const planProgress = averageProgressFromStatuses(
    slides.map((slide) => slide.status),
  );

  if (loading && slides.length === 0) {
    return (
      <section
        aria-busy="true"
        aria-live="polite"
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <p className="text-sm text-slate-600">
          Loading live final slide plan…
        </p>
      </section>
    );
  }

  if (error && slides.length === 0) {
    return (
      <section
        role="alert"
        className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm"
      >
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-red-950">
            Unable to load final slide plan
          </h2>
          <p className="mt-2 text-sm text-red-900">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => void loadFinalSlidePlanData({ manual: true })}
          disabled={refreshing}
          className="inline-flex rounded-md bg-[var(--brand-navy)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-steel)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        aria-labelledby={headingId}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2
              id={headingId}
              className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--brand-navy)]"
            >
              18-slide final plan
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Owner, required content, suggested visual, source check, and status
              for each final slide. Refreshes automatically every 60 seconds.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <p className="text-sm font-semibold text-[var(--brand-navy)]">
              Plan progress: {planProgress}%
            </p>
            <button
              type="button"
              onClick={() => void loadFinalSlidePlanData({ manual: true })}
              disabled={refreshing}
              className="inline-flex rounded-md bg-[var(--brand-navy)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-steel)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <p className="text-xs text-slate-600" aria-live="polite">
              {lastUpdated
                ? `Last updated ${formatTimestamp(lastUpdated)}`
                : "Waiting for first update"}
            </p>
          </div>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          >
            Live refresh issue: {error}. Showing the last successful update.
          </p>
        ) : null}

        <div className="mt-4 max-w-md">
          <ProgressBar value={planProgress} label="Final slide plan progress" />
        </div>
      </section>

      <div className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        Final slide status is managed in the shared Google Sheet.
      </div>

      {!loading && slides.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--brand-navy)]">
            No final slides found
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            The Final Slide Plan sheet did not return any rows after the header.
          </p>
        </section>
      ) : (
        <ol className="space-y-4">
          {slides.map((slide, index) => {
            const draftRefs = parseSlideReferences(
              slide.existing_draft_slides,
            );
            const key = `${slide.final_number}-${slide.slide_title}-${index}`;

            return (
              <li key={key}>
                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-accent)]">
                        Final slide {slide.final_number}
                      </p>
                      <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--brand-navy)]">
                        {slide.slide_title}
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
                        {slide.required_content_takeaway}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">
                        Suggested visual
                      </dt>
                      <dd className="mt-1 leading-relaxed">
                        {slide.suggested_visual}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">
                        Citation / source check
                      </dt>
                      <dd className="mt-1 leading-relaxed">
                        {slide.citation_source_check}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">
                        Existing draft slides
                      </dt>
                      <dd className="mt-1 leading-relaxed">
                        {slide.existing_draft_slides}
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
                      label={`Final slide ${slide.final_number} progress`}
                    />
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
