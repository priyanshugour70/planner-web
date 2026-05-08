"use client";

import { FormEvent, useState } from "react";
import {
  AuthShell,
  Field,
  LinkText,
  PrimaryButton,
  TextInput,
} from "@/components/auth/auth-shell";
import * as AuthApi from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await AuthApi.forgotPassword(email);
      if (!res.success) {
        setError(res.message || "Request failed");
        return;
      }
      setMessage(res.data?.message ?? "Check your email for the next steps.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We will create a reset code for your account. Email delivery is wired separately in production."
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
            {message}
          </p>
        ) : null}
        <Field id="email" label="Email">
          <TextInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
          />
        </Field>
        <PrimaryButton disabled={loading}>{loading ? "Sending…" : "Send reset code"}</PrimaryButton>
      </form>
      <p className="mt-6 text-center text-sm">
        <LinkText href="/reset-password">I already have a code</LinkText>
      </p>
      <p className="mt-2 text-center text-sm">
        <LinkText href="/login">Back to sign in</LinkText>
      </p>
    </AuthShell>
  );
}
