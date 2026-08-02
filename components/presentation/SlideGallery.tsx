"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import type { PresentationSlide } from "@/types/presentation";
import { getSlideImagePath } from "@/lib/slides";

export function SlideGallery({ slides }: { slides: PresentationSlide[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  const activeSlide =
    activeIndex === null ? null : (slides[activeIndex] ?? null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (activeSlide) {
      if (!dialog.open) dialog.showModal();
      closeButtonRef.current?.focus();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [activeSlide]);

  useEffect(() => {
    if (activeIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setActiveIndex((index) =>
          index === null ? index : Math.min(slides.length - 1, index + 1),
        );
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveIndex((index) =>
          index === null ? index : Math.max(0, index - 1),
        );
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, slides.length]);

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {slides.map((slide, index) => {
          const src = getSlideImagePath(slide.slideNumber);
          return (
            <button
              key={slide.slideNumber}
              id={`gallery-slide-${slide.slideNumber}`}
              type="button"
              className="group scroll-mt-28 overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition-colors hover:border-[var(--brand-accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)]"
              onClick={() => setActiveIndex(index)}
              aria-label={`Open larger view of working slide ${slide.slideNumber}: ${slide.title}`}
            >
              <div className="relative aspect-[16/9] bg-slate-100">
                <Image
                  src={src}
                  alt={`Working slide ${slide.slideNumber}: ${slide.title}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="border-t border-slate-100 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-accent)]">
                  Slide {slide.slideNumber}
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--brand-navy)] group-hover:underline">
                  {slide.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">{slide.section}</p>
              </div>
            </button>
          );
        })}
      </div>

      <dialog
        ref={dialogRef}
        className="m-auto w-[min(96vw,1100px)] max-h-[92vh] overflow-hidden rounded-xl border-0 bg-white p-0 text-[var(--brand-navy)] shadow-2xl backdrop:bg-slate-950/70"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClose={() => setActiveIndex(null)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setActiveIndex(null);
        }}
      >
        {activeSlide ? (
          <div className="flex max-h-[92vh] flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-5">
              <div>
                <p
                  id={titleId}
                  className="font-[family-name:var(--font-display)] text-lg font-semibold"
                >
                  Working slide {activeSlide.slideNumber}: {activeSlide.title}
                </p>
                <p id={descId} className="mt-1 text-sm text-slate-600">
                  {activeSlide.section}
                  {activeSlide.subtitle ? ` — ${activeSlide.subtitle}` : ""}
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)]"
                onClick={() => setActiveIndex(null)}
              >
                Close
              </button>
            </div>

            <div className="relative min-h-0 flex-1 bg-slate-100 px-3 py-4 sm:px-6">
              <div className="relative mx-auto aspect-[16/9] max-h-[60vh] w-full">
                <Image
                  src={getSlideImagePath(activeSlide.slideNumber)}
                  alt={`Enlarged working slide ${activeSlide.slideNumber}: ${activeSlide.title}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  preload
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:px-5">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)]"
                onClick={() =>
                  setActiveIndex((index) =>
                    index === null ? index : Math.max(0, index - 1),
                  )
                }
                disabled={activeIndex === 0}
              >
                Previous
              </button>
              <p className="text-sm text-slate-600">
                {(activeIndex ?? 0) + 1} of {slides.length}
              </p>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)]"
                onClick={() =>
                  setActiveIndex((index) =>
                    index === null
                      ? index
                      : Math.min(slides.length - 1, index + 1),
                  )
                }
                disabled={activeIndex === slides.length - 1}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
