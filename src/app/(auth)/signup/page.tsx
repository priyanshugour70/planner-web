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

export default function SignupPage() {
  const { register, loading, error } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await register({ username, email, password, fullName: fullName || undefined });
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Password must be at least 12 characters and include upper, lower, number, and symbol."
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        ) : null}
        <Field id="username" label="Username">
          <TextInput
            id="username"
            name="username"
            autoComplete="username"
            required
            value={username}
            onChange={(ev) => setUsername(ev.target.value)}
          />
        </Field>
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
        <Field id="fullName" label="Full name (optional)">
          <TextInput
            id="fullName"
            name="fullName"
            autoComplete="name"
            value={fullName}
            onChange={(ev) => setFullName(ev.target.value)}
          />
        </Field>
        <Field id="password" label="Password">
          <TextInput
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
          />
        </Field>
        <PrimaryButton disabled={loading}>{loading ? "Creating…" : "Create account"}</PrimaryButton>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account? <LinkText href="/login">Sign in</LinkText>
      </p>
    </AuthShell>
  );
}
