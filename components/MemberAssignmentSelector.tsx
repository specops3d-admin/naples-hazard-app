"use client";

import {
  Suspense,
  useEffect,
  useId,
  useState,
  type ChangeEvent,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type {
  ProjectDataErrorResponse,
  ProjectDataResponse,
  ProjectMember,
} from "@/types/project";

const ALL_MEMBERS_VALUE = "all";
const REFRESH_INTERVAL_MS = 60_000;

function formatTimestamp(date: Date): string {
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function MemberCard({ member }: { member: ProjectMember }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--brand-navy)]">
            {member.member_name || "Unnamed member"}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {member.section || "Section not assigned"}
          </p>
        </div>
        <StatusBadge status={member.status} />
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-slate-500">Slide range</dt>
          <dd className="mt-1 text-slate-800">{member.slides || "—"}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Due date</dt>
          <dd className="mt-1 text-slate-800">{member.due_date || "Not set"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-medium text-slate-500">Task title</dt>
          <dd className="mt-1 text-slate-800">{member.task_title || "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-medium text-slate-500">Notes</dt>
          <dd className="mt-1 text-slate-800">{member.notes || "No notes"}</dd>
        </div>
      </dl>

      <div className="mt-5">
        <ProgressBar
          value={member.progress}
          label={`${member.member_name || "Member"} progress`}
        />
      </div>
    </article>
  );
}

function MemberAssignmentSelectorInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectId = useId();
  const statusId = useId();

  const memberFromUrl = searchParams.get("member");
  const [selectedMemberId, setSelectedMemberId] = useState(
    memberFromUrl && memberFromUrl !== ALL_MEMBERS_VALUE
      ? memberFromUrl
      : ALL_MEMBERS_VALUE,
  );
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  useEffect(() => {
    const nextValue =
      memberFromUrl && memberFromUrl !== ALL_MEMBERS_VALUE
        ? memberFromUrl
        : ALL_MEMBERS_VALUE;
    setSelectedMemberId(nextValue);
  }, [memberFromUrl]);

  useEffect(() => {
    let cancelled = false;

    async function loadProjectData() {
      try {
        const response = await fetch("/api/project-data", {
          cache: "no-store",
        });
        const payload = (await response.json()) as
          | ProjectDataResponse
          | ProjectDataErrorResponse;

        if (!response.ok) {
          const message =
            "error" in payload
              ? payload.error
              : "Unable to load project data.";
          throw new Error(message);
        }

        if (!("members" in payload)) {
          throw new Error("Unable to load project data.");
        }

        if (cancelled) return;

        setMembers(payload.members);
        setError(null);
        setLastUpdated(new Date());
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load project data.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProjectData();
    const intervalId = window.setInterval(() => {
      void loadProjectData();
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  function updateMemberQuery(nextMemberId: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextMemberId === ALL_MEMBERS_VALUE) {
      params.delete("member");
    } else {
      params.set("member", nextMemberId);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  function handleMemberChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextMemberId = event.target.value;
    setSelectedMemberId(nextMemberId);
    updateMemberQuery(nextMemberId);
  }

  async function handleCopyMemberLink() {
    if (selectedMemberId === ALL_MEMBERS_VALUE) {
      return;
    }

    const shareUrl = `${window.location.origin}/workflow?member=${encodeURIComponent(selectedMemberId)}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 2500);
    }
  }

  const knownMemberIds = new Set(members.map((member) => member.member_id));
  const activeMemberId =
    selectedMemberId !== ALL_MEMBERS_VALUE &&
    knownMemberIds.has(selectedMemberId)
      ? selectedMemberId
      : ALL_MEMBERS_VALUE;

  const visibleMembers =
    activeMemberId === ALL_MEMBERS_VALUE
      ? members
      : members.filter((member) => member.member_id === activeMemberId);

  if (loading && members.length === 0) {
    return (
      <section
        aria-busy="true"
        aria-live="polite"
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <p className="text-sm text-slate-600">Loading live project data…</p>
      </section>
    );
  }

  if (error && members.length === 0) {
    return (
      <section
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm"
      >
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-red-950">
          Unable to load project data
        </h2>
        <p className="mt-2 text-sm text-red-900">{error}</p>
      </section>
    );
  }

  if (!loading && members.length === 0) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--brand-navy)]">
          No project members found
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          The shared Google Sheet did not return any team member rows.
        </p>
        {lastUpdated ? (
          <p className="mt-4 text-xs text-slate-500">
            Last updated {formatTimestamp(lastUpdated)}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="space-y-6" aria-labelledby={statusId}>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <h2
              id={statusId}
              className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--brand-navy)]"
            >
              Live team assignments
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Detailed assignment management. Data refreshes automatically from
              the shared Google Sheet every 60 seconds.
            </p>
          </div>
          <p className="text-sm text-slate-600" aria-live="polite">
            {lastUpdated
              ? `Last updated ${formatTimestamp(lastUpdated)}`
              : "Waiting for first update"}
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          >
            Live refresh issue: {error}. Showing the last successful update.
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label htmlFor={selectId} className="block min-w-0 flex-1 text-sm">
            <span className="font-medium text-slate-700">
              Select a team member.
            </span>
            <select
              id={selectId}
              value={activeMemberId}
              onChange={handleMemberChange}
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)]"
            >
              <option value={ALL_MEMBERS_VALUE}>All team members</option>
              {members.map((member) => (
                <option key={member.member_id} value={member.member_id}>
                  {member.member_name || member.member_id}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-2 sm:items-start">
            <button
              type="button"
              onClick={handleCopyMemberLink}
              disabled={activeMemberId === ALL_MEMBERS_VALUE}
              className="inline-flex rounded-md bg-[var(--brand-navy)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-steel)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Copy member link
            </button>
            <p className="min-h-5 text-xs text-slate-600" aria-live="polite">
              {activeMemberId === ALL_MEMBERS_VALUE
                ? "Select a member to copy a shareable link."
                : null}
              {copyState === "copied" ? "Member link copied." : null}
              {copyState === "error"
                ? "Unable to copy link. Copy the URL from the address bar."
                : null}
            </p>
          </div>
        </div>
      </div>

      {activeMemberId !== ALL_MEMBERS_VALUE &&
      !knownMemberIds.has(selectedMemberId) ? (
        <p
          role="status"
          className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          The selected member is not in the current project data. Showing all
          team members.
        </p>
      ) : null}

      <div
        className={
          visibleMembers.length > 1
            ? "grid gap-4 xl:grid-cols-2"
            : "grid gap-4"
        }
      >
        {visibleMembers.map((member) => (
          <MemberCard key={member.member_id} member={member} />
        ))}
      </div>
    </section>
  );
}

function MemberAssignmentSelectorFallback() {
  return (
    <section
      aria-busy="true"
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <p className="text-sm text-slate-600">Loading live project data…</p>
    </section>
  );
}

export function MemberAssignmentSelector() {
  return (
    <Suspense fallback={<MemberAssignmentSelectorFallback />}>
      <MemberAssignmentSelectorInner />
    </Suspense>
  );
}
