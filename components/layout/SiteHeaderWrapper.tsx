import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/layout/SiteHeader";

export async function SiteHeaderWrapper() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <SiteHeader userEmail={user?.email ?? null} />;
}
