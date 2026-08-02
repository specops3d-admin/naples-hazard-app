import { cn } from "@/lib/cn";

export function EstimateNotice({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <aside
      className={cn(
        "border-l-4 border-amber-600 bg-amber-50 px-4 py-3 text-sm text-amber-950",
        className,
      )}
      role="note"
    >
      <p className="font-semibold tracking-wide">Classroom planning estimate</p>
      <p className="mt-1 leading-relaxed">
        {children ??
          "Scenario estimates for casualties, displacement, costs, and budgets are classroom planning ranges, not official forecasts or municipal loss models."}
      </p>
    </aside>
  );
}
