"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthFooterLink, AuthShell } from "@/modules/auth/components/auth-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import * as AuthApi from "@/modules/auth/services/auth.service";

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
          <Alert variant="destructive">
            <AlertTitle>Reset failed</AlertTitle>
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
                required
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="code">Reset code</FieldLabel>
            <FieldContent>
              <Input
                id="code"
                name="code"
                required
                autoComplete="one-time-code"
                value={code}
                onChange={(ev) => setCode(ev.target.value)}
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="newPassword">New password</FieldLabel>
            <FieldContent>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(ev) => setNewPassword(ev.target.value)}
              />
            </FieldContent>
          </Field>
        </FieldGroup>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Saving…" : "Update password"}
        </Button>
      </form>
      <p className="border-t pt-6 text-center text-sm">
        <AuthFooterLink href="/login">Back to sign in</AuthFooterLink>
      </p>
    </AuthShell>
  );
}
