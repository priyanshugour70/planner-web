"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AuthShell,
  Field,
  LinkText,
  PrimaryButton,
  TextInput,
} from "@/components/auth/auth-shell";
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
        router.push("/");
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
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        ) : null}
        {info ? (
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
            {info}
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
        <div className="flex gap-2">
          <PrimaryButton
            className="flex-1"
            type="button"
            disabled={sending || !email}
            onClick={() => void send()}
          >
            {sending ? "Sending…" : "Send code"}
          </PrimaryButton>
        </div>
        <Field id="code" label="One-time code">
          <TextInput
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(ev) => setCode(ev.target.value)}
          />
        </Field>
        <PrimaryButton disabled={loading}>{loading ? "Verifying…" : "Verify and continue"}</PrimaryButton>
      </form>
      <p className="mt-6 text-center text-sm">
        <LinkText href="/login">Password sign in</LinkText>
      </p>
    </AuthShell>
  );
}
