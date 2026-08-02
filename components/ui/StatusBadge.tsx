import { cn } from "@/lib/cn";
import { normalizeStatus } from "@/lib/status";

const STYLES: Record<string, string> = {
  "Not Started": "bg-slate-100 text-slate-700 ring-slate-300",
  "Needs Revision": "bg-orange-100 text-orange-950 ring-orange-300",
  "In Progress": "bg-sky-100 text-sky-900 ring-sky-300",
  "Ready for Review": "bg-amber-100 text-amber-950 ring-amber-300",
  Complete: "bg-emerald-100 text-emerald-900 ring-emerald-300",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const normalized = normalizeStatus(status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide ring-1 ring-inset",
        STYLES[normalized] ?? "bg-slate-100 text-slate-700 ring-slate-300",
        className,
      )}
    >
      {normalized}
    </span>
  );
}
