import type { AssignmentRow, Database } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

export type UpdateMyAssignmentArgs =
  Database["public"]["Functions"]["update_my_assignment"]["Args"];

export async function updateMyAssignment(args: UpdateMyAssignmentArgs) {
  const supabase = createClient();
  const { data, error } = await supabase
    .rpc("update_my_assignment", args as never)
    .returns<AssignmentRow>();

  return { data, error };
}
