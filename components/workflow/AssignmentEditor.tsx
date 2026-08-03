"use client";

import { useState } from "react";
import type { AssignmentRow } from "@/types/database";
import { updateMyAssignment } from "@/lib/supabase/rpc";

type SaveState = "idle" | "saving" | "success" | "error";

export function AssignmentEditor({
  assignment,
  canEdit,
  onUpdated,
}: {
  assignment: AssignmentRow;
  canEdit: boolean;
  onUpdated?: (assignment: AssignmentRow) => void;
}) {
  const [displayName, setDisplayName] = useState(assignment.display_name);
  const [status, setStatus] = useState(assignment.status);
  const [notes, setNotes] = useState(assignment.notes ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSave() {
    if (!canEdit) {
      return;
    }

    setSaveState("saving");
    setErrorMessage("");

    const { data, error } = await updateMyAssignment({
      p_external_key: assignment.external_key,
      p_display_name: displayName.trim(),
      p_status: status,
      p_notes: notes.trim() || null,
    });

    if (error) {
      setSaveState("error");
      setErrorMessage(error.message);
      return;
    }

    setSaveState("success");
    if (data) {
      onUpdated?.(data);
    }

    window.setTimeout(() => setSaveState("idle"), 2500);
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--brand-navy)]">
            {assignment.display_name}
          </h3>
          <p className="mt-1 text-sm text-slate-600">{assignment.section}</p>
        </div>
        {!canEdit ? (
          <p className="rounded-md bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            Read only
          </p>
        ) : null}
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-slate-500">Slides</dt>
          <dd className="text-slate-800">{assignment.slides}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Task</dt>
          <dd className="text-slate-800">{assignment.task_title}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Assignee email</dt>
          <dd className="break-all text-slate-800">{assignment.assignee_email}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500">Due date</dt>
          <dd className="text-slate-800">{assignment.due_date || "Not set"}</dd>
        </div>
      </dl>

      {canEdit ? (
        <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
          <label className="block text-sm font-medium text-slate-700">
            Display name
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)]"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)]"
            >
              <option value="Not Started">Not Started</option>
              <option value="Needs Revision">Needs Revision</option>
              <option value="In Progress">In Progress</option>
              <option value="Ready for Review">Ready for Review</option>
              <option value="Complete">Complete</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)]"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saveState === "saving"}
              className="inline-flex rounded-md bg-[var(--brand-navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-steel)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saveState === "saving" ? "Saving…" : "Save changes"}
            </button>
            {saveState === "success" ? (
              <p role="status" className="text-sm font-medium text-emerald-700">
                Saved successfully.
              </p>
            ) : null}
            {saveState === "error" ? (
              <p role="alert" className="text-sm font-medium text-red-700">
                {errorMessage || "Unable to save changes."}
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm text-slate-700">
          <p>
            <span className="font-medium text-slate-500">Status:</span>{" "}
            {assignment.status}
          </p>
          {assignment.notes ? (
            <p>
              <span className="font-medium text-slate-500">Notes:</span>{" "}
              {assignment.notes}
            </p>
          ) : null}
        </div>
      )}
    </article>
  );
}
