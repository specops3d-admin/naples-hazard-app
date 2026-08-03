import type { AssignmentRow } from "@/types/database";
import { createClient } from "@/lib/supabase/server";

export async function fetchAssignments(): Promise<{
  assignments: AssignmentRow[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assignments")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    return { assignments: [], error: error.message };
  }

  return { assignments: data ?? [], error: null };
}
