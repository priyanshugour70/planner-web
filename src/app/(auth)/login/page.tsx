"use client";

import { FormEvent, useState } from "react";
import { AuthFooterLink, AuthShell } from "@/modules/auth/components/auth-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/modules/auth/hooks/use-auth";

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
          <Alert variant="destructive">
            <AlertTitle>Could not sign in</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <FieldGroup>
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
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <FieldContent>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
              />
            </FieldContent>
          </Field>
        </FieldGroup>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <div className="flex flex-col gap-2 border-t pt-6 text-center text-sm text-muted-foreground">
        <AuthFooterLink href="/signup">Create an account</AuthFooterLink>
        <AuthFooterLink href="/forgot-password">Forgot password?</AuthFooterLink>
        <AuthFooterLink href="/verify-otp?purpose=login">Sign in with email code</AuthFooterLink>
      </div>
    </AuthShell>
  );
}
