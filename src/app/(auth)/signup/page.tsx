"use client";

import { FormEvent, useState } from "react";
import { AuthFooterLink, AuthShell } from "@/components/auth/auth-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
          <Alert variant="destructive">
            <AlertTitle>Signup failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <FieldContent>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                required
                value={username}
                onChange={(ev) => setUsername(ev.target.value)}
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <FieldContent>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="fullName">Full name (optional)</FieldLabel>
            <FieldContent>
              <Input
                id="fullName"
                name="fullName"
                autoComplete="name"
                value={fullName}
                onChange={(ev) => setFullName(ev.target.value)}
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <FieldContent>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
              />
            </FieldContent>
          </Field>
        </FieldGroup>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </Button>
      </form>
      <p className="border-t pt-6 text-center text-sm text-muted-foreground">
        Already have an account? <AuthFooterLink href="/login">Sign in</AuthFooterLink>
      </p>
    </AuthShell>
  );
}
