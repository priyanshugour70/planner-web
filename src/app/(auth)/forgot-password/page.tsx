"use client";

import { FormEvent, useState } from "react";
import { AuthFooterLink, AuthShell } from "@/modules/auth/components/auth-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import * as AuthApi from "@/modules/auth/services/auth.service";

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
          <Alert variant="destructive">
            <AlertTitle>Request failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {message ? (
          <Alert>
            <AlertTitle>Check your inbox</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
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
        </FieldGroup>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Sending…" : "Send reset code"}
        </Button>
      </form>
      <div className="flex flex-col gap-2 border-t pt-6 text-center text-sm">
        <AuthFooterLink href="/reset-password">I already have a code</AuthFooterLink>
        <AuthFooterLink href="/login">Back to sign in</AuthFooterLink>
      </div>
    </AuthShell>
  );
}
