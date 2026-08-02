/**
 * @deprecated Import from `@/lib/status` instead.
 * Kept as a thin re-export so existing imports keep working during migration.
 */
export {
  STATUS_PROGRESS,
  STATUS_FILTER_OPTIONS,
  normalizeStatus,
  progressFromStatus,
  averageProgressFromStatuses as averageProgress,
  overallCompletionFromMembers,
  countByStatus,
} from "@/lib/status";
