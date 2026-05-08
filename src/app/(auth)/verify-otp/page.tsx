"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthFooterLink, AuthShell } from "@/components/auth/auth-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import * as AuthApi from "@/services/auth.service";
import { useAuthStore } from "@/store/auth-store";

const purposes = [
  "login",
  "email_verification",
  "password_reset",
  "phone_verification",
  "two_factor",
] as const;

type Purpose = (typeof purposes)[number];

function parsePurpose(raw: string | null): Purpose {
  if (raw && (purposes as readonly string[]).includes(raw)) return raw as Purpose;
  return "login";
}

export default function VerifyOtpPage() {
  const router = useRouter();
  const search = useSearchParams();
  const purpose = useMemo(() => parsePurpose(search.get("purpose")), [search]);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function send(e?: FormEvent) {
    e?.preventDefault();
    setSending(true);
    setError(null);
    setInfo(null);
    try {
      const res = await AuthApi.sendOtp({ email, purpose });
      if (!res.success) {
        setError(res.message || "Could not send code");
        return;
      }
      setInfo(res.data?.devOtp ? `Dev OTP: ${res.data.devOtp}` : res.data?.message ?? "Code sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setSending(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await AuthApi.verifyOtp({ email, code, purpose });
      if (!res.success || !res.data) {
        setError(res.message || "Verification failed");
        return;
      }
      if ("accessToken" in res.data && "refreshToken" in res.data) {
        useAuthStore.getState().setSession({
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          user: res.data.user,
        });
        router.push("/dashboard");
        return;
      }
      setInfo("Verified.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Verify email code"
      subtitle={`Purpose: ${purpose}. Codes expire in 10 minutes with resend cooldown.`}
    >
      <form className="space-y-5" onSubmit={verify}>
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Verification</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {info ? (
          <Alert>
            <AlertTitle>Update</AlertTitle>
            <AlertDescription>{info}</AlertDescription>
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
        </FieldGroup>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={sending || !email}
          onClick={() => void send()}
        >
          {sending ? "Sending…" : "Send code"}
        </Button>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="code">One-time code</FieldLabel>
            <FieldContent>
              <Input
                id="code"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(ev) => setCode(ev.target.value)}
              />
            </FieldContent>
          </Field>
        </FieldGroup>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Verifying…" : "Verify and continue"}
        </Button>
      </form>
      <p className="border-t pt-6 text-center text-sm">
        <AuthFooterLink href="/login">Password sign in</AuthFooterLink>
      </p>
    </AuthShell>
  );
}
