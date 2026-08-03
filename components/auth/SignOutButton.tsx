"use client";

import { useFormStatus } from "react-dom";
import { signOut } from "@/app/actions/auth";

function SignOutButtonInner() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:opacity-70"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

export function SignOutButton() {
  return (
    <form action={signOut}>
      <SignOutButtonInner />
    </form>
  );
}
