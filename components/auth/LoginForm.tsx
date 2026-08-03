"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type LoginState = "idle" | "loading" | "sent" | "error";

export function LoginForm({ authError }: { authError?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<LoginState>(authError ? "error" : "idle");
  const [message, setMessage] = useState(
    authError
      ? "The sign-in link could not be verified. Request a new magic link."
      : "",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage("");

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/confirm?next=/dashboard`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setState("error");
      setMessage(error.message);
      return;
    }

    setState("sent");
    setMessage(
      "Check your inbox for a magic link. It will return you to the dashboard after sign-in.",
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          Team email address
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={state === "loading" || state === "sent"}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)] disabled:bg-slate-50"
            placeholder="you@example.com"
          />
        </label>

        <button
          type="submit"
          disabled={state === "loading" || state === "sent"}
          className="inline-flex w-full items-center justify-center rounded-md bg-[var(--brand-navy)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-steel)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {state === "loading" ? "Sending magic link…" : "Send magic link"}
        </button>
      </form>

      {state === "sent" ? (
        <p
          role="status"
          className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
        >
          {message}
        </p>
      ) : null}

      {state === "error" ? (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
        >
          {message || "Unable to send the magic link. Try again."}
        </p>
      ) : null}
    </section>
  );
}
