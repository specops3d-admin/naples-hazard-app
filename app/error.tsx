"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-950 shadow-sm"
      role="alert"
    >
      <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm leading-relaxed">
        {error.message || "The Naples Hazards dashboard could not load this view."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-md bg-[var(--brand-navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-steel)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)]"
      >
        Try again
      </button>
    </div>
  );
}
