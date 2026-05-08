"use client";

import { FormEvent, useState } from "react";
import {
  AuthShell,
  Field,
  LinkText,
  PrimaryButton,
  TextInput,
} from "@/components/auth/auth-shell";
import { useAuth } from "@/hooks/use-auth";

export default function LoginPage() {
  const { signInWithPassword, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await signInWithPassword(email, password);
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Use your work email and password. Sessions work across web and mobile."
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
            autoComplete="email"
            required
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
          />
        </Field>
        <Field id="password" label="Password">
          <TextInput
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
          />
        </Field>
        <PrimaryButton disabled={loading}>{loading ? "Signing in…" : "Sign in"}</PrimaryButton>
      </form>
      <div className="mt-6 flex flex-col gap-3 text-center text-sm text-zinc-600 dark:text-zinc-400">
        <LinkText href="/signup">Create an account</LinkText>
        <LinkText href="/forgot-password">Forgot password?</LinkText>
        <LinkText href="/verify-otp?purpose=login">Sign in with email code</LinkText>
      </div>
    </AuthShell>
  );
}
