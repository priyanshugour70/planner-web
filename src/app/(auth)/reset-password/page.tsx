"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AuthShell,
  Field,
  LinkText,
  PrimaryButton,
  TextInput,
} from "@/components/auth/auth-shell";
import * as AuthApi from "@/services/auth.service";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await AuthApi.resetPassword({ email, code, newPassword });
      if (!res.success) {
        setError(res.message || "Reset failed");
        return;
      }
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter the code from your email and choose a new password."
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        ) : null}
        <Field id="email" label="Email">
          <TextInput
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
          />
        </Field>
        <Field id="code" label="Reset code">
          <TextInput
            id="code"
            name="code"
            required
            autoComplete="one-time-code"
            value={code}
            onChange={(ev) => setCode(ev.target.value)}
          />
        </Field>
        <Field id="newPassword" label="New password">
          <TextInput
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(ev) => setNewPassword(ev.target.value)}
          />
        </Field>
        <PrimaryButton disabled={loading}>{loading ? "Saving…" : "Update password"}</PrimaryButton>
      </form>
      <p className="mt-6 text-center text-sm">
        <LinkText href="/login">Back to sign in</LinkText>
      </p>
    </AuthShell>
  );
}
