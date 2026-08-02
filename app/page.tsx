import Link from "next/link";
import {
  getOverallCompletion,
  getPriorityHazards,
  getWorkflow,
} from "@/lib/data";
import { progressFromStatus } from "@/lib/status";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EstimateNotice } from "@/components/ui/EstimateNotice";

export default function HomePage() {
  const workflow = getWorkflow();
  const summary = workflow.teamDashboard.projectSummary;
  const completion = getOverallCompletion(workflow);
  const priorities = getPriorityHazards();

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-[var(--brand-navy)] text-white shadow-sm">
        <div className="bg-[linear-gradient(135deg,rgba(180,83,9,0.22),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)] px-6 py-10 sm:px-10 sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
            Naples City Council briefing
          </p>
          <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight sm:text-5xl">
            Naples, Italy Hazards Assessment
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg">
            {workflow.teamDashboard.subtitle}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/presentation"
              className="inline-flex rounded-md bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
            >
              Open final slide plan
            </Link>
            <Link
              href="/hazards"
              className="inline-flex rounded-md border border-white/25 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
            >
              Review hazards
            </Link>
          </div>
        </div>
      </section>

      <EstimateNotice />

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-accent)]">
            Big question
          </h2>
          <p className="mt-3 font-[family-name:var(--font-display)] text-xl leading-snug text-[var(--brand-navy)]">
            {summary.bigQuestion}
          </p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-accent)]">
            Decision question
          </h2>
          <p className="mt-3 font-[family-name:var(--font-display)] text-xl leading-snug text-[var(--brand-navy)]">
            {summary.decisionQuestion}
          </p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--brand-navy)]">
              Overall completion
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Overall completion is the average of the five team-member progress
              values, each derived from Status.
            </p>
          </div>
          <p className="text-4xl font-semibold text-[var(--brand-navy)]">
            {completion.overall}%
          </p>
        </div>
        <div className="mt-5">
          <ProgressBar value={completion.overall} label="Overall completion" />
        </div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Team members", completion.members],
            ["Assignments", completion.assignments],
            ["Final slides", completion.slides],
            ["Timeline", completion.timeline],
            ["Checklist", completion.checklist],
            ["Sources", completion.sources],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg bg-slate-50 px-4 py-3 text-sm"
            >
              <dt className="text-slate-500">{label}</dt>
              <dd className="mt-1 text-lg font-semibold text-[var(--brand-navy)]">
                {value}%
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--brand-navy)]">
            Team member status
          </h2>
          <Link
            href="/workflow"
            className="text-sm font-semibold text-[var(--brand-accent)] underline decoration-amber-300 underline-offset-2 hover:text-amber-950"
          >
            View workflow
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workflow.teamDashboard.members.map((member) => {
            const progress = progressFromStatus(member.status);
            return (
              <article
                key={member.member}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-[var(--brand-navy)]">
                    {member.member}
                  </h3>
                  <StatusBadge status={member.status} />
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  {member.naplesSection}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Final slides {member.finalSlides}
                </p>
                <div className="mt-4">
                  <ProgressBar value={progress} label={`${member.member} progress`} />
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  Handoff: {member.primaryHandoff}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--brand-navy)]">
              Priority hazards
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Ranked in the working deck (slide 25–26) using a classroom
              planning score, not an official risk model.
            </p>
          </div>
          <Link
            href="/hazards#prioritization"
            className="text-sm font-semibold text-[var(--brand-accent)] underline decoration-amber-300 underline-offset-2 hover:text-amber-950"
          >
            Full ranking
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {priorities.map((hazard) => (
            <article
              key={hazard.name}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-accent)]">
                Priority {hazard.rank}
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--brand-navy)]">
                {hazard.name}
              </h3>
              <dl className="mt-4 space-y-2 text-sm text-slate-700">
                <div>
                  <dt className="font-medium text-slate-500">People affected</dt>
                  <dd>{hazard.peopleAffected}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Why critical</dt>
                  <dd>{hazard.whyCritical}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-slate-500">
                Working slide {hazard.slideNumber}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--brand-navy)]">
          Project snapshot
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Audience
            </dt>
            <dd className="mt-1 text-sm text-slate-800">{summary.audience}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Final product
            </dt>
            <dd className="mt-1 text-sm text-slate-800">{summary.finalProduct}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Target length
            </dt>
            <dd className="mt-1 text-sm text-slate-800">{summary.targetLength}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Assigned city
            </dt>
            <dd className="mt-1 text-sm text-slate-800">{summary.assignedCity}</dd>
          </div>
        </dl>
        <div className="mt-6">
          <Link
            href="/presentation"
            className="inline-flex rounded-md bg-[var(--brand-navy)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-steel)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)]"
          >
            Go to the 18-slide final plan
          </Link>
        </div>
      </section>
    </div>
  );
}
