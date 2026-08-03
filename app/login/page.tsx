import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Login",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const auth = await getAuthContext();
  if (auth) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <div className="mx-auto max-w-md">
      <PageHeader
        eyebrow="Team access"
        title="Sign in to the project tracker"
        description="Use your team email address. A secure magic link will be sent so you can update your assignment status and notes."
      />
      <LoginForm authError={params.error === "auth"} />
    </div>
  );
}
