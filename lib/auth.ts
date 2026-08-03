import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { ProjectMemberRole } from "@/types/database";

export { canEditAssignment } from "@/lib/permissions";

export interface AuthContext {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
  email: string;
  role: ProjectMemberRole | null;
  isProjectLead: boolean;
  isKnownMember: boolean;
}

export async function requireUser(): Promise<AuthContext> {
  const context = await getAuthContext();
  if (!context) {
    redirect("/login");
  }
  return context;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return null;
  }

  const email = user.email.toLowerCase();
  const role = await getProjectRole(supabase, email);
  const isProjectLead = role === "project_lead";
  const isKnownMember = isProjectLead || (await hasAssignedWork(supabase, email));

  return {
    supabase,
    user,
    email,
    role,
    isProjectLead,
    isKnownMember,
  };
}

async function getProjectRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  email: string,
): Promise<ProjectMemberRole | null> {
  const { data, error } = await supabase
    .from("project_members")
    .select("role")
    .eq("email", email)
    .maybeSingle();

  const member = data as { role: ProjectMemberRole } | null;

  if (!error && member) {
    return member.role;
  }

  return null;
}

async function hasAssignedWork(
  supabase: Awaited<ReturnType<typeof createClient>>,
  email: string,
): Promise<boolean> {
  const { count, error } = await supabase
    .from("assignments")
    .select("id", { count: "exact", head: true })
    .eq("assignee_email", email);

  if (error) {
    return false;
  }

  return (count ?? 0) > 0;
}